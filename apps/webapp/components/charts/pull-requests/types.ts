export interface ByAuthorData {
  author: string;
  count: number;
}

export interface AvgReviewTimeData {
  author: string;
  avg_days?: number;
  avg_hours?: number;
}

export interface OpenThroughTimeData {
  date: string;
  opened: number;
  closed: number;
}

export interface AvgOpenByData {
  period: string;
  avg_days: number;
}

export interface AvgCommentsData {
  avg_comments: number;
}

export interface SummaryData {
  total_prs?: number;
  merged_prs?: number;
  closed_prs?: number;
  open_prs?: number;
  avg_comments_per_pr?: number;
  unique_authors?: number;
  unique_labels?: number;
  top_themes?: string[];
  labels?: Array<{ label: string; prs: number }>;
  most_commented_prs?: MostCommentedPRData[];
}

export interface MostCommentedPRData {
  pull_request_id: number;
  pull_request_title: string;
  pull_request_url: string;
  comments_count: number;
}

export interface OpenThroughTimeResponseItem {
  date: string;
  kind?: 'Opened' | 'Closed';
  count?: number;
  open_prs?: number;
}
