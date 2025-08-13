"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface HistoryItem {
  id: string;
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
  criticalIssuesCount: number;
  opportunitiesCount: number;
}

export function AnalysisHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "score" | "url">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterAndSortHistory();
  }, [history, searchQuery, sortBy, sortOrder]);

  const loadHistory = async () => {
    try {
      // This will be implemented with IndexedDB
      // For now, use mock data
      const mockHistory: HistoryItem[] = [
        {
          id: "1",
          url: "https://example.com",
          timestamp: new Date().toISOString(),
          overallScore: 75,
          categories: {
            performance: 80,
            usability: 70,
            conversion: 75,
            accessibility: 85,
            seo: 65
          },
          criticalIssuesCount: 3,
          opportunitiesCount: 7
        },
        {
          id: "2",
          url: "https://test.com",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          overallScore: 60,
          categories: {
            performance: 50,
            usability: 65,
            conversion: 55,
            accessibility: 70,
            seo: 75
          },
          criticalIssuesCount: 5,
          opportunitiesCount: 12
        }
      ];
      setHistory(mockHistory);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  const filterAndSortHistory = () => {
    let filtered = history;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.url.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case "score":
          comparison = a.overallScore - b.overallScore;
          break;
        case "url":
          comparison = a.url.localeCompare(b.url);
          break;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    setFilteredHistory(filtered);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const deleteItem = async (id: string) => {
    try {
      // This will be implemented with IndexedDB
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const exportAll = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalAnalyses: history.length,
      analyses: history
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversion-analysis-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAllHistory = async () => {
    if (window.confirm("すべての分析履歴を削除しますか？この操作は取り消せません。")) {
      try {
        // This will be implemented with IndexedDB
        setHistory([]);
      } catch (error) {
        console.error("Failed to clear history:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">分析履歴</h2>
          <p className="text-slate-600">
            過去の分析結果を確認・比較できます
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportAll} variant="outline">
            📄 全てエクスポート
          </Button>
          <Button 
            onClick={clearAllHistory} 
            variant="destructive" 
            disabled={history.length === 0}
          >
            🗑️ 全て削除
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">フィルター・並び替え</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="URLで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="date">日付順</option>
                <option value="score">スコア順</option>
                <option value="url">URL順</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="desc">降順</option>
                <option value="asc">昇順</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Items */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{item.url}</h3>
                      <Badge className={`${getScoreColor(item.overallScore)} border-0`}>
                        {item.overallScore}/100
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-slate-500 mb-3">
                      {new Date(item.timestamp).toLocaleString('ja-JP')}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                      {Object.entries(item.categories).map(([category, score]) => (
                        <div key={category} className="text-center">
                          <div className="text-xs text-slate-500 mb-1">
                            {category === 'performance' && 'パフォーマンス'}
                            {category === 'usability' && 'ユーザビリティ'}
                            {category === 'conversion' && 'コンバージョン'}
                            {category === 'accessibility' && 'アクセシビリティ'}
                            {category === 'seo' && 'SEO'}
                          </div>
                          <div className="font-semibold">{score}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4 text-sm text-slate-600">
                      <span>🚨 重要な問題: {item.criticalIssuesCount}件</span>
                      <span>💡 改善機会: {item.opportunitiesCount}件</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline">
                      📊 詳細を見る
                    </Button>
                    <Button size="sm" variant="outline">
                      📄 エクスポート
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => deleteItem(item.id)}
                    >
                      🗑️ 削除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            {history.length === 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  まだ分析履歴がありません
                </h3>
                <p className="text-slate-600 mb-4">
                  ウェブサイトを分析すると、ここに履歴が表示されます
                </p>
                <Button onClick={() => window.location.reload()}>
                  🔍 新しい分析を開始
                </Button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  検索条件に一致する履歴がありません
                </h3>
                <p className="text-slate-600">
                  検索条件を変更してお試しください
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">統計情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {history.length}
                </div>
                <div className="text-sm text-slate-500">総分析数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(history.reduce((sum, item) => sum + item.overallScore, 0) / history.length)}
                </div>
                <div className="text-sm text-slate-500">平均スコア</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {history.reduce((sum, item) => sum + item.criticalIssuesCount, 0)}
                </div>
                <div className="text-sm text-slate-500">総問題数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {history.reduce((sum, item) => sum + item.opportunitiesCount, 0)}
                </div>
                <div className="text-sm text-slate-500">総改善機会</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}