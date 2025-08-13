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
                Web Conversion Optimizer
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                AI-powered website analysis for conversion rate optimization
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
              🔍 Analyze Website
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              📊 Analysis History
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
                Optimize Your Website's Conversion Rate
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Enter any website URL below to get AI-powered analysis with 100+ checkpoints, 
                psychological insights, and actionable improvement recommendations.
              </p>
            </div>

            {/* Analysis Form */}
            <AnalysisForm onAnalysisComplete={setAnalysisData} />

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🧠 AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400">
                    Advanced AI analysis using GPT-4 and Claude for deep psychological and UX insights.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📱 Mobile-First
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400">
                    Comprehensive mobile optimization analysis with responsive design recommendations.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    ⚡ Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400">
                    Core Web Vitals analysis with speed optimization and performance recommendations.
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
            <p>© 2024 Web Conversion Optimizer. Powered by AI for better conversions.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
