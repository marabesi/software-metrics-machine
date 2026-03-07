import { ApiParams, fetchAPI } from './client';

export const pipelineAPI = {
  // Data endpoints
  byStatus: (params?: ApiParams) =>
    fetchAPI<Array<{ status: string; count: number }>>(
      '/pipelines/by-status',
      params
    ),
  
  jobsByStatus: (params?: ApiParams) =>
    fetchAPI<Array<{ job_name: string; status: string; count: number }>>(
      '/pipelines/jobs-by-status',
      params
    ),
  
  summary: (params?: ApiParams) =>
    fetchAPI<{
      total_runs: number;
      first_run: any;
      last_run: any;
      in_progress: number;
      queued: number;
    }>('/pipelines/summary', params),
  
  runsDuration: (params?: ApiParams) =>
    fetchAPI<Array<{ workflow: string; avg_duration: number; total_runs: number }>>(
      '/pipelines/runs-duration',
      params
    ),
  
  deploymentFrequency: (params?: ApiParams) =>
    fetchAPI<Array<{ date: string; count: number; commit: string }>>(
      '/pipelines/deployment-frequency',
      params
    ),
  
  runsBy: (params?: ApiParams) =>
    fetchAPI<Array<{ period: string; workflow: string; runs: number }>>(
      '/pipelines/runs-by',
      params
    ),
  
  jobsAverageTime: (params?: ApiParams) =>
    fetchAPI<Array<{ job_name: string; avg_time: number; count: number }>>(
      '/pipelines/jobs-average-time',
      params
    ),

  // Filter option endpoints
  getWorkflows: () =>
    fetchAPI<Array<{ name: string; path: string }>>('/pipelines/workflows'),

  getStatuses: () =>
    fetchAPI<string[]>('/pipelines/statuses'),

  getConclusions: () =>
    fetchAPI<string[]>('/pipelines/conclusions'),

  getBranches: () =>
    fetchAPI<string[]>('/pipelines/branches'),

  getEvents: () =>
    fetchAPI<string[]>('/pipelines/events'),

  getJobs: () =>
    fetchAPI<Array<{ name: string; id?: string }>>('/pipelines/jobs'),
};
