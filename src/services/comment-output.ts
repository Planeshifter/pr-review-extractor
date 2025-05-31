import { ExtractedData } from './pr-extractor';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

export class CommentOutput {
  async generateOutput(
    data: ExtractedData,
    outputPath: string,
    repository: string
  ): Promise<void> {
    const output = this.generateMarkdown(data, repository);
    
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, output);
    
    console.log(chalk.green(`\n✅ Output saved to ${outputPath}`));
  }

  private generateMarkdown(data: ExtractedData, repository: string): string {
    const lines: string[] = [];
    
    lines.push(`# PR Review Comments for ${repository}`);
    lines.push(`Generated at: ${new Date().toISOString()}\n`);
    lines.push(`## Summary`);
    lines.push(`- Total PRs analyzed: ${data.stats.totalPRs}`);
    lines.push(`- Total comments: ${data.stats.totalComments}`);
    lines.push(`- Unique reviewers: ${data.stats.uniqueReviewers.size}\n`);
    
    lines.push(`## All Review Comments\n`);
    
    // Group comments by PR
    data.comments.forEach((comments, prNumber) => {
      const pr = data.pullRequests.find(p => p.number === prNumber);
      if (!pr) return;
      
      lines.push(`### PR #${pr.number}: ${pr.title}`);
      lines.push(`- Author: ${pr.user.login}`);
      lines.push(`- Created: ${new Date(pr.created_at).toLocaleDateString()}`);
      lines.push(`- URL: ${pr.html_url}\n`);
      
      comments.forEach((comment, index) => {
        lines.push(`#### Comment ${index + 1}`);
        lines.push(`- **Reviewer:** ${comment.user.login}`);
        lines.push(`- **File:** ${comment.path || 'N/A'}`);
        lines.push(`- **Line:** ${comment.line || 'N/A'}`);
        lines.push(`- **Date:** ${new Date(comment.created_at).toLocaleDateString()}`);
        
        if (comment.code_snippet) {
          lines.push(`\n**Original Code:**`);
          lines.push('```');
          lines.push(comment.code_snippet);
          lines.push('```');
        }
        
        if (comment.suggestion) {
          lines.push(`\n**Suggested Code:**`);
          lines.push('```');
          lines.push(comment.suggestion);
          lines.push('```');
        }
        
        lines.push(`\n**Comment:**`);
        lines.push(`> ${comment.body.split('\n').join('\n> ')}`);
        lines.push('');
      });
      
      lines.push('---\n');
    });
    
    return lines.join('\n');
  }

  async generateJSON(
    data: ExtractedData,
    outputPath: string,
    repository: string
  ): Promise<void> {
    const output = {
      repository,
      generatedAt: new Date().toISOString(),
      stats: {
        totalPRs: data.stats.totalPRs,
        totalComments: data.stats.totalComments,
        uniqueReviewers: data.stats.uniqueReviewers.size
      },
      pullRequests: data.pullRequests.map(pr => ({
        number: pr.number,
        title: pr.title,
        author: pr.user.login,
        url: pr.html_url,
        comments: data.comments.get(pr.number) || []
      }))
    };
    
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    
    console.log(chalk.green(`\n✅ JSON output saved to ${outputPath}`));
  }
}