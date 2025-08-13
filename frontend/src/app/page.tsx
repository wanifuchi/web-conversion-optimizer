"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AnalysisForm } from "@/components/analysis-form";
import { AnalysisResults } from "@/components/analysis-results";
import { AnalysisHistory } from "@/components/analysis-history";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"analyze" | "history">("analyze");
  const [analysisData, setAnalysisData] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                WEBコンバージョン最適化ツール
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                AIによる高度なWEBサイト分析でコンバージョン率を向上させます
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              Beta v1.0
            </Badge>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b bg-white/30 backdrop-blur-sm dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("analyze")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "analyze"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              🔍 WEBサイト分析
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              📊 分析履歴
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === "analyze" && (
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                WEBサイトのコンバージョン率を最適化
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                URLを入力するだけで、AIが100以上のチェックポイントで分析。
                心理的要因やユーザビリティを含む具体的な改善提案をご提供します。
              </p>
            </div>

            {/* Analysis Form */}
            <AnalysisForm onAnalysisComplete={setAnalysisData} />

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🧠 AI分析
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400">
                    最先端AIによる100以上のチェックポイント分析。心理的要因やUXの深い洞察を提供します。
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📱 モバイル対応
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400">
                    モバイルファーストのデザイン分析とレスポンシブ対応の具体的な改善提案を行います。
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    ⚡ パフォーマンス
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400">
                    Core Web Vitals分析により、速度最適化とパフォーマンス改善の具体的な提案を提供します。
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Results */}
            {analysisData && <AnalysisResults data={analysisData} />}
          </div>
        )}

        {activeTab === "history" && (
          <div className="max-w-6xl mx-auto">
            <AnalysisHistory />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-600 dark:text-slate-400">
            <p>© 2024 WEBコンバージョン最適化ツール. AIによる高度な分析でコンバージョン向上を実現</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
