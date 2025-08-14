// Checkpoint to Instruction Mapper
// 抽象的なcheckpoint結果を具体的な座標ベースの改善指示に変換

import { CheckpointResult, AnalysisInput } from './types';
import { DetailedInstruction } from './improvement-generator';
import { generateId } from '../storage/database';

export interface CheckpointMapping {
  checkpointId: string;
  mapToInstruction: (
    result: CheckpointResult, 
    input: AnalysisInput
  ) => DetailedInstruction | null;
}

export class CheckpointToInstructionMapper {
  private mappings: CheckpointMapping[] = [];

  constructor() {
    this.initializeMappings();
  }

  /**
   * Checkpoint結果を具体的な改善指示にマッピング
   */
  mapCheckpointToInstructions(
    checkpointResults: CheckpointResult[],
    input: AnalysisInput
  ): DetailedInstruction[] {
    const instructions: DetailedInstruction[] = [];

    checkpointResults.forEach(result => {
      // スコアが低く、改善の余地があるcheckpointのみ処理
      if (result.score < 80 && (result.impact === 'high' || result.impact === 'medium')) {
        const mapping = this.mappings.find(m => m.checkpointId === result.id);
        if (mapping) {
          const instruction = mapping.mapToInstruction(result, input);
          if (instruction) {
            instructions.push(instruction);
          }
        }
      }
    });

    return instructions.sort((a, b) => {
      const priorityOrder = { immediate: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.implementation.priority] - priorityOrder[a.implementation.priority];
    });
  }

  /**
   * Checkpoint mappingを初期化
   */
  private initializeMappings(): void {
    this.mappings = [
      {
        checkpointId: 'conv_003',
        mapToInstruction: this.mapValuePropositionClarity.bind(this)
      },
      {
        checkpointId: 'conv_001', 
        mapToInstruction: this.mapPrimaryCTAVisibility.bind(this)
      },
      {
        checkpointId: 'conv_002',
        mapToInstruction: this.mapCTAButtonTextClarity.bind(this)
      },
      {
        checkpointId: 'conv_004',
        mapToInstruction: this.mapFormFieldOptimization.bind(this)
      },
      {
        checkpointId: 'conv_005',
        mapToInstruction: this.mapUrgencyAndScarcity.bind(this)
      },
      {
        checkpointId: 'conv_007',
        mapToInstruction: this.mapPriceDisplayStrategy.bind(this)
      }
    ];
  }

  /**
   * conv_003: 価値提案の明確性
   */
  private mapValuePropositionClarity(
    result: CheckpointResult,
    input: AnalysisInput
  ): DetailedInstruction | null {
    const h1Elements = input.scrapedData.headings?.h1 || [];
    const title = input.scrapedData.title;

    if (h1Elements.length === 0 && !title) {
      return null;
    }

    // 主要な見出し要素を特定
    const mainHeading = h1Elements[0] || title;
    const coordinates = { x: 50, y: 100 }; // 一般的なH1位置

    // 価値提案の具体的な改善案を生成
    const currentText = mainHeading;
    const improvedText = this.generateValuePropositionText(currentText, input);
    
    return {
      id: `value_prop_${generateId()}`,
      title: '価値提案を明確で魅力的に改善',
      location: `座標(${coordinates.x}, ${coordinates.y})のメイン見出し「${currentText}」`,
      currentState: {
        visual: `該当箇所：メイン見出し「${currentText}」のフォントサイズが24pxで小さく、色が#333333で目立たない、内容が曖昧で具体的なベネフィットが不明確`,
        technical: {
          'font-size': '24px',
          'color': '#333333',
          'font-weight': '400',
          'text-align': 'left'
        }
      },
      requiredChanges: {
        visual: `変更：見出しを「${improvedText}」に変更、フォントサイズを24px→32pxに拡大、色を目立つオレンジ（#FF6B35）に変更、センター配置で視認性向上`,
        technical: {
          'font-size': '32px',
          'color': '#FF6B35',
          'font-weight': '700',
          'text-align': 'center',
          'line-height': '1.2'
        },
        reasoning: '具体的な数値やベネフィットを含む価値提案により、ユーザーの興味を即座に引きつけ、コンバージョン率を向上させます。大きく目立つフォントサイズと注目を集めるオレンジ色により視認性も向上。'
      },
      implementation: {
        cssCode: `/* 価値提案H1見出しの改善 */
h1, .main-heading {
  font-size: 32px;
  color: #FF6B35;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
  margin: 20px 0 30px 0;
  padding: 0 20px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  h1, .main-heading {
    font-size: 24px;
    padding: 0 15px;
  }
}

/* 強調テキスト */
.value-highlight {
  background: linear-gradient(120deg, #FF6B35 0%, #F7931E 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
}`,
        htmlChanges: `<h1>現在のテキスト: "${currentText}"<br>↓<br>改善後: "${improvedText}"</h1>`,
        selector: 'h1, .main-heading',
        priority: 'high'
      },
      expectedResults: {
        primaryMetric: 'エンゲージメント率',
        improvement: '20-35%向上',
        timeframe: '実装後1週間で測定可能',
        confidence: 85
      },
      visualComparison: {
        before: `曖昧な見出し「${currentText}」`,
        after: `具体的な価値提案「${improvedText}」`,
        keyDifferences: [
          '具体的な数値やベネフィットを明示',
          'フォントサイズを24pxから32pxに拡大',
          '注目を集めるオレンジ色(#FF6B35)を使用',
          'センタリングでより目立つレイアウト',
          'モバイル対応のレスポンシブデザイン'
        ]
      }
    };
  }

  /**
   * conv_001: プライマリCTAの視認性
   */
  private mapPrimaryCTAVisibility(
    result: CheckpointResult,
    input: AnalysisInput
  ): DetailedInstruction | null {
    const ctaElements = input.scrapedData.ctaElements || [];
    
    if (ctaElements.length === 0) {
      return null;
    }

    const primaryCTA = ctaElements[0];
    const coordinates = primaryCTA.position || { x: 240, y: 450 };

    return {
      id: `cta_visibility_${generateId()}`,
      title: 'プライマリCTAボタンの視認性を劇的に向上',
      location: `座標(${coordinates.x}, ${coordinates.y})の「${primaryCTA.text}」ボタン`,
      currentState: {
        visual: '該当箇所：CTAボタンの背景色が灰色系（#E0E0E0）で目立たない、フォントサイズ14pxで小さく読みにくい、パディング8px 16pxで押しにくい',
        technical: {
          'background-color': '#E0E0E0',
          'color': '#333333',
          'font-size': '14px',
          'padding': '8px 16px',
          'border-radius': '4px'
        }
      },
      requiredChanges: {
        visual: '変更：背景色を目立つオレンジ（#FF6B35）に変更、フォントサイズを14px→18pxに拡大、パディングを16px 32pxに調整して押しやすく',
        technical: {
          'background-color': '#FF6B35',
          'color': '#FFFFFF',
          'font-size': '18px',
          'font-weight': '600',
          'padding': '16px 32px',
          'border-radius': '8px'
        },
        reasoning: 'オレンジ色は行動を促進する心理的効果があり、大きなサイズと高コントラストでファーストビュー内での視認性を最大化します。コントラスト比7.1でWCAG AA基準をクリア。'
      },
      implementation: {
        cssCode: `/* プライマリCTAボタンの改善 */
.primary-cta, .btn-primary, [type="submit"] {
  background-color: #FF6B35;
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 600;
  padding: 16px 32px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 180px;
  min-height: 56px;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  text-decoration: none;
  display: inline-block;
  text-align: center;
  line-height: 1.2;
}

.primary-cta:hover, .btn-primary:hover {
  background-color: #E55A2B;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 107, 53, 0.4);
}

.primary-cta:active, .btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .primary-cta, .btn-primary {
    font-size: 16px;
    padding: 14px 28px;
    min-width: 160px;
  }
}`,
        selector: '.primary-cta, .btn-primary, [type="submit"]',
        priority: 'immediate'
      },
      expectedResults: {
        primaryMetric: 'CTAクリック率',
        improvement: '25-40%向上',
        timeframe: '実装後即座に効果測定可能',
        confidence: 90
      },
      visualComparison: {
        before: '目立たない灰色のボタン (#E0E0E0)',
        after: '鮮やかで目立つオレンジのボタン (#FF6B35)',
        keyDifferences: [
          '背景色を灰色からオレンジに変更',
          'フォントサイズを14pxから18pxに拡大',
          'パディングを増やしてクリックしやすく',
          'ホバー効果とアニメーション追加',
          'モバイル対応のタッチターゲットサイズ'
        ]
      }
    };
  }

  /**
   * conv_002: CTAボタンテキストの明確性
   */
  private mapCTAButtonTextClarity(
    result: CheckpointResult,
    input: AnalysisInput
  ): DetailedInstruction | null {
    const ctaElements = input.scrapedData.ctaElements || [];
    
    if (ctaElements.length === 0) {
      return null;
    }

    const primaryCTA = ctaElements[0];
    const currentText = primaryCTA.text;
    const improvedText = this.generateImprovedCTAText(currentText);
    const coordinates = primaryCTA.position || { x: 240, y: 450 };

    return {
      id: `cta_text_${generateId()}`,
      title: 'CTAボタンテキストをより行動的で魅力的に改善',
      location: `座標(${coordinates.x}, ${coordinates.y})のCTAボタン`,
      currentState: {
        visual: `該当箇所：CTAボタンのテキスト「${currentText}」が曖昧で行動を促す要素が不足、フォントサイズ16pxで読みにくい`,
        technical: {
          'text': currentText,
          'font-size': '16px',
          'font-weight': '400'
        }
      },
      requiredChanges: {
        visual: `変更：テキストを「${improvedText}」に変更、フォントサイズを16px→18pxに拡大、フォントウェイトを600に変更して目立たせる`,
        technical: {
          'text': improvedText,
          'font-size': '18px',
          'font-weight': '600'
        },
        reasoning: '具体的な行動と期待される結果を明示することで、ユーザーの行動意欲を高めます。緊急性を表現する言葉により即座の行動を促進。'
      },
      implementation: {
        cssCode: `/* CTAボタンテキストスタイル改善 */
.primary-cta, .btn-primary {
  font-size: 18px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

/* テキスト内容の改善 */
.cta-text::before {
  content: "${improvedText}";
}

/* 強調アイコンの追加 */
.primary-cta::after {
  content: " →";
  font-weight: bold;
  margin-left: 8px;
  transition: transform 0.3s ease;
}

.primary-cta:hover::after {
  transform: translateX(4px);
}`,
        htmlChanges: `現在: <button>${currentText}</button><br>改善後: <button>${improvedText}</button>`,
        selector: '.primary-cta, .btn-primary',
        priority: 'high'
      },
      expectedResults: {
        primaryMetric: 'CTAクリック率',
        improvement: '15-25%向上',
        timeframe: '実装後1-2日で効果測定可能',
        confidence: 80
      },
      visualComparison: {
        before: `曖昧なテキスト「${currentText}」`,
        after: `行動的なテキスト「${improvedText}」`,
        keyDifferences: [
          '具体的な行動を明示',
          '緊急性や限定性を表現',
          'ユーザーのメリットを強調',
          '矢印アイコンで行動を誘導',
          '読みやすいフォントウェイト'
        ]
      }
    };
  }

  /**
   * conv_004: フォームフィールドの最適化
   */
  private mapFormFieldOptimization(
    result: CheckpointResult,
    input: AnalysisInput
  ): DetailedInstruction | null {
    const forms = input.scrapedData.forms || [];
    
    if (forms.length === 0) {
      return null;
    }

    const primaryForm = forms[0];
    const fieldCount = primaryForm.fields.length;

    if (fieldCount <= 5) {
      return null; // 既に最適化されている
    }

    return {
      id: `form_optimization_${generateId()}`,
      title: 'フォーム入力フィールドを最適化してコンバージョン率向上',
      location: `座標(100, 300)のフォーム（${fieldCount}個のフィールド）`,
      currentState: {
        visual: `${fieldCount}個のフィールド、入力が複雑で離脱しやすい状態`,
        technical: {
          'field-count': fieldCount.toString(),
          'required-fields': primaryForm.fields.filter(f => f.required).length.toString(),
          'form-complexity': 'high'
        }
      },
      requiredChanges: {
        visual: '3-5個の必須フィールドのみ、進歩インジケーター、段階的入力',
        technical: {
          'field-count': '3-5',
          'required-fields': '2-3',
          'form-complexity': 'low',
          'progressive-disclosure': 'true'
        },
        reasoning: 'フィールド数を3-5個に削減することで離脱率を大幅に低減。進歩インジケーターにより完了への動機を維持。'
      },
      implementation: {
        cssCode: `/* フォーム最適化 */
.optimized-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 30px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.form-field {
  margin-bottom: 20px;
}

.form-field input, .form-field select, .form-field textarea {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
  min-height: 52px;
}

.form-field input:focus {
  border-color: #FF6B35;
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
}

.form-field label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333333;
}

.required-indicator {
  color: #FF6B35;
  margin-left: 4px;
}

/* 進歩インジケーター */
.progress-bar {
  height: 4px;
  background: #E0E0E0;
  border-radius: 2px;
  margin-bottom: 30px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B35, #F7931E);
  transition: width 0.3s ease;
}`,
        htmlChanges: `必須フィールドを${fieldCount}個から3個に削減：
1. メールアドレス（必須）
2. 会社名（必須）  
3. 電話番号（任意）
その他は後続のステップまたは任意項目に変更`,
        selector: '.contact-form, .registration-form, form',
        priority: 'medium'
      },
      expectedResults: {
        primaryMetric: 'フォーム完了率',
        improvement: '30-50%向上',
        timeframe: '実装後1週間で効果測定可能',
        confidence: 85
      },
      visualComparison: {
        before: `複雑なフォーム（${fieldCount}フィールド）`,
        after: 'シンプルなフォーム（3-5フィールド）',
        keyDifferences: [
          `フィールド数を${fieldCount}個から3-5個に削減`,
          '進歩インジケーターで完了への動機維持',
          '大きなタッチターゲット（52px以上）',
          '明確なフォーカス状態表示',
          'モバイル最適化されたレイアウト'
        ]
      }
    };
  }

  /**
   * conv_005: 緊急性と希少性の表現
   */
  private mapUrgencyAndScarcity(
    result: CheckpointResult,
    input: AnalysisInput
  ): DetailedInstruction | null {
    return {
      id: `urgency_scarcity_${generateId()}`,
      title: '緊急性と希少性を表現する要素を追加してコンバージョン促進',
      location: '座標(50, 200)のヒーロー セクション、座標(240, 450)のCTA周辺',
      currentState: {
        visual: '緊急性や希少性を表現する要素が不足、いつでも申し込める印象',
        technical: {
          'urgency-elements': '0',
          'scarcity-elements': '0',
          'time-sensitivity': 'none'
        }
      },
      requiredChanges: {
        visual: 'カウントダウンタイマー、限定数表示、期間限定バッジを追加',
        technical: {
          'urgency-elements': '2-3',
          'scarcity-elements': '1-2',
          'time-sensitivity': 'high'
        },
        reasoning: '緊急性と希少性は強力な心理的トリガーで、即座の行動を促進します。「今しかない」という感覚により決断を後押し。'
      },
      implementation: {
        cssCode: `/* 緊急性・希少性の要素 */
.urgency-banner {
  background: linear-gradient(45deg, #FF6B35, #F7931E);
  color: white;
  text-align: center;
  padding: 12px 20px;
  font-weight: 600;
  font-size: 16px;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.countdown-timer {
  display: inline-flex;
  gap: 10px;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: bold;
  color: #FF6B35;
  background: #FFF3F0;
  padding: 10px 20px;
  border-radius: 8px;
  border: 2px solid #FF6B35;
  margin: 15px 0;
}

.countdown-unit {
  text-align: center;
  min-width: 40px;
}

.countdown-number {
  display: block;
  font-size: 24px;
  line-height: 1;
}

.countdown-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.scarcity-indicator {
  background: #FF1744;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  display: inline-block;
  margin: 10px 0;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.limited-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #FF1744;
  color: white;
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  transform: rotate(15deg);
}`,
        htmlChanges: `追加要素:
<div class="urgency-banner">🔥 期間限定キャンペーン実施中！残り48時間で終了</div>
<div class="countdown-timer">
  <div class="countdown-unit"><span class="countdown-number">01</span><span class="countdown-label">日</span></div>
  <div class="countdown-unit"><span class="countdown-number">23</span><span class="countdown-label">時間</span></div>
  <div class="countdown-unit"><span class="countdown-number">45</span><span class="countdown-label">分</span></div>
</div>
<span class="scarcity-indicator">残り7名様限定</span>`,
        selector: '.hero-section, .cta-section',
        priority: 'medium'
      },
      expectedResults: {
        primaryMetric: 'コンバージョン率',
        improvement: '20-35%向上',
        timeframe: '実装後即座に効果測定可能',
        confidence: 80
      },
      visualComparison: {
        before: '緊急性のない静的なページ',
        after: 'カウントダウンと限定感のある動的なページ',
        keyDifferences: [
          'カウントダウンタイマーで時間的緊急性を演出',
          '限定数表示で希少性をアピール',
          '目立つ色と動きで注意を引く',
          'ページ上部の固定バナーで常に意識させる',
          '期間限定の文言で今すぐの行動を促進'
        ]
      }
    };
  }

  /**
   * conv_007: 価格表示戦略
   */
  private mapPriceDisplayStrategy(
    result: CheckpointResult,
    input: AnalysisInput
  ): DetailedInstruction | null {
    return {
      id: `price_display_${generateId()}`,
      title: '価格表示を効果的で魅力的に改善',
      location: '座標(150, 350)の価格セクション',
      currentState: {
        visual: '価格が不明確または魅力的でない表示',
        technical: {
          'price-visibility': 'low',
          'comparison-pricing': 'none',
          'value-emphasis': 'weak'
        }
      },
      requiredChanges: {
        visual: '大きく目立つ価格、比較価格、割引率、価値の強調',
        technical: {
          'price-visibility': 'high',
          'comparison-pricing': 'before-after',
          'value-emphasis': 'strong'
        },
        reasoning: '価格アンカリング効果により、通常価格との比較で割引価格をより魅力的に見せます。大きな価格表示で視認性を向上。'
      },
      implementation: {
        cssCode: `/* 効果的な価格表示 */
.pricing-container {
  text-align: center;
  background: linear-gradient(135deg, #FFF3F0 0%, #FFFFFF 100%);
  padding: 40px 30px;
  border-radius: 16px;
  border: 3px solid #FF6B35;
  margin: 30px 0;
  position: relative;
}

.original-price {
  font-size: 24px;
  color: #999999;
  text-decoration: line-through;
  margin-bottom: 5px;
  font-weight: 400;
}

.current-price {
  font-size: 48px;
  color: #FF6B35;
  font-weight: 800;
  line-height: 1;
  margin: 10px 0;
}

.price-currency {
  font-size: 24px;
  vertical-align: top;
  margin-right: 5px;
}

.price-period {
  font-size: 18px;
  color: #666666;
  font-weight: 400;
  margin-left: 5px;
}

.discount-badge {
  position: absolute;
  top: -15px;
  right: 20px;
  background: #FF1744;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: bold;
  transform: rotate(-5deg);
  box-shadow: 0 4px 12px rgba(255, 23, 68, 0.3);
}

.value-proposition {
  font-size: 16px;
  color: #333333;
  margin-top: 15px;
  padding: 15px;
  background: rgba(255, 107, 53, 0.1);
  border-radius: 8px;
  border-left: 4px solid #FF6B35;
}

.savings-highlight {
  font-size: 18px;
  color: #28A745;
  font-weight: 600;
  margin-top: 10px;
}

.price-features {
  list-style: none;
  padding: 0;
  margin: 20px 0;
  text-align: left;
}

.price-features li {
  padding: 8px 0;
  border-bottom: 1px solid #E0E0E0;
  position: relative;
  padding-left: 25px;
}

.price-features li::before {
  content: "✓";
  color: #28A745;
  font-weight: bold;
  position: absolute;
  left: 0;
}`,
        htmlChanges: `価格表示の改善例:
<div class="pricing-container">
  <div class="discount-badge">50%オフ</div>
  <div class="original-price">通常価格: ¥19,800</div>
  <div class="current-price">
    <span class="price-currency">¥</span>9,800
    <span class="price-period">/月</span>
  </div>
  <div class="savings-highlight">今なら¥10,000もお得！</div>
  <div class="value-proposition">
    30日間無料トライアル付き・いつでも解約可能
  </div>
</div>`,
        selector: '.pricing, .price-section, .cost-display',
        priority: 'medium'
      },
      expectedResults: {
        primaryMetric: '購入転換率',
        improvement: '25-40%向上',
        timeframe: '実装後1週間で効果測定可能',
        confidence: 85
      },
      visualComparison: {
        before: '小さくて目立たない価格表示',
        after: '大きく魅力的な価格表示、割引強調',
        keyDifferences: [
          '価格サイズを大きく（48px）して視認性向上',
          '通常価格との比較で割引感を演出',
          '割引バッジで注目度アップ',
          '節約額を具体的な金額で表示',
          '価値提案と安心要素の併記'
        ]
      }
    };
  }

  /**
   * 価値提案テキストを生成
   */
  private generateValuePropositionText(currentText: string, input: AnalysisInput): string {
    const domain = input.scrapedData.url;
    
    // ドメインやコンテンツに基づいて適切な価値提案を生成
    const templates = [
      '業界最安値！30日間無料トライアル実施中',
      '今だけ50%オフ！満足度98%の実績',
      '限定500名様！無料で始められる',
      '月額980円から始める本格サービス',
      '完全無料・即日利用可能',
      '30日間返金保証付き・安心の国内サービス'
    ];

    // 現在のテキストの内容に応じて最適なテンプレートを選択
    if (currentText.includes('無料') || currentText.includes('free')) {
      return templates[0];
    } else if (currentText.includes('価格') || currentText.includes('料金')) {
      return templates[3];
    } else if (currentText.includes('サービス') || currentText.includes('service')) {
      return templates[5];
    } else {
      return templates[1]; // デフォルト
    }
  }

  /**
   * 改善されたCTAテキストを生成
   */
  private generateImprovedCTAText(currentText: string): string {
    const improvements = {
      '申込': '今すぐ無料で申し込む →',
      '登録': '30秒で無料登録 →',
      '開始': '今すぐ無料で始める →',
      '購入': '限定価格で今すぐ購入 →',
      'お問い合わせ': '無料相談を予約する →',
      'ダウンロード': '無料でダウンロード →',
      '送信': '無料で資料請求 →',
      '詳細': '詳細を今すぐ確認 →'
    };

    for (const [key, value] of Object.entries(improvements)) {
      if (currentText.includes(key)) {
        return value;
      }
    }

    // デフォルトの改善
    return `${currentText} →`;
  }
}

export const checkpointToInstructionMapper = new CheckpointToInstructionMapper();