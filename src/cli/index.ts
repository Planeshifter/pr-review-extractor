#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { PRExtractor } from '../services/pr-extractor';
import { CommentOutput } from '../services/comment-output';
import { ExtractorOptions } from '../types';

dotenv.config();

const program = new Command();

program
  .name('pr-review-extractor')
  .description('Extract PR review comments and generate review checklists')
  .version('1.0.0');

program
  .command('extract')
  .description('Extract PR comments and generate a review checklist')
  .requiredOption('-o, --owner <owner>', 'Repository owner')
  .requiredOption('-r, --repo <repo>', 'Repository name')
  .option('-t, --token <token>', 'GitHub token (or use GITHUB_TOKEN env var)')
  .option('-m, --max-prs <number>', 'Maximum number of PRs to analyze', parseInt)
  .option('-s, --state <state>', 'PR state: open, closed, or all', 'closed')
  .option('--since <date>', 'Only include PRs created after this date (YYYY-MM-DD)')
  .option('-f, --format <format>', 'Output format: json, markdown, or yaml', 'markdown')
  .option('--output <path>', 'Output file path', './output/checklist')
  .action(async (options) => {
    try {
      const token = options.token || process.env.GITHUB_TOKEN;
      if (!token) {
        console.error(chalk.red('❌ GitHub token is required. Use --token or set GITHUB_TOKEN env var'));
        process.exit(1);
      }

      const extractorOptions: ExtractorOptions = {
        owner: options.owner,
        repo: options.repo,
        token,
        maxPRs: options.maxPrs,
        state: options.state,
        since: options.since ? new Date(options.since) : undefined,
        outputFormat: options.format
      };

      console.log(chalk.bold.blue('\n🚀 PR Review Extractor\n'));

      // Extract PR data
      const extractor = new PRExtractor(extractorOptions);
      const extractedData = await extractor.extract(extractorOptions);

      // Generate output
      console.log(chalk.blue('\n📝 Generating output...'));
      const output = new CommentOutput();
      const outputPath = `${options.output}.${options.format === 'yaml' ? 'yml' : options.format}`;
      
      if (options.format === 'json') {
        await output.generateJSON(extractedData, outputPath, `${options.owner}/${options.repo}`);
      } else {
        await output.generateOutput(extractedData, outputPath, `${options.owner}/${options.repo}`);
      }

      console.log(chalk.gray(`\nExtracted ${extractedData.stats.totalComments} comments from ${extractedData.stats.totalPRs} PRs`));

    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error}`));
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Test GitHub connection')
  .requiredOption('-o, --owner <owner>', 'Repository owner')
  .requiredOption('-r, --repo <repo>', 'Repository name')
  .option('-t, --token <token>', 'GitHub token (or use GITHUB_TOKEN env var)')
  .action(async (options) => {
    try {
      const token = options.token || process.env.GITHUB_TOKEN;
      if (!token) {
        console.error(chalk.red('❌ GitHub token is required. Use --token or set GITHUB_TOKEN env var'));
        process.exit(1);
      }

      console.log(chalk.blue(`\n🔍 Testing connection to ${options.owner}/${options.repo}...`));
      
      const extractorOptions: ExtractorOptions = {
        owner: options.owner,
        repo: options.repo,
        token,
        maxPRs: 1
      };

      const extractor = new PRExtractor(extractorOptions);
      await extractor.extract(extractorOptions);
      
      console.log(chalk.green('\n✅ Connection successful!'));
    } catch (error) {
      console.error(chalk.red(`\n❌ Connection failed: ${error}`));
      process.exit(1);
    }
  });

program.parse();