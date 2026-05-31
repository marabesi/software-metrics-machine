export type ResultWrapper<T> = {
  result: T;
};
export interface PairingIndex {
  pairing_index_percentage: number;
  paired_commits: number;
  total_analyzed_commits: number;
}
export interface PipelineSummary {
  total_runs: number;
  in_progress: number;
  queued: number;
  first_run?: { createdAt?: string; created_at?: string } | string | null;
  last_run?: { createdAt?: string; created_at?: string } | string | null;
}
export interface PullRequestSummary {
  total_prs?: number;
  total?: number;
  merged_prs?: number;
  merged?: number;
  closed_prs?: number;
  closed?: number;
  open_prs?: number;
  open?: number;
  first_pr?: { createdAt?: string; created_at?: string } | string | null;
  last_pr?: { createdAt?: string; created_at?: string } | string | null;
}
export interface DeploymentFrequencyResponseItem {
  days?: string;
  daily_counts?: number;
  weekly_counts?: number;
  monthly_counts?: number;
}
export interface DeploymentFrequencyPoint {
  date: string;
  month: string;
  day_count: number;
  week_count: number;
  month_count: number;
}
