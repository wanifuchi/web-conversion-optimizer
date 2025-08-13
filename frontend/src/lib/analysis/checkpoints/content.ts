// Content Quality Checkpoints

import { Checkpoint, AnalysisInput, CheckpointResult } from '../types';

export const contentCheckpoints: Checkpoint[] = [
  {
    id: 'content_001',
    category: 'content',
    name: 'Content Length',
    description: 'コンテンツの量が適切かチェック',
    weight: 6,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const description = data.scrapedData.description || '';
      const headings = [
        ...data.scrapedData.headings.h1,
        ...data.scrapedData.headings.h2,
        ...data.scrapedData.headings.h3
      ];

      const totalLength = description.length + headings.join(' ').length;
      
      let score = 30;
      if (totalLength >= 300 && totalLength <= 2000) score += 50;
      else if (totalLength >= 150 && totalLength <= 3000) score += 30;

      return {
        id: 'content_001',
        category: 'content',
        name: 'Content Length',
        description: 'コンテンツの量が適切かチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: totalLength < 150 ? 
          'コンテンツを充実させてください' :
          totalLength > 3000 ? 
          'コンテンツを簡潔にまとめてください' :
          'コンテンツ量は適切です',
        evidence: [`総文字数: ${totalLength}文字`]
      };
    }
  },

  {
    id: 'content_002',
    category: 'content',
    name: 'Benefit Focus',
    description: 'ベネフィット中心のコンテンツかチェック',
    weight: 7,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const content = [
        data.scrapedData.title,
        data.scrapedData.description,
        ...data.scrapedData.headings.h1,
        ...data.scrapedData.headings.h2
      ].join(' ').toLowerCase();

      const benefitWords = [
        '効果', '成果', '結果', '改善', '向上', '解決', '節約', '短縮',
        'benefit', 'result', 'improve', 'save', 'reduce'
      ];

      const benefitCount = benefitWords.filter(word => 
        content.includes(word.toLowerCase())
      ).length;

      const score = Math.min(100, benefitCount * 15 + 40);

      return {
        id: 'content_002',
        category: 'content',
        name: 'Benefit Focus',
        description: 'ベネフィット中心のコンテンツかチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 60 ? 
          'ユーザーのベネフィットを強調するコンテンツに変更してください' :
          'ベネフィット中心のコンテンツです',
        evidence: [`ベネフィット関連語: ${benefitCount}`]
      };
    }
  },

  {
    id: 'content_003',
    category: 'content',
    name: 'Clear Value Proposition',
    description: '明確な価値提案があるかチェック',
    weight: 8,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const h1 = data.scrapedData.headings.h1[0] || '';
      const title = data.scrapedData.title;
      
      const uniqueWords = ['最高', '最安', '唯一', '独自', 'best', 'only', 'unique'];
      const hasUnique = uniqueWords.some(word => 
        h1.toLowerCase().includes(word.toLowerCase()) ||
        title.toLowerCase().includes(word.toLowerCase())
      );

      let score = 50;
      if (h1.length > 10) score += 20;
      if (hasUnique) score += 30;

      return {
        id: 'content_003',
        category: 'content',
        name: 'Clear Value Proposition',
        description: '明確な価値提案があるかチェック',
        score,
        impact: 'high',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 60 ? 
          '明確で差別化された価値提案を最上部に配置してください' :
          '価値提案は明確です',
        evidence: [`独自性表現: ${hasUnique}`, `H1長: ${h1.length}文字`]
      };
    }
  },

  {
    id: 'content_004',
    category: 'content',
    name: 'Problem Solution Match',
    description: '問題と解決策の対応をチェック',
    weight: 7,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const content = [
        data.scrapedData.title,
        data.scrapedData.description,
        ...data.scrapedData.headings.h1,
        ...data.scrapedData.headings.h2
      ].join(' ').toLowerCase();

      const problemWords = ['問題', '悩み', '困る', '課題', 'problem', 'issue', 'trouble'];
      const solutionWords = ['解決', '改善', '対策', 'solution', 'solve', 'fix'];

      const hasProblem = problemWords.some(word => content.includes(word.toLowerCase()));
      const hasSolution = solutionWords.some(word => content.includes(word.toLowerCase()));

      let score = 40;
      if (hasProblem) score += 30;
      if (hasSolution) score += 30;

      return {
        id: 'content_004',
        category: 'content',
        name: 'Problem Solution Match',
        description: '問題と解決策の対応をチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 60 ? 
          '顧客の問題とその解決策を明確に示してください' :
          '問題と解決策が適切に示されています',
        evidence: [`問題提起: ${hasProblem}`, `解決策提示: ${hasSolution}`]
      };
    }
  },

  {
    id: 'content_005',
    category: 'content',
    name: 'Scannable Content',
    description: '流し読みしやすいコンテンツかチェック',
    weight: 5,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const h2Count = data.scrapedData.headings.h2.length;
      const h3Count = data.scrapedData.headings.h3.length;
      const totalHeadings = h2Count + h3Count;

      let score = 40;
      if (totalHeadings >= 3) score += 30;
      if (totalHeadings >= 5) score += 20;
      if (h2Count >= 2) score += 10;

      return {
        id: 'content_005',
        category: 'content',
        name: 'Scannable Content',
        description: '流し読みしやすいコンテンツかチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: totalHeadings < 3 ? 
          '見出しを使ってコンテンツを構造化し、流し読みしやすくしてください' :
          'コンテンツは流し読みしやすく構造化されています',
        evidence: [`見出し総数: ${totalHeadings}`, `H2: ${h2Count}`, `H3: ${h3Count}`]
      };
    }
  }
];