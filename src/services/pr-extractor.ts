import { GitHubClient } from './github-client';
import { CommentAnalyzer } from './comment-analyzer';
import { DiffParser } from './diff-parser';
import { PullRequest, ReviewComment, ExtractorOptions } from '../types';
import chalk from 'chalk';

export interface ExtractedData {
  pullRequests: PullRequest[];
  comments: Map<number, ReviewComment[]>;
  stats: {
    totalPRs: number;
    totalComments: number;
    uniqueReviewers: Set<string>;
  };
}

export class PRExtractor {
  private client: GitHubClient;
  private analyzer: CommentAnalyzer;
  private diffParser: DiffParser;

  constructor(options: ExtractorOptions) {
    this.client = new GitHubClient(options.token, options.owner, options.repo);
    this.analyzer = new CommentAnalyzer();
    this.diffParser = new DiffParser();
  }

  async extract(options: ExtractorOptions): Promise<ExtractedData> {
    console.log(chalk.blue(`📋 Fetching PRs from ${options.owner}/${options.repo}...`));
    
    const pullRequests = await this.client.getAllPullRequests(options.maxPRs, options.state);
    
    let filteredPRs = pullRequests;
    if (options.since) {
      filteredPRs = pullRequests.filter(pr => 
        new Date(pr.created_at) >= options.since!
      );
    }

    console.log(chalk.green(`✓ Found ${filteredPRs.length} PRs`));

    const comments = new Map<number, ReviewComment[]>();
    const uniqueReviewers = new Set<string>();
    let totalComments = 0;

    for (let i = 0; i < filteredPRs.length; i++) {
      const pr = filteredPRs[i];
      process.stdout.write(chalk.gray(`\rProcessing PR #${pr.number} (${i + 1}/${filteredPRs.length})...`));

      try {
        // Get review comments (only comments on specific lines of code)
        const reviewComments = await this.client.getReviewComments(pr.number);
        
        // Filter constructive comments
        const constructiveComments = reviewComments.filter(comment => 
          this.analyzer.isConstructive(comment)
        );

        // Process each comment to extract code and suggestions
        for (const comment of constructiveComments) {
          // Extract code from diff_hunk if available
          if (comment.diff_hunk) {
            comment.code_snippet = this.diffParser.extractOriginalCode(comment.diff_hunk);
          }
          
          // Extract suggestion from comment body
          const suggestion = this.diffParser.extractSuggestion(comment.body);
          if (suggestion) {
            comment.suggestion = suggestion;
          }
        }

        if (constructiveComments.length > 0) {
          comments.set(pr.number, constructiveComments);
          totalComments += constructiveComments.length;
          
          // Track unique reviewers
          constructiveComments.forEach(comment => {
            uniqueReviewers.add(comment.user.login);
          });
        }
      } catch (error) {
        console.error(chalk.red(`\n❌ Error processing PR #${pr.number}: ${error}`));
      }
    }

    console.log(chalk.green(`\n✓ Extracted ${totalComments} comments from ${comments.size} PRs`));
    console.log(chalk.blue(`👥 ${uniqueReviewers.size} unique reviewers`));

    return {
      pullRequests: filteredPRs,
      comments,
      stats: {
        totalPRs: filteredPRs.length,
        totalComments,
        uniqueReviewers
      }
    };
  }
}