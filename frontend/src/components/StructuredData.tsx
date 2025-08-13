export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Web Conversion Optimizer",
    "alternateName": "WCO",
    "description": "100以上のチェックポイントでWEBサイトを分析し、コンバージョン率向上のための具体的な改善提案を無料で提供するWEBサイト分析ツール",
    "url": "https://web-conversion-optimizer.vercel.app",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "JPY",
      "availability": "https://schema.org/InStock"
    },
    "creator": {
      "@type": "Organization",
      "name": "Web Conversion Optimizer Team"
    },
    "dateCreated": "2025-08-13",
    "inLanguage": "ja-JP",
    "isAccessibleForFree": true,
    "keywords": "WEBサイト分析, コンバージョン最適化, UX分析, パフォーマンス測定, SEO分析, アクセシビリティ",
    "mainEntity": {
      "@type": "Service",
      "name": "WEBサイト包括分析サービス",
      "description": "ユーザビリティ、パフォーマンス、SEO、アクセシビリティ、コンバージョン最適化の観点から100以上の項目をチェック",
      "provider": {
        "@type": "Organization",
        "name": "Web Conversion Optimizer"
      },
      "serviceType": "WEBサイト分析",
      "areaServed": "JP",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "分析機能一覧",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "コンバージョン最適化分析",
              "description": "CTA配置、フォーム最適化、心理的要因の分析"
            }
          },
          {
            "@type": "Offer", 
            "itemOffered": {
              "@type": "Service",
              "name": "ユーザビリティ分析",
              "description": "ナビゲーション、モバイル対応、ユーザー体験の分析"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service", 
              "name": "パフォーマンス分析",
              "description": "Lighthouseベースの速度測定とCore Web Vitals分析"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "SEO・アクセシビリティ分析", 
              "description": "検索エンジン最適化とWCAG準拠性の分析"
            }
          }
        ]
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://web-conversion-optimizer.vercel.app/?url={search_term_string}",
        "actionPlatform": [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform"
        ]
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}