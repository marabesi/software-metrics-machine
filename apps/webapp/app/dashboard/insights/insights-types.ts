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
