import { Octokit } from '@octokit/rest';
import { PullRequest, Review, ReviewComment } from '../types';

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  async getPullRequests(options: {
    state?: 'open' | 'closed' | 'all';
    per_page?: number;
    page?: number;
  } = {}): Promise<PullRequest[]> {
    const { data } = await this.octokit.pulls.list({
      owner: this.owner,
      repo: this.repo,
      state: options.state || 'closed',
      per_page: options.per_page || 100,
      page: options.page || 1,
      sort: 'created',
      direction: 'desc'
    });

    return data as PullRequest[];
  }

  async getAllPullRequests(maxPRs?: number, state?: 'open' | 'closed' | 'all'): Promise<PullRequest[]> {
    const allPRs: PullRequest[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const prs = await this.getPullRequests({ state, per_page: perPage, page });
      allPRs.push(...prs);

      if (prs.length < perPage || (maxPRs && allPRs.length >= maxPRs)) {
        break;
      }
      page++;
    }

    return maxPRs ? allPRs.slice(0, maxPRs) : allPRs;
  }

  async getReviews(prNumber: number): Promise<Review[]> {
    const { data } = await this.octokit.pulls.listReviews({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber
    });

    return data as Review[];
  }

  async getReviewComments(prNumber: number): Promise<ReviewComment[]> {
    const allComments: ReviewComment[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const { data } = await this.octokit.pulls.listReviewComments({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
        per_page: perPage,
        page
      });

      allComments.push(...(data as ReviewComment[]));

      if (data.length < perPage) {
        break;
      }
      page++;
    }

    return allComments;
  }

  async getIssueComments(prNumber: number): Promise<ReviewComment[]> {
    const { data } = await this.octokit.issues.listComments({
      owner: this.owner,
      repo: this.repo,
      issue_number: prNumber
    });

    return data.map(comment => ({
      ...comment,
      pull_request_review_id: undefined
    })) as ReviewComment[];
  }
}