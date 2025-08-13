# Web Conversion Optimizer - デプロイメントガイド

## 🚀 デプロイメント概要

このプロジェクトは以下の構成でデプロイします：

- **フロントエンド + API**: Vercel（Next.js App Router）
- **スクレイパーサービス**: Railway（Docker + Puppeteer）
- **データベース**: Vercel KV（Redis）+ IndexedDB（クライアント側）

## 📋 必要なサービス・API

### 1. 必須サービス
- [Vercel](https://vercel.com/) - フロントエンドホスティング
- [Railway](https://railway.app/) - スクレイパーサービス
- [Vercel KV](https://vercel.com/storage/kv) - ジョブキュー用Redis

### 2. 推奨サービス（オプション）
- [OpenAI API](https://openai.com/api/) - 高度な分析
- [Anthropic API](https://anthropic.com/) - Claude分析
- [Google PageSpeed API](https://developers.google.com/speed/docs/insights/v5/get-started) - Lighthouse分析
- [Sentry](https://sentry.io/) - エラートラッキング

## 🛠️ 1. 事前準備

### 環境変数ファイルの作成
```bash
cp .env.example .env.local
```

### 必要なAPIキーの取得
1. **Vercel KV** - Vercelダッシュボードから作成
2. **OpenAI API Key** - https://platform.openai.com/api-keys
3. **Google PageSpeed API Key** - Google Cloud Consoleから取得
4. **独自APIキー** - スクレイパーサービス用（ランダム生成）

```bash
# APIキー生成例
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🎯 2. Vercel デプロイメント

### A. Vercelプロジェクト作成
```bash
# Vercel CLIインストール
npm i -g vercel

# プロジェクトルートでログイン
vercel login

# デプロイ開始
vercel --prod
```

### B. 環境変数設定
Vercelダッシュボード > Settings > Environment Variablesで設定：

```env
# 必須
NODE_ENV=production
SCRAPER_SERVICE_URL=https://your-scraper-service.railway.app
SCRAPER_SERVICE_API_KEY=your-generated-api-key

# Vercel KV（自動で追加される）
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# オプション（推奨）
OPENAI_API_KEY=sk-...
GOOGLE_PAGESPEED_API_KEY=...
SENTRY_DSN=...
```

### C. ビルド設定
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

## 🚂 3. Railway デプロイメント

### A. Railwayプロジェクト作成
1. [Railway.app](https://railway.app/)にサインアップ
2. GitHub連携でリポジトリ接続
3. `scraper-service` フォルダを選択

### B. 環境変数設定
Railwayダッシュボードで以下を設定：

```env
NODE_ENV=production
PORT=3001
API_KEY=your-generated-api-key
LIGHTHOUSE_TIMEOUT=60000
PUPPETEER_TIMEOUT=30000
MAX_CONCURRENT_BROWSERS=2
ENABLE_SCREENSHOTS=true
```

### C. リソース設定
- **Memory**: 1GB以上推奨
- **CPU**: 1vCPU以上推奨
- **Region**: US West（推奨）

## 🔧 4. 詳細設定

### A. パフォーマンス最適化

#### Vercel設定
```json
{
  "functions": {
    "frontend/src/app/api/analyze/*.ts": {
      "maxDuration": 300,
      "memory": 3008
    }
  }
}
```

#### Railway設定
```dockerfile
# メモリ最適化
ENV NODE_OPTIONS="--max-old-space-size=1024"
```

### B. セキュリティ設定

#### セキュリティヘッダー（vercel.json）
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

#### API認証
- スクレイパーサービス: APIキー認証
- レート制限: IP別・時間別

### C. モニタリング設定

#### Vercel Analytics
```bash
npm install @vercel/analytics
```

#### Sentry（エラートラッキング）
```bash
npm install @sentry/nextjs
```

## 📊 5. ヘルスチェック

### デプロイ後の動作確認

#### フロントエンド
```bash
curl https://your-app.vercel.app/api/health
```

#### スクレイパーサービス
```bash
curl https://your-scraper.railway.app/health
```

#### 統合テスト
```bash
curl -X POST https://your-app.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## 🐛 6. トラブルシューティング

### よくある問題

#### 1. スクレイパーサービスタイムアウト
**原因**: Puppeteerのメモリ不足
**解決**: Railway のメモリを2GB以上に増加

#### 2. Vercel Function タイムアウト
**原因**: 分析処理時間の超過
**解決**: 
- maxDuration を300秒に設定
- スクレイパーサービスのタイムアウト調整

#### 3. CORS エラー
**原因**: APIアクセス権限
**解決**: vercel.json のヘッダー設定確認

### ログ確認方法

#### Vercel
```bash
vercel logs --follow
```

#### Railway
Railway ダッシュボード > Deployments > Logs

## 🔄 7. CI/CD パイプライン

### GitHub Actions（オプション）
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 📈 8. 本番運用

### スケーリング
- **Vercel**: 自動スケーリング
- **Railway**: 必要に応じてリソース増強

### バックアップ
- **データ**: IndexedDB（ローカル）+ エクスポート機能
- **設定**: 環境変数のバックアップ

### メンテナンス
- **依存関係**: 月次アップデート
- **セキュリティ**: 脆弱性スキャン
- **パフォーマンス**: 定期的な最適化

## 🆘 サポート

問題が発生した場合：
1. ログの確認
2. 環境変数の検証
3. APIキーの有効性確認
4. サービス状態の確認

**デプロイメント完了後、本格的なWeb Conversion Optimizerが利用可能になります！**