export type RecommendationSeverity = 'warning' | 'info' | 'success';

export interface Recommendation {
  id: string;
  metric: string;
  title: string;
  message: string;
  severity: RecommendationSeverity;
  currentValue?: string;
  targetValue?: string;
  href?: string;
  hrefLabel?: string;
}

export interface RecommendationsProps {
  pairingIndex?: {
    pairing_index_percentage: number;
    paired_commits: number;
    total_analyzed_commits: number;
  } | null;
  prSummary?: {
    total: number;
    merged: number;
    closed: number;
    open: number;
  } | null;
  deploymentFrequency?: Array<{
    pipeline: string;
    job: string;
    day_count: number;
  }>;
  jobsSummary?: Array<{
    job_name: string;
    success_rate: number;
    avg_duration_minutes: number;
    rerun_count: number;
    total_runs: number;
  }>;
  averageReviewTime?: Array<{
    author: string;
    avg_hours: number;
  }>;
}
