/**
 * PR-related domain types for analytics
 */

export interface PRLabel {
  name: string;
  description?: string;
}

export interface PRUser {
  login: string;
  id: number;
}

type PRStatus = 'open' | 'closed' | 'merged' | 'draft';

export interface PRDetails {
  id: number;
  number: number;
  title: string;
  description?: string;
  createdAt: string; // ISO format
  updatedAt: string;
  mergedAt?: string; // null if not merged
  closedAt?: string;
  author: PRUser;
  labels: PRLabel[];
  state: PRStatus;
  url: string;
  totalComments: number;
  comments: PRComment[];
}

export interface PRComment {
  url: string;
  body: string;
  pull_request_review_id: number;
  id: number;
  createdAt: string;
  author: PRUser;
  reactions: {
    url: string;
    total_count: number;
    '+1': number;
    '-1': number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
}

export interface PRFilters {
  startDate?: string;
  endDate?: string;
  authors?: string[];
  labels?: string[];
  state?: PRStatus;
}

export interface PRMetrics {
  averageOpenDays: number;
  totalPRs: number;
  mergedPRs: number;
  closedPRs: number;
  openPRs: number;
  averageComments: number;
  most_commented_prs: MostCommentedPRData[];
  leadTime: number;
  commentSummary: CommentAuthor[];
  labelSummary: LabelSummary[];
}

export interface CommentAuthor {
  author: string;
  count: number;
}

export interface FirstCommentMetric {
  author: string;
  avg_hours: number;
  prs_with_comments: number;
}

export interface MostCommentedPRData {
  pull_request_id: number;
  pull_request_title: string;
  pull_request_url: string;
  comments_count: number;
}

export interface PRsByTimeframe {
  period: string;
  count: number;
  averageOpenDays: number;
  averageComments: number;
}

export interface LabelSummary {
  label: string;
  count: number;
  averageOpenDays: number;
}
