export interface JobByStatusResponseItem {
  Status?: string;
  Count?: number;
}

export interface JobByStatusData {
  status: string;
  count: number;
}

export interface RunsDurationResponseItem {
  workflow?: string;
  aggregation?: 'avg' | 'min' | 'max';
  duration?: number;
  avg_duration?: number;
  min_duration?: number;
  max_duration?: number;
  total_runs?: number;
  name?: string;
  value?: number;
}

export interface RunsDurationData {
  workflow: string;
  avg_duration: number;
  min_duration: number;
  max_duration: number;
  total_runs: number;
  name?: string;
  value?: number;
}

export interface JobsDurationByWorkflowItem {
  workflow: string;
  jobs: Record<string, number>;
}

export interface JobsAverageTimeResponseItem {
  job_name?: string;
  avg_time?: number;
}

export interface JobsAverageTimeData {
  job_name: string;
  avg_time: number;
}

export interface RunsByResponseItem {
  period?: string;
  workflow?: string;
  runs?: number;
}

export interface RunsByDayData {
  day: string;
  runs: number;
}
