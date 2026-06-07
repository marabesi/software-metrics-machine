/**
 * URL Builder for external provider links (GitHub, GitLab, SonarQube)
 * Builds URLs based on git provider type and SonarQube configuration
 */

import { DashboardGlobalConfiguration } from "../api/configuration";

export interface UrlBuilder {
  // PR/MR links
  getPRsUrl(filters?: { status?: string; author?: string; label?: string }): string;
  getPRUrl(prNumber: number): string;
  
  // Commit links
  getCommitUrl(hash: string): string;
  
  // Pipeline/Workflow links
  getPipelinesUrl(filters?: { status?: string; workflow?: string }): string;
  getPipelineRunUrl(runId: string, runNumber?: number): string;
  getJobRunsUrl(jobName: string, workflowName?: string): string;
  
  // SonarQube links
  getSonarqubeComponentUrl(componentKey: string): string;
  getSonarqubeComponentMeasuresUrl(componentKey: string, metric: string): string;
  getSonarqubeProjectUrl(): string;

  getActionPerformanceForJobUrl(jobName: string, workflowName: string, granularity: 'day' | 'week' | 'month', date: string): string
}


const computeRange = (dateStr: string, granularity: 'day' | 'week' | 'month'): { start: number; end: number } => {
  const parts = dateStr.split('-').map((p) => Number(p));
  const [year, month, day] = parts;
  const startUtc = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

  if (granularity === 'day') {
    const endUtc = startUtc + 24 * 60 * 60 * 1000 - 1;
    return { start: startUtc, end: endUtc };
  }
  if (granularity === 'week') {
    const d = new Date(Date.UTC(year, month - 1, day));
    const utcDay = d.getUTCDay();
    const diffToMonday = (utcDay + 6) % 7;
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - diffToMonday);
    const mondayStart = Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate());
    const sundayEnd = mondayStart + 7 * 24 * 60 * 60 * 1000 - 1;
    return { start: mondayStart, end: sundayEnd };
  }
  const monthStart = Date.UTC(year, month - 1, 1);
  const nextMonthStart = Date.UTC(year, month, 1);
  const monthEnd = nextMonthStart - 1;
  return { start: monthStart, end: monthEnd };
};

/**
 * Create URL builder based on git provider
 */
export function createUrlBuilder(config: DashboardGlobalConfiguration): UrlBuilder {
  const provider = (config.git_provider || 'github').toLowerCase();
  
  if (provider.includes('gitlab')) {
    return createGitLabBuilder(config);
  }
  
  // Default to GitHub
  return createGitHubBuilder(config);
}

/**
 * GitHub URL builder
 */
function createGitHubBuilder(config: DashboardGlobalConfiguration): UrlBuilder {
  const [owner, repo] = config.github_repository.split('/').filter(Boolean);
  const baseUrl = `https://github.com/${owner}/${repo}`;

  return {
    getPRsUrl(filters) {
      const params: string[] = [];

      if (filters?.status) {
        params.push(`is:${filters.status}`);
      }
      if (filters?.author) {
        params.push(`author:@${filters.author}`);
      }
      if (filters?.label) {
        params.push(`label:"${filters.label}"`);
      }

      const query = params.join('+');
      return query ? `${baseUrl}/pulls?q=${query}` : `${baseUrl}/pulls`;
    },

    getPRUrl(prNumber) {
      return `${baseUrl}/pull/${prNumber}`;
    },

    getCommitUrl(hash) {
      return `${baseUrl}/commit/${hash}`;
    },

    getPipelinesUrl(filters) {
      // If filtering by workflow, link to the specific workflow file
      if (filters?.workflow) {
        const workflowFile = filters.workflow.endsWith('.yml') ? filters.workflow : `${filters.workflow}.yml`;
        return `${baseUrl}/actions/workflows/${workflowFile}`;
      }

      // Otherwise, link to actions with status filter if provided
      if (filters?.status) {
        return `${baseUrl}/actions?query=is%3A${encodeURIComponent(filters.status)}`;
      }

      return `${baseUrl}/actions`;
    },

    getPipelineRunUrl(runId) {
      return `${baseUrl}/actions/runs/${runId}`;
    },

    getJobRunsUrl(jobName, workflowName) {
      const encodedJobName = jobName.includes(' ') ? encodeURIComponent(`"${jobName}"`) : encodeURIComponent(jobName);
      if (!workflowName) {
        return `${baseUrl}/actions/metrics/performance?tab=jobs&filters=job_name%3A${encodedJobName}`;
      }
      return `${baseUrl}/actions/metrics/performance/?tab=jobs&filters=workflow_file_name=${encodeURIComponent(workflowName)}&job_name%3A${encodedJobName}`;
    },

    getSonarqubeComponentUrl(componentKey) {
      if (!config.sonar_url || !config.sonar_project) {
        return '#';
      }
      return `${config.sonar_url}/code?id=${encodeURIComponent(config.sonar_project)}&selected=${encodeURIComponent(componentKey)}`;
    },

    getSonarqubeComponentMeasuresUrl(componentKey, metric) {
      if (!config.sonar_url || !config.sonar_project) {
        return '#';
      }
      return `${config.sonar_url}/component_measures?id=${encodeURIComponent(config.sonar_project)}&metric=${encodeURIComponent(metric)}&selected=${encodeURIComponent(componentKey)}`;
    },

    getSonarqubeProjectUrl() {
      if (!config.sonar_url || !config.sonar_project) {
        return '#';
      }
      return config.sonar_project
        ? `${config.sonar_url}/dashboard?id=${encodeURIComponent(config.sonar_project)}`
        : `${config.sonar_url}/dashboard`;
    },

    getActionPerformanceForJobUrl(jobName: string, workflowName: string, granularity: 'day' | 'week' | 'month', date: string): string {
      const range = computeRange(date, granularity);

      const filterParam = encodeURIComponent(`workflow_file_name:${workflowName}`) + `+${encodeURIComponent('job_name:"' + jobName + '"')}`;
      const url = `https://github.com/${config.github_repository.replace(/\/$/, '')}/actions/metrics/usage?dateRangeType=DATE_RANGE_TYPE_CUSTOM&tab=jobs&filters=${filterParam}&range=${range.start}-${range.end}`;
      return url;
    }
  }
};

/**
 * GitLab URL builder
 */
function createGitLabBuilder(config: DashboardGlobalConfiguration): UrlBuilder {
  const [owner, repo] = config.github_repository.split('/').filter(Boolean);
  const baseUrl = `https://gitlab.com/${owner}/${repo}`;
  
  return {
    getPRsUrl(filters) {
      const params: string[] = [];
      
      if (filters?.status === 'open') {
        params.push('state=opened');
      } else if (filters?.status === 'closed') {
        params.push('state=closed');
      } else if (filters?.status === 'merged') {
        params.push('state=merged');
      }
      
      if (filters?.author) {
        params.push(`author_username=${filters.author}`);
      }
      
      if (filters?.label) {
        params.push(`label_name[]=${encodeURIComponent(filters.label)}`);
      }
      
      const query = params.join('&');
      return query ? `${baseUrl}/-/merge_requests?${query}` : `${baseUrl}/-/merge_requests`;
    },
    
    getPRUrl(prNumber) {
      return `${baseUrl}/-/merge_requests/${prNumber}`;
    },
    
    getCommitUrl(hash) {
      return `${baseUrl}/-/commit/${hash}`;
    },
    
    getPipelinesUrl(filters) {
      const params: string[] = [];
      
      if (filters?.status) {
        params.push(`status=${filters.status}`);
      }
      if (filters?.workflow) {
        params.push(`ref=${encodeURIComponent(filters.workflow)}`);
      }
      
      const query = params.join('&');
      return query ? `${baseUrl}/-/pipelines?${query}` : `${baseUrl}/-/pipelines`;
    },
    
    getPipelineRunUrl(runId) {
      return `${baseUrl}/-/pipelines/${runId}`;
    },
    
    getJobRunsUrl(jobName, workflowName) {
      // GitLab pipeline jobs can be filtered by name - best effort without direct filter
      return `${baseUrl}/-/pipelines?scope=all`;
    },
    
    getSonarqubeComponentUrl(componentKey) {
      if (!config.sonar_url || !config.sonar_project) {
        return '#';
      }
      return `${config.sonar_url}/code?id=${encodeURIComponent(config.sonar_project)}&selected=${encodeURIComponent(componentKey)}`;
    },

    getSonarqubeComponentMeasuresUrl(componentKey, metric) {
      if (!config.sonar_url || !config.sonar_project) {
        return '#';
      }
      return `${config.sonar_url}/component_measures?id=${encodeURIComponent(config.sonar_project)}&metric=${encodeURIComponent(metric)}&selected=${encodeURIComponent(componentKey)}`;
    },
    
    getSonarqubeProjectUrl() {
      if (!config.sonar_url || !config.sonar_project) {
        return '#';
      }
      return config.sonar_url
        ? `${config.sonar_url}/dashboard?id=${encodeURIComponent(config.sonar_project)}`
        : `${config.sonar_url}/dashboard`;
    },

    getActionPerformanceForJobUrl(jobName: string, workflowName: string, granularity: 'day' | 'week' | 'month', date: string): string {
      return '#need+custom+implementation+for+GitLab';
    }

  };
};