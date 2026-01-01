const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiParams {
  start_date?: string;
  end_date?: string;
  [key: string]: string | number | undefined;
}

async function fetchAPI<T>(endpoint: string, params?: ApiParams): Promise<T> {
  const url = new URL(endpoint, API_BASE_URL);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

// Source Code APIs
export const sourceCodeAPI = {
  pairingIndex: (params?: ApiParams) =>
    fetchAPI<{ pairing_index_percentage: number; total_analyzed_commits: number; paired_commits: number }>(
      '/code/pairing-index',
      params
    ),
  
  entityChurn: (params?: ApiParams) =>
    fetchAPI<Array<{ entity: string; added: number; deleted: number; commits: number }>>(
      '/code/entity-churn',
      params
    ),
  
  codeChurn: (params?: ApiParams) =>
    fetchAPI<Array<{ date: string; type: string; value: number }>>(
      '/code/code-churn',
      params
    ),
  
  coupling: (params?: ApiParams) =>
    fetchAPI<Array<{ entity: string; coupled: string; degree: number }>>(
      '/code/coupling',
      params
    ),
  
  entityEffort: (params?: ApiParams) =>
    fetchAPI<Array<{ entity: string; revisions: number }>>(
      '/code/entity-effort',
      params
    ),
  
  entityOwnership: (params?: ApiParams) =>
    fetchAPI<Array<{ entity: string; author: string; added: number; deleted: number }>>(
      '/code/entity-ownership',
      params
    ),
};

// Pipeline APIs
export const pipelineAPI = {
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
};

// Pull Request APIs
export const pullRequestAPI = {
  summary: (params?: ApiParams) =>
    fetchAPI<{
      total: number;
      merged: number;
      closed: number;
      open: number;
      first_pr: any;
      last_pr: any;
    }>('/pull-requests/summary', params),
  
  byAuthor: (params?: ApiParams) =>
    fetchAPI<Array<{ author: string; count: number }>>(
      '/pull-requests/by-author',
      params
    ),
  
  averageReviewTime: (params?: ApiParams) =>
    fetchAPI<Array<{ author: string; avg_hours: number }>>(
      '/pull-requests/average-review-time',
      params
    ),
  
  openThroughTime: (params?: ApiParams) =>
    fetchAPI<Array<{ date: string; open_prs: number }>>(
      '/pull-requests/through-time',
      params
    ),
  
  averageOpenBy: (params?: ApiParams) =>
    fetchAPI<Array<{ period: string; avg_days: number }>>(
      '/pull-requests/average-open-by',
      params
    ),
  
  averageComments: (params?: ApiParams) =>
    fetchAPI<{ avg_comments: number }>('/pull-requests/average-comments', params),
};

export default { sourceCodeAPI, pipelineAPI, pullRequestAPI };
