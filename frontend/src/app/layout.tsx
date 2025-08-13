import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StructuredData from "../components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Web Conversion Optimizer - 無料WEBサイト分析ツール",
  description: "100以上のチェックポイントでWEBサイトを分析し、コンバージョン率向上のための具体的な改善提案を無料で提供。ユーザビリティ・パフォーマンス・SEO・アクセシビリティを包括的に分析します。",
  keywords: "WEBサイト分析, コンバージョン最適化, UX分析, パフォーマンス測定, SEO分析, アクセシビリティ, 無料ツール",
  authors: [{ name: "Web Conversion Optimizer Team" }],
  creator: "Web Conversion Optimizer",
  publisher: "Web Conversion Optimizer",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://web-conversion-optimizer.vercel.app",
    siteName: "Web Conversion Optimizer",
    title: "Web Conversion Optimizer - 無料WEBサイト分析ツール",
    description: "100以上のチェックポイントでWEBサイトを分析し、コンバージョン率向上のための具体的な改善提案を無料で提供",
    images: [{
      url: "/og-image.jpg",
      width: 1200,
      height: 630,
      alt: "Web Conversion Optimizer",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Conversion Optimizer - 無料WEBサイト分析ツール",
    description: "100以上のチェックポイントでWEBサイトを分析し、コンバージョン率向上のための具体的な改善提案を無料で提供",
    images: ["/og-image.jpg"],
    creator: "@webconversionopt",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
