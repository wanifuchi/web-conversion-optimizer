// Trust Signals Checkpoints

import { Checkpoint, AnalysisInput, CheckpointResult } from '../types';

export const trustSignalsCheckpoints: Checkpoint[] = [
  {
    id: 'trust_001',
    category: 'trust_signals',
    name: 'SSL Certificate',
    description: 'SSL証明書の実装をチェック',
    weight: 9,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const hasSSL = data.scrapedData.hasSSL;
      const score = hasSSL ? 95 : 10;

      return {
        id: 'trust_001',
        category: 'trust_signals',
        name: 'SSL Certificate',
        description: 'SSL証明書の実装をチェック',
        score,
        impact: 'high',
        status: score >= 90 ? 'pass' : 'fail',
        recommendation: !hasSSL ? 
          'SSL証明書を導入し、HTTPSでサイトを配信してください' :
          'SSL証明書が適切に実装されています',
        evidence: [`HTTPS: ${hasSSL ? '実装済み' : '未実装'}`]
      };
    }
  },

  {
    id: 'trust_002',
    category: 'trust_signals',
    name: 'Contact Information',
    description: '連絡先情報の表示をチェック',
    weight: 7,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const links = data.scrapedData.links;
      const contactLinks = links.filter(link => 
        /contact|連絡|問い合わせ|tel:|mailto:/i.test(link.href) ||
        /contact|連絡|問い合わせ/i.test(link.text)
      );

      const content = data.scrapedData.description + data.scrapedData.headings.h1.join(' ');
      const phonePattern = /\d{2,4}-\d{2,4}-\d{4}|\d{10,11}/;
      const hasPhone = phonePattern.test(content);

      let score = 30;
      if (contactLinks.length > 0) score += 40;
      if (hasPhone) score += 30;

      return {
        id: 'trust_002',
        category: 'trust_signals',
        name: 'Contact Information',
        description: '連絡先情報の表示をチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 60 ? 
          '連絡先情報（電話番号、メールアドレス）を明確に表示してください' :
          '連絡先情報は適切に表示されています',
        evidence: [`お問い合わせリンク: ${contactLinks.length}`, `電話番号: ${hasPhone}`]
      };
    }
  },

  {
    id: 'trust_003',
    category: 'trust_signals',
    name: 'Privacy Policy',
    description: 'プライバシーポリシーの存在をチェック',
    weight: 6,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const links = data.scrapedData.links;
      const privacyLinks = links.filter(link => 
        /privacy|プライバシー|個人情報/i.test(link.text) ||
        /privacy|プライバシー/i.test(link.href)
      );

      const score = privacyLinks.length > 0 ? 85 : 30;

      return {
        id: 'trust_003',
        category: 'trust_signals',
        name: 'Privacy Policy',
        description: 'プライバシーポリシーの存在をチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : 'fail',
        recommendation: privacyLinks.length === 0 ? 
          'プライバシーポリシーを作成し、リンクを設置してください' :
          'プライバシーポリシーが適切に設置されています',
        evidence: [`プライバシーポリシーリンク: ${privacyLinks.length}`]
      };
    }
  },

  {
    id: 'trust_004',
    category: 'trust_signals',
    name: 'Terms of Service',
    description: '利用規約の存在をチェック',
    weight: 5,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const links = data.scrapedData.links;
      const termsLinks = links.filter(link => 
        /terms|利用規約|規約/i.test(link.text) ||
        /terms|規約/i.test(link.href)
      );

      const score = termsLinks.length > 0 ? 80 : 40;

      return {
        id: 'trust_004',
        category: 'trust_signals',
        name: 'Terms of Service',
        description: '利用規約の存在をチェック',
        score,
        impact: 'low',
        status: score >= 75 ? 'pass' : 'warning',
        recommendation: termsLinks.length === 0 ? 
          '利用規約を作成し、リンクを設置してください' :
          '利用規約が適切に設置されています',
        evidence: [`利用規約リンク: ${termsLinks.length}`]
      };
    }
  },

  {
    id: 'trust_005',
    category: 'trust_signals',
    name: 'Security Badges',
    description: 'セキュリティバッジの表示をチェック',
    weight: 4,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const socialProof = data.scrapedData.socialProof;
      const securityBadges = socialProof.filter(sp => 
        sp.type === 'badge' && /security|secure|ssl|認証|安全/i.test(sp.content)
      );

      const score = securityBadges.length > 0 ? 75 : 50;

      return {
        id: 'trust_005',
        category: 'trust_signals',
        name: 'Security Badges',
        description: 'セキュリティバッジの表示をチェック',
        score,
        impact: 'low',
        status: score >= 70 ? 'pass' : 'warning',
        recommendation: securityBadges.length === 0 ? 
          'セキュリティ認証バッジを表示して信頼性を向上させてください' :
          'セキュリティバッジが適切に表示されています',
        evidence: [`セキュリティバッジ: ${securityBadges.length}`]
      };
    }
  }
];