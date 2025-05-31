import { ReviewComment, CommentCategory } from '../types';

export class CommentAnalyzer {
  private categoryKeywords: Record<CommentCategory, string[]> = {
    bug: ['bug', 'error', 'issue', 'broken', 'fix', 'crash', 'fault', 'defect'],
    performance: ['performance', 'slow', 'optimize', 'efficiency', 'memory', 'cpu', 'latency', 'bottleneck'],
    security: ['security', 'vulnerability', 'exploit', 'injection', 'xss', 'csrf', 'auth', 'permission', 'sanitize'],
    style: ['style', 'formatting', 'naming', 'convention', 'indent', 'spacing', 'lint', 'prettier'],
    documentation: ['docs', 'documentation', 'readme', 'comment', 'jsdoc', 'explain', 'description'],
    testing: ['test', 'testing', 'coverage', 'unit', 'integration', 'e2e', 'assertion', 'mock'],
    refactoring: ['refactor', 'simplify', 'extract', 'abstract', 'duplicate', 'dry', 'clean', 'readable'],
    other: []
  };

  categorizeComment(comment: ReviewComment): CommentCategory {
    const body = comment.body.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (category === 'other') continue;
      
      if (keywords.some(keyword => body.includes(keyword))) {
        return category as CommentCategory;
      }
    }
    
    return 'other';
  }

  extractActionableContent(comment: ReviewComment): string | null {
    const body = comment.body;
    
    // Remove code blocks to focus on the actual feedback
    const withoutCodeBlocks = body.replace(/```[\s\S]*?```/g, '').trim();
    
    // Skip if too short or just reactions
    if (withoutCodeBlocks.length < 10) return null;
    if (/^(LGTM|👍|👎|:\+1:|:-1:)$/i.test(withoutCodeBlocks)) return null;
    
    // Extract sentences that contain action words
    const actionPatterns = [
      /should\s+\w+/gi,
      /could\s+\w+/gi,
      /please\s+\w+/gi,
      /consider\s+\w+/gi,
      /recommend\s+\w+/gi,
      /suggest\s+\w+/gi,
      /needs?\s+to\s+\w+/gi,
      /must\s+\w+/gi,
      /have\s+to\s+\w+/gi,
      /don't\s+\w+/gi,
      /avoid\s+\w+/gi,
      /instead\s+of\s+\w+/gi
    ];
    
    const sentences = withoutCodeBlocks.split(/[.!?]+/);
    const actionableSentences = sentences.filter(sentence => 
      actionPatterns.some(pattern => pattern.test(sentence))
    );
    
    return actionableSentences.length > 0 
      ? actionableSentences.join('. ').trim() + '.'
      : withoutCodeBlocks;
  }

  getSeverity(comment: ReviewComment): 'high' | 'medium' | 'low' {
    const body = comment.body.toLowerCase();
    
    // High severity indicators
    if (body.match(/\b(critical|severe|urgent|security|vulnerability|bug|broken|crash)\b/)) {
      return 'high';
    }
    
    // Low severity indicators
    if (body.match(/\b(nit|minor|style|typo|suggestion|consider)\b/)) {
      return 'low';
    }
    
    return 'medium';
  }

  isConstructive(comment: ReviewComment): boolean {
    const body = comment.body;
    
    // Skip very short comments
    if (body.length < 20) return false;
    
    // Skip comments that are just approvals or reactions
    if (/^(LGTM|approved|looks good|👍|:\+1:)$/i.test(body.trim())) return false;
    
    // Skip quoted replies without additional content
    if (body.startsWith('>') && body.split('\n').filter(line => !line.startsWith('>')).join('').trim().length < 20) {
      return false;
    }
    
    return true;
  }
}