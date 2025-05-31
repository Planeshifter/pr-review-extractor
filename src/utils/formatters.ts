import { Checklist } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ChecklistFormatter {
  async saveAsJSON(checklist: Checklist, outputPath: string): Promise<void> {
    const json = JSON.stringify(checklist, null, 2);
    await fs.writeFile(outputPath, json, 'utf-8');
  }

  async saveAsMarkdown(checklist: Checklist, outputPath: string): Promise<void> {
    let markdown = `# PR Review Checklist\n\n`;
    markdown += `**Repository:** ${checklist.repository}\n`;
    markdown += `**Generated:** ${checklist.generatedAt.toISOString()}\n\n`;
    
    markdown += `## Statistics\n\n`;
    markdown += `- Total PRs analyzed: ${checklist.stats.totalPRs}\n`;
    markdown += `- Total comments analyzed: ${checklist.stats.totalComments}\n`;
    markdown += `- Unique reviewers: ${checklist.stats.uniqueReviewers}\n\n`;

    checklist.categories.forEach(category => {
      markdown += `## ${category.name}\n\n`;
      
      category.items.forEach((item, index) => {
        const severityIcon = {
          high: '🔴',
          medium: '🟡',
          low: '🟢'
        }[item.severity];
        
        markdown += `${index + 1}. ${severityIcon} **${item.text}** (${item.frequency} occurrences)\n`;
        
        if (item.examples.length > 0) {
          markdown += `   <details>\n`;
          markdown += `   <summary>Examples</summary>\n\n`;
          item.examples.forEach(example => {
            markdown += `   > ${example}\n\n`;
          });
          markdown += `   </details>\n\n`;
        }
      });
      
      markdown += '\n';
    });

    await fs.writeFile(outputPath, markdown, 'utf-8');
  }

  async saveAsYAML(checklist: Checklist, outputPath: string): Promise<void> {
    let yaml = `# PR Review Checklist\n`;
    yaml += `repository: ${checklist.repository}\n`;
    yaml += `generated: ${checklist.generatedAt.toISOString()}\n\n`;
    
    yaml += `stats:\n`;
    yaml += `  totalPRs: ${checklist.stats.totalPRs}\n`;
    yaml += `  totalComments: ${checklist.stats.totalComments}\n`;
    yaml += `  uniqueReviewers: ${checklist.stats.uniqueReviewers}\n\n`;
    
    yaml += `categories:\n`;
    checklist.categories.forEach(category => {
      yaml += `  - name: ${category.name}\n`;
      yaml += `    items:\n`;
      
      category.items.forEach(item => {
        yaml += `      - text: "${item.text}"\n`;
        yaml += `        severity: ${item.severity}\n`;
        yaml += `        frequency: ${item.frequency}\n`;
        if (item.examples.length > 0) {
          yaml += `        examples:\n`;
          item.examples.forEach(example => {
            yaml += `          - "${example.replace(/"/g, '\\"')}"\n`;
          });
        }
      });
    });

    await fs.writeFile(outputPath, yaml, 'utf-8');
  }

  async save(checklist: Checklist, outputPath: string, format: 'json' | 'markdown' | 'yaml'): Promise<void> {
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    switch (format) {
      case 'json':
        await this.saveAsJSON(checklist, outputPath);
        break;
      case 'markdown':
        await this.saveAsMarkdown(checklist, outputPath);
        break;
      case 'yaml':
        await this.saveAsYAML(checklist, outputPath);
        break;
    }
  }
}