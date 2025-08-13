"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AnalysisData {
  url: string;
  timestamp: string;
  overallScore: number;
  categories: {
    performance: number;
    usability: number;
    conversion: number;
    accessibility: number;
    seo: number;
  };
  criticalIssues: Array<{
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    category: string;
    recommendation: string;
  }>;
  opportunities: Array<{
    title: string;
    description: string;
    expectedImprovement: string;
    effort: "low" | "medium" | "high";
  }>;
}

interface AnalysisResultsProps {
  data: AnalysisData;
}

export function AnalysisResults({ data }: AnalysisResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100 border-green-200";
    if (score >= 60) return "bg-yellow-100 border-yellow-200";
    return "bg-red-100 border-red-200";
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const saveToHistory = async () => {
    // Save to IndexedDB
    try {
      // This will be implemented with IndexedDB wrapper
      console.log("Saving to history:", data);
    } catch (error) {
      console.error("Failed to save to history:", error);
    }
  };

  const exportReport = () => {
    const reportData = {
      ...data,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json"
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversion-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 mt-12">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">分析結果</h3>
        <p className="text-slate-600">{data.url}</p>
        <p className="text-sm text-slate-500">
          分析完了: {new Date(data.timestamp).toLocaleString('ja-JP')}
        </p>
      </div>

      {/* Overall Score */}
      <Card className={`border-2 ${getScoreBg(data.overallScore)}`}>
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold">
            <span className={getScoreColor(data.overallScore)}>
              {data.overallScore}
            </span>
            <span className="text-2xl text-slate-500">/100</span>
          </CardTitle>
          <CardDescription>
            総合コンバージョン最適化スコア
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Category Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(data.categories).map(([category, score]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {category === 'performance' && '⚡ パフォーマンス'}
                {category === 'usability' && '🎯 ユーザビリティ'}
                {category === 'conversion' && '💰 コンバージョン'}
                {category === 'accessibility' && '♿ アクセシビリティ'}
                {category === 'seo' && '🔍 SEO'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Progress value={score} className="flex-1" />
                <span className={`font-semibold ${getScoreColor(score)}`}>
                  {score}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Critical Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">🚨 優先度の高い改善点</CardTitle>
          <CardDescription>
            コンバージョン率に大きな影響を与える可能性のある問題
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.criticalIssues.length > 0 ? (
              data.criticalIssues.map((issue, index) => (
                <Alert key={index}>
                  <AlertDescription>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{issue.title}</h4>
                          <Badge variant={getImpactColor(issue.impact) as any}>
                            {issue.impact === 'high' && '高'}
                            {issue.impact === 'medium' && '中'}
                            {issue.impact === 'low' && '低'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {issue.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {issue.description}
                        </p>
                        <p className="text-sm font-medium text-blue-600">
                          💡 {issue.recommendation}
                        </p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">
                重大な問題は検出されませんでした 🎉
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Improvement Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">💡 改善機会</CardTitle>
          <CardDescription>
            実装によりコンバージョン率向上が期待できる施策
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.opportunities.map((opportunity, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{opportunity.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getEffortColor(opportunity.effort)}`}>
                        {opportunity.effort === 'low' && '簡単'}
                        {opportunity.effort === 'medium' && '中程度'}
                        {opportunity.effort === 'high' && '高難度'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {opportunity.description}
                    </p>
                    <p className="text-sm font-medium text-green-600">
                      📈 期待される改善: {opportunity.expectedImprovement}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Button onClick={saveToHistory} variant="outline">
          📱 履歴に保存
        </Button>
        <Button onClick={exportReport}>
          📄 レポートをエクスポート
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          🖨️ 印刷
        </Button>
      </div>
    </div>
  );
}