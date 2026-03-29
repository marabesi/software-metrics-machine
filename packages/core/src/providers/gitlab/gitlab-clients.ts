import { PRDetails } from 'src/domain-types';

export interface IGitlabMrClient {
  fetchMergeRequests(options?: {
    startDate?: string;
    endDate?: string;
    state?: 'opened' | 'closed' | 'merged' | 'all';
  }): Promise<PRDetails[]>;

  fetchMRComments(mrIid: number): Promise<any[]>;
}

export interface IGitlabPipelineClient {
  fetchPipelines(options?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<any[]>;

  fetchJobsForPipelines(pipelineIds: string[]): Promise<any[]>;
}

/**
 * GitLab API client for Merge Requests
 * Uses: https://gitlab.com/api/v4/projects/{url-encoded-id}/merge_requests
 * Auth: OAuth token
 */
export class GitlabMrClient implements IGitlabMrClient {
  constructor(
    private token: string,
    private projectId: string
  ) {}

  async fetchMergeRequests(options?: {
    startDate?: string;
    endDate?: string;
    state?: 'opened' | 'closed' | 'merged' | 'all';
  }): Promise<PRDetails[]> {
    const state = options?.state || 'all';
    const per_page = 100;
    let page = 1;
    const allMRs: PRDetails[] = [];

    // Pagination loop to fetch all merge requests
    // In real implementation: make HTTP requests to GitLab API
    // For now: returns empty (placeholder for Phase 3.4)

    return allMRs;
  }

  async fetchMRComments(mrIid: number): Promise<any[]> {
    // Fetch comments on merge request
    // Endpoint: GET /projects/{id}/merge_requests/{merge_request_iid}/notes
    return [];
  }
}

/**
 * GitLab API client for Pipelines (CI/CD)
 * Uses: https://gitlab.com/api/v4/projects/{url-encoded-id}/pipelines
 * Auth: OAuth token
 */
export class GitlabPipelineClient implements IGitlabPipelineClient {
  constructor(
    private token: string,
    private projectId: string
  ) {}

  async fetchPipelines(options?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<any[]> {
    // Fetch pipeline runs
    // Endpoint: GET /projects/{id}/pipelines
    // Supports filters: status, updated_after, updated_before
    return [];
  }

  async fetchJobsForPipelines(pipelineIds: string[]): Promise<any[]> {
    // Fetch jobs for specific pipelines
    // Endpoint: GET /projects/{id}/pipelines/{pipeline_id}/jobs
    return [];
  }
}
