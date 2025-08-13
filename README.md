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

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Create `.env.local` in the frontend directory:
```env
# AI APIs
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_claude_key

# Vercel Services
KV_URL=your_vercel_kv_url
KV_REST_API_URL=your_vercel_kv_rest_url
KV_REST_API_TOKEN=your_vercel_kv_token
POSTGRES_URL=your_postgres_url

# External Services
GOOGLE_PAGESPEED_API_KEY=your_pagespeed_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Scraper Service
SCRAPER_SERVICE_URL=your_railway_scraper_url
```

## 📦 Deployment

### Vercel (Frontend + API)
1. Connect this repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Railway (Scraper Service)
1. Connect scraper-service directory to Railway
2. Set Docker deployment
3. Configure environment variables

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