// Analysis Engine - Core analysis orchestrator

import { 
  AnalysisInput, 
  AnalysisResult, 
  CheckpointResult, 
  CheckpointCategory,
  AnalysisOptions 
} from './types';
import { ALL_CHECKPOINTS, getCheckpointsByCategory } from './checkpoints';
import { generateId } from '../storage/database';
import { detailedAnalyzer, DetailedElement, SpecificImprovement } from './detailed-analyzer';
import { coordinateAnalyzer, CoordinateIssue, ScreenshotAnalysis } from './coordinate-analyzer';
import { improvementGenerator, DetailedInstruction } from './improvement-generator';

export class AnalysisEngine {
  /**
   * メイン分析実行関数
   * スクレイピングデータとLighthouseデータを受け取り、100+チェックポイントで分析
   */
  async analyzeWebsite(input: AnalysisInput): Promise<AnalysisResult> {
    console.log('🔬 Starting comprehensive website analysis...');
    
    // 実行するチェックポイントを決定
    const checkpointsToRun = this.selectCheckpoints(input.options);
    console.log(`📊 Running ${checkpointsToRun.length} checkpoints`);

    // 全チェックポイントを並列実行
    const checkpointResults = await this.runCheckpoints(checkpointsToRun, input);
    
    // カテゴリ別スコア計算
    const categoryScores = this.calculateCategoryScores(checkpointResults);
    
    // 総合スコア計算
    const overallScore = this.calculateOverallScore(categoryScores);
    
    // クリティカル問題の抽出
    const criticalIssues = this.extractCriticalIssues(checkpointResults);
    
    // 改善機会の抽出
    const opportunities = this.extractOpportunities(checkpointResults);
    
    // 洞察の生成
    const insights = this.generateInsights(checkpointResults, input);
    
    // 推奨事項の生成
    const recommendations = this.generateRecommendations(checkpointResults);
    
    // 詳細な改善指示の生成（新機能）
    const detailedInstructions = await this.generateDetailedInstructions(input);

    const analysisResult: AnalysisResult = {
      id: generateId(),
      url: input.scrapedData.url,
      timestamp: new Date().toISOString(),
      overallScore,
      categories: categoryScores,
      checkpoints: checkpointResults,
      criticalIssues,
      opportunities,
      insights,
      recommendations,
      detailedInstructions, // 新しい詳細指示を追加
      rawData: input.options.includeScreenshots ? {
        scrapedData: input.scrapedData,
        lighthouseData: input.lighthouseData
      } : undefined
    };

    console.log('✅ Analysis completed successfully');
    console.log(`📈 Overall Score: ${overallScore}/100`);
    console.log(`🔴 Critical Issues: ${criticalIssues.length}`);
    console.log(`💡 Opportunities: ${opportunities.length}`);

    return analysisResult;
  }

  /**
   * オプションに基づいて実行するチェックポイントを選択
   */
  private selectCheckpoints(options: AnalysisOptions): typeof ALL_CHECKPOINTS {
    let checkpoints = [...ALL_CHECKPOINTS];

    // カテゴリフィルタリング
    if (options.categories && options.categories.length > 0) {
      checkpoints = checkpoints.filter(checkpoint => 
        options.categories!.includes(checkpoint.category)
      );
    }

    // ディープ分析でない場合は重要度の高いチェックポイントのみ
    if (!options.deepAnalysis) {
      checkpoints = checkpoints.filter(checkpoint => checkpoint.weight >= 6);
    }

    return checkpoints;
  }

  /**
   * チェックポイントを並列実行
   */
  private async runCheckpoints(
    checkpoints: typeof ALL_CHECKPOINTS, 
    input: AnalysisInput
  ): Promise<CheckpointResult[]> {
    const results = await Promise.all(
      checkpoints.map(async (checkpoint) => {
        try {
          const result = checkpoint.analyze(input);
          console.log(`✓ ${checkpoint.id}: ${result.score}/100`);
          return result;
        } catch (error) {
          console.error(`❌ Error in checkpoint ${checkpoint.id}:`, error);
          // エラー時のフォールバック結果
          return {
            id: checkpoint.id,
            category: checkpoint.category,
            name: checkpoint.name,
            description: checkpoint.description,
            score: 0,
            impact: 'low' as const,
            status: 'fail' as const,
            recommendation: 'チェックポイントの実行中にエラーが発生しました',
            details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      })
    );

    return results;
  }

  /**
   * カテゴリ別スコアを計算（重み付き平均）
   */
  private calculateCategoryScores(results: CheckpointResult[]): AnalysisResult['categories'] {
    const categories: CheckpointCategory[] = [
      'conversion_optimization',
      'user_experience', 
      'performance',
      'accessibility',
      'seo'
    ];

    const categoryScores = {} as AnalysisResult['categories'];

    categories.forEach(category => {
      const categoryResults = results.filter(r => r.category === category);
      const categoryCheckpoints = ALL_CHECKPOINTS.filter(c => c.category === category);
      
      if (categoryResults.length === 0) {
        categoryScores[this.mapCategoryToScore(category)] = 0;
        return;
      }

      // 重み付きスコア計算
      let weightedSum = 0;
      let totalWeight = 0;

      categoryResults.forEach(result => {
        const checkpoint = categoryCheckpoints.find(c => c.id === result.id);
        const weight = checkpoint?.weight || 1;
        
        weightedSum += result.score * weight;
        totalWeight += weight;
      });

      const avgScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
      categoryScores[this.mapCategoryToScore(category)] = avgScore;
    });

    return categoryScores;
  }

  /**
   * カテゴリをスコアキーにマッピング
   */
  private mapCategoryToScore(category: CheckpointCategory): keyof AnalysisResult['categories'] {
    const mapping: Record<CheckpointCategory, keyof AnalysisResult['categories']> = {
      'conversion_optimization': 'conversion',
      'user_experience': 'usability',
      'performance': 'performance',
      'accessibility': 'accessibility',
      'seo': 'seo',
      'psychology': 'usability',
      'mobile': 'usability',
      'trust_signals': 'conversion',
      'content': 'conversion',
      'navigation': 'usability'
    };

    return mapping[category] || 'usability';
  }

  /**
   * 総合スコアを計算（カテゴリの重み付き平均）
   */
  private calculateOverallScore(categoryScores: AnalysisResult['categories']): number {
    const weights = {
      conversion: 0.3,    // コンバージョン最適化が最重要
      usability: 0.25,    // ユーザビリティ
      performance: 0.25,  // パフォーマンス
      accessibility: 0.1, // アクセシビリティ
      seo: 0.1           // SEO
    };

    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(categoryScores).forEach(([category, score]) => {
      const weight = weights[category as keyof typeof weights] || 0.1;
      weightedSum += score * weight;
      totalWeight += weight;
    });

    return Math.round(weightedSum / totalWeight);
  }

  /**
   * クリティカル問題を抽出
   */
  private extractCriticalIssues(results: CheckpointResult[]): AnalysisResult['criticalIssues'] {
    return results
      .filter(result => 
        result.impact === 'high' && 
        result.status === 'fail' && 
        result.score < 50
      )
      .map(result => ({
        title: result.name,
        description: result.description,
        impact: result.impact,
        category: result.category,
        recommendation: result.recommendation,
        effort: this.estimateEffort(result)
      }))
      .slice(0, 10); // 最大10件
  }

  /**
   * 改善機会を抽出
   */
  private extractOpportunities(results: CheckpointResult[]): AnalysisResult['opportunities'] {
    return results
      .filter(result => 
        result.score >= 50 && 
        result.score < 80 && 
        result.impact !== 'low'
      )
      .sort((a, b) => {
        // 影響度とスコア改善ポテンシャルでソート
        const aWeight = (a.impact === 'high' ? 3 : 2) * (100 - a.score);
        const bWeight = (b.impact === 'high' ? 3 : 2) * (100 - b.score);
        return bWeight - aWeight;
      })
      .map(result => ({
        title: result.name,
        description: result.description,
        expectedImprovement: this.calculateExpectedImprovement(result),
        effort: this.estimateEffort(result),
        priority: this.calculatePriority(result)
      }))
      .slice(0, 15); // 最大15件
  }

  /**
   * 洞察を生成
   */
  private generateInsights(
    results: CheckpointResult[], 
    input: AnalysisInput
  ): AnalysisResult['insights'] {
    const psychologyResults = results.filter(r => r.category === 'psychology');
    const uxResults = results.filter(r => r.category === 'user_experience');
    const conversionResults = results.filter(r => r.category === 'conversion_optimization');
    
    return {
      psychologicalFactors: this.extractPsychologicalInsights(psychologyResults),
      userExperienceGaps: this.extractUXInsights(uxResults),
      conversionBlockers: this.extractConversionBlockers(conversionResults),
      competitiveAdvantages: this.extractCompetitiveAdvantages(results, input)
    };
  }

  /**
   * 推奨事項を生成
   */
  private generateRecommendations(results: CheckpointResult[]): AnalysisResult['recommendations'] {
    const highImpactIssues = results.filter(r => r.impact === 'high' && r.score < 70);
    const mediumImpactIssues = results.filter(r => r.impact === 'medium' && r.score < 80);
    const lowEffortImprovements = results.filter(r => r.score >= 60 && r.score < 90);

    return {
      quick_wins: lowEffortImprovements
        .slice(0, 5)
        .map(r => r.recommendation),
      medium_term: mediumImpactIssues
        .slice(0, 7)
        .map(r => r.recommendation),
      long_term: highImpactIssues
        .slice(0, 5)
        .map(r => r.recommendation)
    };
  }

  // ヘルパーメソッド

  private estimateEffort(result: CheckpointResult): 'low' | 'medium' | 'high' {
    if (result.category === 'content' || result.category === 'seo') return 'low';
    if (result.category === 'performance' || result.category === 'accessibility') return 'high';
    return 'medium';
  }

  private calculateExpectedImprovement(result: CheckpointResult): string {
    const potential = 100 - result.score;
    const weight = ALL_CHECKPOINTS.find(c => c.id === result.id)?.weight || 5;
    
    if (potential > 30 && weight >= 7) return 'スコア15-25ポイント向上が期待できます';
    if (potential > 20 && weight >= 5) return 'スコア10-20ポイント向上が期待できます';
    return 'スコア5-15ポイント向上が期待できます';
  }

  private calculatePriority(result: CheckpointResult): number {
    const impactScore = result.impact === 'high' ? 3 : result.impact === 'medium' ? 2 : 1;
    const potentialScore = Math.min(10, (100 - result.score) / 10);
    const weight = ALL_CHECKPOINTS.find(c => c.id === result.id)?.weight || 5;
    
    return Math.round((impactScore * 3 + potentialScore * 2 + weight) / 3);
  }

  private extractPsychologicalInsights(results: CheckpointResult[]): string[] {
    const insights: string[] = [];
    
    results.forEach(result => {
      if (result.score < 60) {
        switch (result.id) {
          case 'psych_001':
            insights.push('社会的証明要素が不足しており、信頼性に課題があります');
            break;
          case 'psych_004':
            insights.push('損失回避の心理を活用できていません');
            break;
          case 'psych_008':
            insights.push('感情的な訴求が弱く、ユーザーの心に響きにくい可能性があります');
            break;
        }
      }
    });

    return insights.slice(0, 5);
  }

  private extractUXInsights(results: CheckpointResult[]): string[] {
    const insights: string[] = [];
    
    results.forEach(result => {
      if (result.score < 60) {
        switch (result.id) {
          case 'ux_001':
            insights.push('ページ読み込み速度がユーザー体験を阻害しています');
            break;
          case 'ux_002':
            insights.push('モバイル対応が不十分で、多くのユーザーを逃している可能性があります');
            break;
          case 'ux_006':
            insights.push('フォームの使いにくさが離脱の原因となっている可能性があります');
            break;
        }
      }
    });

    return insights.slice(0, 5);
  }

  private extractConversionBlockers(results: CheckpointResult[]): string[] {
    const blockers: string[] = [];
    
    results.forEach(result => {
      if (result.score < 50 && result.impact === 'high') {
        switch (result.id) {
          case 'conv_001':
            blockers.push('プライマリCTAが目立たず、行動喚起が弱い');
            break;
          case 'conv_003':
            blockers.push('価値提案が不明確で、ユーザーのメリットが伝わらない');
            break;
          case 'conv_004':
            blockers.push('フォームが複雑すぎて離脱率が高い可能性');
            break;
        }
      }
    });

    return blockers.slice(0, 5);
  }

  private extractCompetitiveAdvantages(results: CheckpointResult[], input: AnalysisInput): string[] {
    const advantages: string[] = [];
    
    results.forEach(result => {
      if (result.score >= 80) {
        switch (result.category) {
          case 'performance':
            advantages.push('優秀なサイトパフォーマンスで競合と差別化');
            break;
          case 'trust_signals':
            advantages.push('信頼性の高いセキュリティ実装');
            break;
          case 'accessibility':
            advantages.push('包括的なアクセシビリティ対応');
            break;
        }
      }
    });

    return advantages.slice(0, 3);
  }
  
  /**
   * 詳細な改善指示を生成（新機能）
   * 座標ベースの具体的な改善案を提供
   */
  private async generateDetailedInstructions(input: AnalysisInput): Promise<DetailedInstruction[]> {
    console.log('🎯 Generating detailed improvement instructions...');
    
    try {
      // スクレイピングデータから詳細要素を抽出
      const detailedElements = this.extractDetailedElements(input);
      
      // スクリーンショット分析情報を準備
      const screenshotAnalysis = this.createScreenshotAnalysis(input);
      
      // 座標ベースの問題を特定
      const coordinateIssues = coordinateAnalyzer.identifyLocationBasedIssues(
        detailedElements, 
        screenshotAnalysis
      );
      
      // 詳細な改善指示を生成
      const detailedInstructions = improvementGenerator.generateDetailedInstructions(
        detailedElements,
        coordinateIssues
      );
      
      console.log(`📋 Generated ${detailedInstructions.length} detailed instructions`);
      return detailedInstructions;
      
    } catch (error) {
      console.error('Error generating detailed instructions:', error);
      return [];
    }
  }
  
  /**
   * スクレイピングデータから詳細要素情報を抽出
   */
  private extractDetailedElements(input: AnalysisInput): DetailedElement[] {
    const elements: DetailedElement[] = [];
    
    // CTAボタンを詳細要素として追加
    if (input.scrapedData.ctaElements) {
      input.scrapedData.ctaElements.forEach((cta, index) => {
        elements.push({
          selector: `.cta-button-${index}`,
          tagName: 'button',
          text: cta.text,
          position: {
            x: cta.position.x,
            y: cta.position.y,
            width: 140, // デフォルト幅
            height: 48, // デフォルト高さ
            centerX: cta.position.x + 70,
            centerY: cta.position.y + 24
          },
          styles: {
            backgroundColor: '#E0E0E0', // デフォルト（実際は動的に取得）
            color: '#333333',
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: '400',
            padding: '8px 16px',
            margin: '0',
            borderRadius: '4px',
            border: '1px solid #CCCCCC',
            zIndex: '1',
            display: 'inline-block',
            visibility: cta.isVisible ? 'visible' : 'hidden'
          },
          accessibility: {
            contrastRatio: 3.5, // デフォルト（実際は計算）
            hasAltText: false,
            hasAriaLabel: false,
            isFocusable: true
          },
          type: cta.type === 'button' ? 'button' : 'link'
        });
      });
    }
    
    // フォーム要素を追加
    if (input.scrapedData.forms) {
      input.scrapedData.forms.forEach((form, formIndex) => {
        form.fields.forEach((field, fieldIndex) => {
          elements.push({
            selector: `form:nth-child(${formIndex + 1}) ${field.type}[name="${field.name}"]`,
            tagName: field.type,
            text: field.label || field.name || '入力フィールド',
            position: {
              x: 50,
              y: 200 + (fieldIndex * 80), // 推定位置
              width: 300,
              height: field.type === 'textarea' ? 100 : 40,
              centerX: 200,
              centerY: 220 + (fieldIndex * 80)
            },
            styles: {
              backgroundColor: '#FFFFFF',
              color: '#333333',
              fontSize: '14px',
              fontFamily: 'Arial, sans-serif',
              fontWeight: '400',
              padding: '8px 12px',
              margin: '0 0 16px 0',
              borderRadius: '4px',
              border: '1px solid #CCCCCC',
              zIndex: '1',
              display: 'block',
              visibility: 'visible'
            },
            accessibility: {
              contrastRatio: 7.0,
              hasAltText: false,
              hasAriaLabel: field.label ? true : false,
              isFocusable: true
            },
            type: 'form'
          });
        });
      });
    }
    
    // テキスト要素を追加（見出しから）
    if (input.scrapedData.headings) {
      let yPosition = 100;
      
      ['h1', 'h2', 'h3'].forEach(tag => {
        const headings = input.scrapedData.headings[tag as keyof typeof input.scrapedData.headings] || [];
        headings.forEach((heading, index) => {
          elements.push({
            selector: `${tag}:nth-child(${index + 1})`,
            tagName: tag,
            text: heading,
            position: {
              x: 50,
              y: yPosition,
              width: 600,
              height: tag === 'h1' ? 40 : tag === 'h2' ? 32 : 24,
              centerX: 350,
              centerY: yPosition + (tag === 'h1' ? 20 : tag === 'h2' ? 16 : 12)
            },
            styles: {
              backgroundColor: 'transparent',
              color: '#333333',
              fontSize: tag === 'h1' ? '32px' : tag === 'h2' ? '24px' : '18px',
              fontFamily: 'Arial, sans-serif',
              fontWeight: tag === 'h1' ? '700' : tag === 'h2' ? '600' : '500',
              padding: '0',
              margin: '0 0 16px 0',
              borderRadius: '0',
              border: 'none',
              zIndex: '1',
              display: 'block',
              visibility: 'visible'
            },
            accessibility: {
              contrastRatio: 7.0,
              hasAltText: false,
              hasAriaLabel: false,
              isFocusable: false
            },
            type: 'text'
          });
          
          yPosition += (tag === 'h1' ? 60 : tag === 'h2' ? 48 : 36);
        });
      });
    }
    
    return elements;
  }
  
  /**
   * スクリーンショット分析情報を作成
   */
  private createScreenshotAnalysis(input: AnalysisInput): ScreenshotAnalysis {
    return {
      width: 1200, // デフォルト画面幅
      height: 800, // デフォルト画面高さ
      viewportSections: {
        aboveFold: { y: 0, height: 600 },
        belowFold: { y: 600, height: 200 }
      },
      heatmapAreas: {
        high: [
          { x: 0, y: 0, width: 800, height: 400 }, // 上部中央
        ],
        medium: [
          { x: 800, y: 0, width: 400, height: 400 }, // 上部右
          { x: 0, y: 400, width: 600, height: 200 }, // 中央左
        ],
        low: [
          { x: 600, y: 400, width: 600, height: 400 }, // 右下
          { x: 0, y: 600, width: 1200, height: 200 }, // 下部全体
        ]
      }
    };
  }
}

// エクスポート用のシングルトンインスタンス
export const analysisEngine = new AnalysisEngine();