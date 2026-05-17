/**
 * Response DTOs for API endpoints
 * Define the structure of all API responses
 */

export interface PullRequestMetricsResponse {
  totalPRs: number;
  leadTime: {
    average: number;
    unit: string;
  };
  commentSummary?: {
    total: number;
  };
  labelSummary?: {
    [key: string]: number;
  };
  filters?: Record<string, any>;
}

export interface DeploymentMetricsResponse {
  pipelineMetrics: {
    totalRuns: number;
    successRate: number;
  };
  deploymentFrequency: Array<{
    date: string;
    value: number;
  }>;
  jobMetrics: Array<{
    jobName: string;
    avgDuration: number;
    successRate?: number;
  }>;
  filters?: Record<string, any>;
}


export interface IssueMetricsResponse {
  totalIssues: number;
  issues: Array<{
    key: string;
    status: string;
    priority?: string;
    createdAt: string;
  }>;
  filters?: Record<string, any>;
}

export interface QualityMetricsResponse {
  [metric: string]: number | string | Record<string, any> | undefined;
  filters?: Record<string, any>;
}

export class ErrorResponse {
  statusCode!: number;
  message!: string;
  error!: string;
  timestamp!: string;
  path?: string;
}
