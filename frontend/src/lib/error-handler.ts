import { log, formatError } from './logger';

/**
 * カスタムエラークラスの基底クラス
 */
export abstract class BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.details = details;

    // スタックトレースをキャプチャ
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * エラーをJSON形式に変換
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      details: this.details,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, true, details);
  }
}

/**
 * 認証エラー
 */
export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401, true);
  }
}

/**
 * 認可エラー
 */
export class AuthorizationError extends BaseError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403, true);
  }
}

/**
 * リソースが見つからないエラー
 */
export class NotFoundError extends BaseError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, true, { resource, identifier });
  }
}

/**
 * 競合エラー
 */
export class ConflictError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CONFLICT', 409, true, details);
  }
}

/**
 * レート制限エラー
 */
export class RateLimitError extends BaseError {
  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429, true, { retryAfter });
  }
}

/**
 * 外部サービスエラー
 */
export class ExternalServiceError extends BaseError {
  constructor(service: string, originalError?: unknown) {
    const message = `External service '${service}' is unavailable`;
    super(message, 'EXTERNAL_SERVICE_ERROR', 503, true, {
      service,
      originalError: formatError(originalError)
    });
  }
}

/**
 * タイムアウトエラー
 */
export class TimeoutError extends BaseError {
  constructor(operation: string, timeout: number) {
    const message = `Operation '${operation}' timed out after ${timeout}ms`;
    super(message, 'TIMEOUT', 504, true, { operation, timeout });
  }
}

/**
 * 内部サーバーエラー
 */
export class InternalServerError extends BaseError {
  constructor(message: string = 'Internal server error', details?: Record<string, any>) {
    super(message, 'INTERNAL_SERVER_ERROR', 500, false, details);
  }
}

/**
 * エラータイプを判定
 */
export const isOperationalError = (error: unknown): boolean => {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
};

/**
 * リトライ可能なエラーかどうかを判定
 */
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof BaseError) {
    // ネットワークエラー、タイムアウト、外部サービスエラーはリトライ可能
    return [408, 429, 502, 503, 504].includes(error.statusCode);
  }
  
  // ネットワークエラーをチェック
  if (error instanceof Error) {
    const retryableMessages = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
      'EPIPE',
      'EHOSTUNREACH'
    ];
    return retryableMessages.some(msg => error.message.includes(msg));
  }
  
  return false;
};

/**
 * 指数バックオフによるリトライ
 */
export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    onRetry
  } = options;

  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // リトライ不可能なエラーの場合は即座に失敗
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // 最後の試行の場合はエラーをスロー
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // リトライコールバックを実行
      if (onRetry) {
        onRetry(attempt, error);
      }
      
      // 指数バックオフで待機
      const delay = Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay);
      
      log.warn({
        attempt,
        maxAttempts,
        delay,
        error: formatError(error)
      }, `Retrying operation after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * エラーハンドリングミドルウェア（APIルート用）
 */
export const handleApiError = (error: unknown): Response => {
  // ログ出力
  if (isOperationalError(error)) {
    log.warn({ error: formatError(error) }, 'Operational error occurred');
  } else {
    log.error(error, {}, 'Unexpected error occurred');
  }

  // BaseErrorの場合は適切なステータスコードで返す
  if (error instanceof BaseError) {
    return new Response(
      JSON.stringify(error.toJSON()),
      {
        status: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          ...(error instanceof RateLimitError && error.details?.retryAfter
            ? { 'Retry-After': String(error.details.retryAfter) }
            : {})
        }
      }
    );
  }

  // その他のエラーは500エラーとして返す
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return new Response(
    JSON.stringify({
      name: 'InternalServerError',
      message: isDevelopment 
        ? (error instanceof Error ? error.message : String(error))
        : 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
      timestamp: new Date(),
      stack: isDevelopment && error instanceof Error ? error.stack : undefined
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
};

/**
 * 非同期関数のエラーをキャッチするラッパー
 */
export const asyncHandler = <T extends (...args: any[]) => Promise<any>>(
  fn: T
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
};

/**
 * エラー境界用のフォールバック関数
 */
export const errorBoundaryFallback = (error: Error, errorInfo: { componentStack: string }) => {
  log.error(error, {
    componentStack: errorInfo.componentStack
  }, 'React error boundary caught an error');
  
  // 開発環境ではエラーの詳細を表示
  if (process.env.NODE_ENV === 'development') {
    return {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    };
  }
  
  // 本番環境では汎用的なメッセージを表示
  return {
    message: 'Something went wrong. Please try again later.'
  };
};