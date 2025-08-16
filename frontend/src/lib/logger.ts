import pino from 'pino';

/**
 * ログレベルの定義
 */
export const LOG_LEVELS = {
  FATAL: 'fatal',
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace'
} as const;

/**
 * 環境に応じたログレベルを取得
 */
const getLogLevel = (): string => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  
  // 環境に応じたデフォルトログレベル
  switch (process.env.NODE_ENV) {
    case 'production':
      return LOG_LEVELS.INFO;
    case 'test':
      return LOG_LEVELS.ERROR;
    default:
      return LOG_LEVELS.DEBUG;
  }
};

/**
 * ブラウザ環境かサーバー環境かを判定
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Pinoロガーの設定
 */
const createLogger = () => {
  const options: pino.LoggerOptions = {
    level: getLogLevel(),
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
      bindings: (bindings) => {
        return {
          pid: bindings.pid,
          hostname: bindings.hostname,
          environment: process.env.NODE_ENV || 'development'
        };
      }
    },
    // ブラウザ環境では簡略化された設定を使用
    browser: isBrowser ? {
      asObject: false,
      serialize: true
    } : undefined,
    // 本番環境では高速化のため、prettierを使用しない
    ...(process.env.NODE_ENV !== 'production' && !isBrowser ? {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
          singleLine: false,
          messageFormat: '{msg}',
          errorLikeObjectKeys: ['err', 'error'],
          errorProps: 'message,stack,type,code'
        }
      }
    } : {})
  };

  return pino(options);
};

/**
 * シングルトンロガーインスタンス
 */
const logger = createLogger();

/**
 * エラーオブジェクトをログ用に整形
 */
export const formatError = (error: unknown): Record<string, any> => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...(error as any) // その他のカスタムプロパティを含める
    };
  }
  
  return {
    message: String(error),
    type: typeof error
  };
};

/**
 * リクエストコンテキストを含むロガーを作成
 */
export const createRequestLogger = (requestId: string, url?: string, method?: string) => {
  return logger.child({
    requestId,
    url,
    method,
    timestamp: new Date().toISOString()
  });
};

/**
 * パフォーマンス計測用のヘルパー
 */
export class PerformanceLogger {
  private startTime: number;
  private logger: pino.Logger;
  private operation: string;

  constructor(operation: string, logger: pino.Logger = getLogger()) {
    this.operation = operation;
    this.startTime = Date.now();
    this.logger = logger;
    
    this.logger.debug({ operation }, `Starting ${operation}`);
  }

  /**
   * 操作を完了してパフォーマンスをログ出力
   */
  end(metadata?: Record<string, any>): number {
    const duration = Date.now() - this.startTime;
    
    this.logger.info({
      operation: this.operation,
      duration,
      ...metadata
    }, `Completed ${this.operation} in ${duration}ms`);
    
    return duration;
  }

  /**
   * エラーでの終了
   */
  error(error: unknown, metadata?: Record<string, any>): number {
    const duration = Date.now() - this.startTime;
    
    this.logger.error({
      operation: this.operation,
      duration,
      error: formatError(error),
      ...metadata
    }, `Failed ${this.operation} after ${duration}ms`);
    
    return duration;
  }
}

/**
 * 構造化ログのヘルパー関数
 */
export const log = {
  fatal: (data: Record<string, any>, message?: string) => {
    logger.fatal(data, message);
  },
  
  error: (error: unknown, context?: Record<string, any>, message?: string) => {
    logger.error({
      ...context,
      error: formatError(error)
    }, message || 'An error occurred');
  },
  
  warn: (data: Record<string, any>, message?: string) => {
    logger.warn(data, message);
  },
  
  info: (data: Record<string, any>, message?: string) => {
    logger.info(data, message);
  },
  
  debug: (data: Record<string, any>, message?: string) => {
    logger.debug(data, message);
  },
  
  trace: (data: Record<string, any>, message?: string) => {
    logger.trace(data, message);
  }
};

/**
 * APIルートで使用するログミドルウェア
 */
export const withRequestLogging = async (
  request: Request,
  handler: (req: Request, logger: pino.Logger) => Promise<Response>
): Promise<Response> => {
  const requestId = crypto.randomUUID();
  const requestLogger = createRequestLogger(
    requestId,
    request.url,
    request.method
  );
  
  const perfLogger = new PerformanceLogger('API Request', requestLogger);
  
  try {
    // リクエストボディを取得（必要な場合）
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        const body = await request.clone().json();
        requestLogger.debug({ body }, 'Request body');
      } catch {
        // ボディの解析に失敗しても続行
      }
    }
    
    // ハンドラーを実行
    const response = await handler(request, requestLogger);
    
    // レスポンスをログ
    perfLogger.end({
      status: response.status,
      statusText: response.statusText
    });
    
    // レスポンスヘッダーにリクエストIDを追加
    const headers = new Headers(response.headers);
    headers.set('X-Request-Id', requestId);
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
    
  } catch (error) {
    perfLogger.error(error);
    
    // エラーレスポンスを返す
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        requestId,
        message: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': requestId
        }
      }
    );
  }
};

// デフォルトロガーを取得する関数
export const getLogger = () => logger;

// デフォルトエクスポート
export default logger;