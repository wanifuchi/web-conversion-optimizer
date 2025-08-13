// SEO Checkpoints

import { Checkpoint, AnalysisInput, CheckpointResult } from '../types';

export const seoCheckpoints: Checkpoint[] = [
  {
    id: 'seo_001',
    category: 'seo',
    name: 'Title Tag Optimization',
    description: 'タイトルタグの最適化状況をチェック',
    weight: 9,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const title = data.scrapedData.title;
      const titleLength = title.length;
      
      let score = 30;
      if (titleLength >= 30 && titleLength <= 60) score += 50;
      else if (titleLength >= 20 && titleLength <= 70) score += 30;
      
      if (title.includes('|') || title.includes('-')) score += 20;

      return {
        id: 'seo_001',
        category: 'seo',
        name: 'Title Tag Optimization',
        description: 'タイトルタグの最適化状況をチェック',
        score,
        impact: 'high',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: titleLength < 30 || titleLength > 60 ? 
          'タイトルを30-60文字に調整し、キーワードを含めてください' :
          'タイトルタグは良好です',
        evidence: [`タイトル長: ${titleLength}文字`, `タイトル: ${title.substring(0, 50)}...`]
      };
    }
  },

  {
    id: 'seo_002',
    category: 'seo',
    name: 'Meta Description',
    description: 'メタディスクリプションの最適化状況をチェック',
    weight: 7,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const description = data.scrapedData.description;
      const descLength = description.length;
      
      let score = 0;
      if (descLength >= 120 && descLength <= 160) score = 90;
      else if (descLength >= 100 && descLength <= 180) score = 70;
      else if (descLength > 0) score = 40;

      return {
        id: 'seo_002',
        category: 'seo',
        name: 'Meta Description',
        description: 'メタディスクリプションの最適化状況をチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: descLength === 0 ? 
          'メタディスクリプションを120-160文字で設定してください' :
          descLength < 120 || descLength > 160 ? 
          'メタディスクリプションを120-160文字に調整してください' :
          'メタディスクリプションは良好です',
        evidence: [`説明文長: ${descLength}文字`]
      };
    }
  },

  {
    id: 'seo_003',
    category: 'seo',
    name: 'H1 Tag Usage',
    description: 'H1タグの適切な使用をチェック',
    weight: 8,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const h1Count = data.scrapedData.headings.h1.length;
      const h1Text = data.scrapedData.headings.h1[0] || '';
      
      let score = 0;
      if (h1Count === 1) score += 60;
      if (h1Text.length >= 20 && h1Text.length <= 70) score += 40;

      return {
        id: 'seo_003',
        category: 'seo',
        name: 'H1 Tag Usage',
        description: 'H1タグの適切な使用をチェック',
        score,
        impact: 'high',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: h1Count !== 1 ? 
          'H1タグは1つだけ使用してください' :
          h1Text.length < 20 || h1Text.length > 70 ? 
          'H1タグを20-70文字に調整してください' :
          'H1タグは適切です',
        evidence: [`H1数: ${h1Count}`, `H1長: ${h1Text.length}文字`]
      };
    }
  },

  {
    id: 'seo_004',
    category: 'seo',
    name: 'Internal Linking',
    description: '内部リンクの充実度をチェック',
    weight: 6,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const links = data.scrapedData.links;
      const internalLinks = links.filter(link => !link.isExternal).length;
      
      let score = 40;
      if (internalLinks >= 5) score += 30;
      if (internalLinks >= 10) score += 20;
      if (internalLinks >= 15) score += 10;

      return {
        id: 'seo_004',
        category: 'seo',
        name: 'Internal Linking',
        description: '内部リンクの充実度をチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: internalLinks < 5 ? 
          '内部リンクを増やしてサイト内の回遊性を向上させてください' :
          '内部リンクは充実しています',
        evidence: [`内部リンク数: ${internalLinks}`]
      };
    }
  },

  {
    id: 'seo_005',
    category: 'seo',
    name: 'Image SEO',
    description: '画像のSEO最適化をチェック',
    weight: 5,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const images = data.scrapedData.images;
      const imagesWithAlt = images.filter(img => img.alt && img.alt.trim() !== '').length;
      
      const score = images.length > 0 ? 
        Math.round((imagesWithAlt / images.length) * 100) : 80;

      return {
        id: 'seo_005',
        category: 'seo',
        name: 'Image SEO',
        description: '画像のSEO最適化をチェック',
        score,
        impact: 'medium',
        status: score >= 90 ? 'pass' : score >= 70 ? 'warning' : 'fail',
        recommendation: score < 70 ? 
          'すべての画像にSEOを考慮したalt属性を設定してください' :
          '画像SEOは良好です',
        evidence: [`alt属性率: ${score}%`]
      };
    }
  }
];