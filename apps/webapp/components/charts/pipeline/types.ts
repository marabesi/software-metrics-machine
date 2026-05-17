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
  avg_duration?: number;
  name?: string;
  value?: number;
}

export interface RunsDurationData {
  workflow: string;
  avg_duration: number;
  name?: string;
  value?: number;
}

export interface JobsAverageTimeResponseItem {
  job_name?: string;
  avg_time?: number;
}

export interface JobsAverageTimeData {
  job_name: string;
  avg_time: number;
}
