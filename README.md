# Web Conversion Optimizer (WCO)

🚀 AI-powered web page conversion rate optimization tool that analyzes websites and provides actionable improvement recommendations.

## ✨ Features

- **🔍 Deep Analysis**: 100+ checkpoint comprehensive website analysis
- **🧠 AI-Powered Insights**: Claude & GPT-4 powered psychological and UX analysis
- **💾 Local Storage**: IndexedDB-based analysis history management
- **📊 Visual Reports**: Interactive reports with heatmaps and before/after comparisons
- **🎯 Multi-Conversion Support**: Phone, form, email, and chat conversions
- **📱 Mobile-First**: Responsive design analysis and recommendations

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│   Backend API   │◄──►│ Scraper Service │
│   (Next.js)     │    │ (Next.js API)   │    │ (Puppeteer)     │
│   - React UI    │    │ - Job Queue     │    │ - Lighthouse    │
│   - IndexedDB   │    │ - AI Analysis   │    │ - Screenshots   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ▲                        ▲
        │                        │
        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│  Browser Store  │    │   External APIs │
│  - IndexedDB    │    │  - OpenAI/Claude│
│  - LocalStorage │    │  - PageSpeed    │
└─────────────────┘    │  - Cloudinary   │
                       └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript
- **Storage**: IndexedDB + LocalStorage

### Backend
- **API**: Next.js API Routes
- **AI**: OpenAI GPT-4o + Claude API
- **Data**: Vercel KV + Vercel Postgres
- **Images**: Cloudinary

### Scraper Service
- **Platform**: Railway (Docker)
- **Engine**: Puppeteer + Lighthouse
- **API**: Express.js

## 🚀 Quick Start

### 自動セットアップ（推奨）
```bash
# プロジェクトをクローン
git clone <repository-url>
cd cv_optimization

# 自動セットアップスクリプトを実行
./setup.sh

# 開発サーバーを起動
./start-dev.sh
```

### 手動セットアップ
```bash
# 環境変数ファイルを作成
cp .env.example .env.local

# フロントエンドの依存関係をインストール
cd frontend
npm install
cd ..

# スクレイパーサービスの依存関係をインストール
cd scraper-service
npm install
cd ..

# 開発サーバーを起動
cd frontend && npm run dev &
cd scraper-service && npm run dev &
```

### 環境変数設定
`.env.local` ファイルを編集して以下のAPIキーを設定してください：

```env
# 必須: スクレイパーサービス用APIキー（自動生成済み）
SCRAPER_SERVICE_API_KEY=<generated-automatically>

# オプション: より高度な分析のために
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_PAGESPEED_API_KEY=...

# プロダクション用: Vercelにデプロイ後設定
KV_URL=redis://...
RAILWAY_SCRAPER_URL=https://...
```

## 📦 Deployment

### 🚀 プロダクションデプロイ

詳細なデプロイメント手順については **[DEPLOYMENT.md](DEPLOYMENT.md)** を参照してください。

#### 概要
- **フロントエンド**: Vercel（自動デプロイ対応）
- **スクレイパーサービス**: Railway（Docker）
- **データベース**: Vercel KV + IndexedDB

#### デプロイコマンド
```bash
# Vercelデプロイ
vercel --prod

# Railwayデプロイ（scraper-service）
# GitHubリポジトリ連携で自動デプロイ
```

## 🎯 Usage

1. **Enter URL**: Input the website URL you want to analyze
2. **Wait for Analysis**: AI performs 100+ checkpoint analysis (3-5 minutes)
3. **Review Results**: Interactive report with scores, issues, and recommendations
4. **Implement Changes**: Follow prioritized improvement suggestions
5. **Track Progress**: Compare before/after analysis results

## 📊 Analysis Categories

### 🎨 Visual & UX Analysis
- First impression evaluation
- Color contrast and accessibility
- Layout balance and hierarchy
- Mobile responsiveness

### 🧠 Psychological Analysis
- Cognitive load assessment
- Trust signals evaluation
- Fear/urgency/social proof analysis
- User flow optimization

### ⚡ Performance Analysis
- Core Web Vitals
- Load time optimization
- Resource size analysis
- Mobile performance

### 🎯 Conversion Analysis
- CTA effectiveness
- Form optimization
- Phone conversion setup
- Micro-conversion opportunities

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:
1. Check the [Issues](../../issues) page
2. Review the documentation
3. Contact support

## 🗺️ Roadmap

- [ ] Multi-language support
- [ ] A/B testing recommendations
- [ ] Industry-specific analysis templates
- [ ] Team collaboration features
- [ ] API for external integrations

---

Made with ❤️ by the WCO Team