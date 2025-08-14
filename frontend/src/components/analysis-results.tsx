"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DetailedInstruction {
  id: string;
  title: string;
  location: string; // "座標(240, 450)の「お申し込み」ボタン"
  currentState: {
    visual: string; // "現在の状態: 灰色背景、14pxフォント"
    technical: Record<string, string>; // CSS values
  };
  requiredChanges: {
    visual: string; // "推奨変更: オレンジ背景、18pxフォント、太字"
    technical: Record<string, string>; // New CSS values
    reasoning: string; // Why this change
  };
  implementation: {
    cssCode: string;
    htmlChanges?: string;
    selector: string;
    priority: 'immediate' | 'high' | 'medium' | 'low';
  };
  expectedResults: {
    primaryMetric: string;
    improvement: string;
    timeframe: string;
    confidence: number;
  };
  visualComparison: {
    before: string;
    after: string;
    keyDifferences: string[];
  };
}

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
  detailedInstructions?: DetailedInstruction[]; // 詳細改善指示を追加
  screenshot?: string; // スクリーンショットURL
  error?: {
    type: string;
    message: string;
    suggestion: string;
  };
  note?: string;
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

      {/* Screenshot */}
      {data.screenshot && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">📸 サイトスクリーンショット</CardTitle>
            <CardDescription>
              分析対象サイトの現在の状態
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <img 
                src={data.screenshot} 
                alt={`${data.url}のスクリーンショット`}
                className="max-w-full h-auto border rounded-lg shadow-lg"
                style={{ maxHeight: '600px' }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {data.error && (
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-xl text-yellow-800 flex items-center gap-2">
              ⚠️ 分析に関する重要なお知らせ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                <p className="text-yellow-800 font-medium mb-2">
                  {data.error.message}
                </p>
                <p className="text-yellow-700 text-sm">
                  {data.error.suggestion}
                </p>
              </div>
              {data.note && (
                <p className="text-sm text-yellow-600 italic">
                  注記: {data.note}
                </p>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  💡 <strong>現在表示されている改善提案は一般的な内容です。</strong>
                  実際のページ内容に基づいた詳細な改善指示をご希望の場合は、
                  サイトのアクセス設定をご確認いただき、再度分析をお試しください。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Detailed Instructions */}
      {(!data.error && data.detailedInstructions && data.detailedInstructions.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">🎯 具体的改善指示</CardTitle>
            <CardDescription>
              座標ベースの詳細な改善指示と実装可能なコード
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.detailedInstructions.map((instruction, index) => (
                <div key={instruction.id} className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-lg">{instruction.title}</h4>
                        <Badge variant={
                          instruction.implementation.priority === 'immediate' ? 'destructive' :
                          instruction.implementation.priority === 'high' ? 'default' :
                          instruction.implementation.priority === 'medium' ? 'secondary' : 'outline'
                        }>
                          {instruction.implementation.priority === 'immediate' && '緊急'}
                          {instruction.implementation.priority === 'high' && '高'}
                          {instruction.implementation.priority === 'medium' && '中'}
                          {instruction.implementation.priority === 'low' && '低'}
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-700 font-medium mb-3">
                        📍 {instruction.location}
                      </p>
                    </div>
                  </div>

                  {/* Current State vs Required Changes - 紫テキスト風のアノテーション表示 */}
                  <div className="space-y-4 mb-4">
                    {/* 該当箇所の表示 */}
                    <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                      <div className="flex items-start gap-2">
                        <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                        <div className="flex-1">
                          <h5 className="font-bold text-purple-800 text-sm mb-2">📍 該当箇所の現状</h5>
                          <p className="text-sm text-purple-700 leading-relaxed">{instruction.currentState.visual}</p>
                          <div className="mt-3 text-xs text-purple-600 font-mono bg-purple-100 p-2 rounded border">
                            {Object.entries(instruction.currentState.technical).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-purple-500">{key}:</span> 
                                <span className="font-semibold">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 矢印表示 */}
                    <div className="flex justify-center">
                      <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                        <span className="text-blue-600 font-medium text-sm">変更</span>
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>

                    {/* 変更後の表示 */}
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg">
                      <div className="flex items-start gap-2">
                        <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                        <div className="flex-1">
                          <h5 className="font-bold text-emerald-800 text-sm mb-2">✨ 改善後の状態</h5>
                          <p className="text-sm text-emerald-700 leading-relaxed">{instruction.requiredChanges.visual}</p>
                          <div className="mt-3 text-xs text-emerald-600 font-mono bg-emerald-100 p-2 rounded border">
                            {Object.entries(instruction.requiredChanges.technical).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-emerald-500">{key}:</span> 
                                <span className="font-semibold">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 具体的な変更点のハイライト */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h5 className="font-bold text-indigo-800 text-sm mb-2">📋 具体的な変更内容</h5>
                      <div className="space-y-2">
                        {instruction.visualComparison.keyDifferences.map((diff, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="inline-block w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm text-indigo-700">{diff}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h5 className="font-semibold text-blue-800 mb-2">変更理由</h5>
                    <p className="text-sm text-blue-700">{instruction.requiredChanges.reasoning}</p>
                  </div>

                  {/* Implementation Code */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <h5 className="font-semibold text-gray-800 mb-2">🛠️ 実装コード</h5>
                    <pre className="text-xs text-gray-700 font-mono bg-gray-100 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                      {instruction.implementation.cssCode}
                    </pre>
                    <div className="mt-2 text-xs text-gray-600">
                      セレクター: <code className="bg-gray-200 px-1 rounded">{instruction.implementation.selector}</code>
                    </div>
                  </div>

                  {/* Expected Results */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h5 className="font-semibold text-yellow-800 mb-2">📈 期待される効果</h5>
                    <div className="grid sm:grid-cols-3 gap-2 text-sm text-yellow-700">
                      <div><strong>指標:</strong> {instruction.expectedResults.primaryMetric}</div>
                      <div><strong>改善:</strong> {instruction.expectedResults.improvement}</div>
                      <div><strong>信頼度:</strong> {instruction.expectedResults.confidence}%</div>
                    </div>
                    <div className="mt-2 text-sm text-yellow-700">
                      <strong>期間:</strong> {instruction.expectedResults.timeframe}
                    </div>
                  </div>

                  {/* Visual Comparison */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h5 className="font-semibold text-purple-800 mb-2">🔍 視覚的変更</h5>
                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div className="text-sm">
                        <strong className="text-red-600">変更前:</strong> {instruction.visualComparison.before}
                      </div>
                      <div className="text-sm">
                        <strong className="text-green-600">変更後:</strong> {instruction.visualComparison.after}
                      </div>
                    </div>
                    <div className="text-sm text-purple-700">
                      <strong>主な違い:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1">
                        {instruction.visualComparison.keyDifferences.map((diff, i) => (
                          <li key={i}>{diff}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Detailed Instructions Available */}
      {!data.error && (!data.detailedInstructions || data.detailedInstructions.length === 0) && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-xl text-blue-800">📋 詳細改善指示について</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-blue-700">
                現在、このサイトに対する具体的な改善指示は生成されませんでした。
              </p>
              <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  💡 <strong>詳細改善指示が表示される条件：</strong>
                </p>
                <ul className="text-blue-700 text-sm mt-2 ml-4 list-disc">
                  <li>サイトに明確な改善の余地がある要素が検出された場合</li>
                  <li>CTAボタン、見出し、価格表示などの最適化可能な要素がある場合</li>
                  <li>ページの構造と内容が十分に解析できた場合</li>
                </ul>
              </div>
              <p className="text-blue-600 text-sm">
                上記の「優先度の高い改善点」と「改善機会」を参考に、
                サイトの最適化を検討してください。
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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