export interface ReviewComment {
  id: number;
  body: string;
  path?: string;
  line?: number;
  start_line?: number;
  original_line?: number;
  original_start_line?: number;
  commit_id?: string;
  original_commit_id?: string;
  diff_hunk?: string;
  position?: number;
  original_position?: number;
  side?: 'LEFT' | 'RIGHT';
  start_side?: 'LEFT' | 'RIGHT';
  user: {
    login: string;
    id: number;
  };
  created_at: string;
  updated_at: string;
  pull_request_review_id?: number;
  in_reply_to_id?: number;
  html_url: string;
  code_snippet?: string;
  suggestion?: string;
}

export interface PullRequest {
  number: number;
  title: string;
  state: string;
  user: {
    login: string;
  };
  created_at: string;
  closed_at?: string;
  merged_at?: string;
  html_url: string;
  base: {
    ref: string;
  };
  head: {
    ref: string;
  };
}

export interface Review {
  id: number;
  user: {
    login: string;
  };
  body: string;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  submitted_at?: string;
}

export interface ChecklistItem {
  text: string;
  category: CommentCategory;
  frequency: number;
  examples: string[];
  severity: 'high' | 'medium' | 'low';
}

export interface ChecklistCategory {
  name: string;
  items: ChecklistItem[];
}

export interface Checklist {
  repository: string;
  generatedAt: Date;
  categories: ChecklistCategory[];
  stats: {
    totalPRs: number;
    totalComments: number;
    uniqueReviewers: number;
  };
}

export type CommentCategory = 
  | 'bug'
  | 'performance'
  | 'security'
  | 'style'
  | 'documentation'
  | 'testing'
  | 'refactoring'
  | 'other';

export interface ExtractorOptions {
  owner: string;
  repo: string;
  token: string;
  maxPRs?: number;
  state?: 'open' | 'closed' | 'all';
  since?: Date;
  outputFormat?: 'json' | 'markdown' | 'yaml';
}