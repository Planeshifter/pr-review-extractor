import { CommentAnalyzer } from './comment-analyzer';
import { ExtractedData } from './pr-extractor';
import { Checklist, ChecklistCategory, ChecklistItem, CommentCategory, ReviewComment } from '../types';

export class ChecklistGenerator {
  private analyzer: CommentAnalyzer;
  private minFrequency: number = 2; // Minimum occurrences to include in checklist

  constructor() {
    this.analyzer = new CommentAnalyzer();
  }

  generate(extractedData: ExtractedData, repository: string): Checklist {
    const patternMap = new Map<string, {
      comments: ReviewComment[];
      category: CommentCategory;
      severity: 'high' | 'medium' | 'low';
    }>();

    // Analyze all comments and group by patterns
    extractedData.comments.forEach((comments) => {
      comments.forEach(comment => {
        const category = this.analyzer.categorizeComment(comment);
        const actionableContent = this.analyzer.extractActionableContent(comment);
        const severity = this.analyzer.getSeverity(comment);

        if (actionableContent) {
          const pattern = this.normalizePattern(actionableContent);
          
          if (!patternMap.has(pattern)) {
            patternMap.set(pattern, {
              comments: [],
              category,
              severity
            });
          }
          
          patternMap.get(pattern)!.comments.push(comment);
        }
      });
    });

    // Convert patterns to checklist items
    const categoryMap = new Map<CommentCategory, ChecklistItem[]>();

    patternMap.forEach((data, pattern) => {
      if (data.comments.length >= this.minFrequency) {
        const item: ChecklistItem = {
          text: this.createChecklistText(pattern),
          category: data.category,
          frequency: data.comments.length,
          examples: data.comments.slice(0, 3).map(c => c.body.substring(0, 100) + '...'),
          severity: data.severity
        };

        if (!categoryMap.has(data.category)) {
          categoryMap.set(data.category, []);
        }
        categoryMap.get(data.category)!.push(item);
      }
    });

    // Sort items by frequency and severity
    const categories: ChecklistCategory[] = [];
    categoryMap.forEach((items, categoryName) => {
      items.sort((a, b) => {
        // Sort by severity first, then frequency
        const severityOrder = { high: 3, medium: 2, low: 1 };
        if (a.severity !== b.severity) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return b.frequency - a.frequency;
      });

      categories.push({
        name: this.formatCategoryName(categoryName),
        items
      });
    });

    // Sort categories by total items
    categories.sort((a, b) => b.items.length - a.items.length);

    return {
      repository,
      generatedAt: new Date(),
      categories,
      stats: {
        totalPRs: extractedData.stats.totalPRs,
        totalComments: extractedData.stats.totalComments,
        uniqueReviewers: extractedData.stats.uniqueReviewers.size
      }
    };
  }

  private normalizePattern(text: string): string {
    // Remove specific identifiers and normalize to create patterns
    return text
      .toLowerCase()
      .replace(/`[^`]+`/g, '`code`') // Replace inline code with generic placeholder
      .replace(/\b\w+\.(ts|js|tsx|jsx|py|java|go)\b/g, 'filename') // Replace file names
      .replace(/\b(function|class|const|let|var)\s+\w+/g, '$1 name') // Replace identifiers
      .replace(/\d+/g, 'N') // Replace numbers
      .trim();
  }

  private createChecklistText(pattern: string): string {
    // Convert pattern back to actionable checklist item
    return pattern
      .replace(/^please\s+/i, '')
      .replace(/^you should\s+/i, '')
      .replace(/^consider\s+/i, 'Consider ')
      .replace(/^(.)/i, (match) => match.toUpperCase())
      .replace(/`code`/g, 'relevant code')
      .replace(/filename/g, 'the file')
      .replace(/\bname\b/g, 'identifier');
  }

  private formatCategoryName(category: CommentCategory): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
}