"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface AnalysisFormProps {
  onAnalysisComplete: (data: any) => void;
}

export function AnalysisForm({ onAnalysisComplete }: AnalysisFormProps) {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [error, setError] = useState("");

  const analysisSteps = [
    "URLの検証とアクセス確認",
    "ページコンテンツの取得",
    "スクリーンショットの撮影",
    "パフォーマンス測定",
    "UI/UX要素の分析",
    "コンバージョン要素の検出",
    "AI深層分析の実行",
    "改善提案の生成",
    "レポートの作成"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // URL validation
    if (!url) {
      setError("URLを入力してください");
      return;
    }

    try {
      new URL(url);
    } catch {
      setError("有効なURLを入力してください（例: https://example.com）");
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    try {
      // Start analysis
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("分析の開始に失敗しました");
      }

      const { jobId } = await response.json();

      // Poll for progress
      console.log(`🔄 Starting polling for job: ${jobId}`);
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/status?jobId=${jobId}`);
          const statusData = await statusResponse.json();

          if (statusData.status === "processing") {
            // Use actual progress from API response
            const apiProgress = statusData.data?.progress || 0;
            const apiStep = statusData.data?.step || "分析中...";
            
            console.log(`📊 進捗更新: ${apiProgress}% - ${apiStep}`);
            setProgress(apiProgress);
            setCurrentStep(apiStep);
          } else if (statusData.status === "completed") {
            setProgress(100);
            setCurrentStep("分析完了！");
            console.log(`🏁 Analysis completed for job: ${jobId}`);
            clearInterval(pollInterval);
            
            // If we have data directly, use it. Otherwise fetch from results endpoint
            if (statusData.data) {
              console.log('✅ 分析結果をステータスAPIから取得');
              onAnalysisComplete(statusData.data);
              setIsAnalyzing(false);
            } else {
              console.log('📋 結果データが無いため、結果APIから取得中...');
              try {
                const resultsResponse = await fetch(`/api/results/${jobId}`);
                if (resultsResponse.ok) {
                  const resultsData = await resultsResponse.json();
                  console.log('✅ 分析結果を結果APIから取得');
                  onAnalysisComplete(resultsData.analysisResult);
                } else {
                  console.error('結果API呼び出し失敗:', resultsResponse.status);
                  throw new Error('分析結果の取得に失敗しました');
                }
              } catch (error) {
                console.error('結果取得エラー:', error);
                setError('分析結果の取得に失敗しました。もう一度お試しください。');
              }
              setIsAnalyzing(false);
            }
          } else if (statusData.status === "error") {
            throw new Error(statusData.error || "分析中にエラーが発生しました");
          }
        } catch (error) {
          console.error("Status polling error:", error);
          // Don't clear the interval on network errors, just continue polling
          // Only clear on critical errors
        }
      }, 2000);

      // Cleanup interval after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isAnalyzing) {
          setError("分析がタイムアウトしました。もう一度お試しください。");
          setIsAnalyzing(false);
        }
      }, 600000);

    } catch (error) {
      console.error("Analysis error:", error);
      setError(error instanceof Error ? error.message : "分析中にエラーが発生しました");
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setUrl("");
    setIsAnalyzing(false);
    setProgress(0);
    setCurrentStep("");
    setError("");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">ウェブサイト分析</CardTitle>
        <CardDescription>
          分析したいウェブサイトのURLを入力してください。AI が100以上のチェックポイントで詳細に分析します。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isAnalyzing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium">
                ウェブサイトURL
              </label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="text-lg py-3"
              />
              <p className="text-sm text-slate-500">
                ※ 公開されているウェブサイトのみ分析可能です
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="flex-1" 
                size="lg"
                disabled={!url}
              >
                🔍 分析を開始
              </Button>
              {url && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleReset}
                  size="lg"
                >
                  リセット
                </Button>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-500">
                分析には通常 3-5分 かかります
              </p>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">分析を実行中...</h3>
              <p className="text-slate-600 mb-4">{url}</p>
              <Badge variant="secondary" className="mb-4">
                AI が詳細分析を実行中
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>{currentStep}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-500">
                このページを閉じずにお待ちください...
              </p>
            </div>

            <Button 
              onClick={handleReset} 
              variant="outline" 
              className="w-full"
            >
              分析をキャンセル
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}