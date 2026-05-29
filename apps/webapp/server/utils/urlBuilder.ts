/**
 * URL Builder for external provider links (GitHub, GitLab, SonarQube)
 * Builds URLs based on git provider type and SonarQube configuration
 */

export interface UrlBuilderConfig {
  gitProvider: string;
  gitRepository: string;
  gitRepositoryLocation?: string;
  sonarqubeUrl?: string;
  sonarqubeProject?: string;
}

export interface UrlBuilder {
  // PR/MR links
  getPRsUrl(filters?: { status?: string; author?: string; label?: string }): string;
  getPRUrl(prNumber: number): string;
  
  // Pipeline/Workflow links
  getPipelinesUrl(filters?: { status?: string; workflow?: string }): string;
  getPipelineRunUrl(runId: string, runNumber?: number): string;
  getJobRunsUrl(jobName: string): string;
  
  // SonarQube links
    getSonarqubeComponentUrl(componentKey: string): string;
  getSonarqubeProjectUrl(): string;
}

/**
 * Create URL builder based on git provider
 */
export function createUrlBuilder(config: UrlBuilderConfig): UrlBuilder {
  const provider = (config.gitProvider || 'github').toLowerCase();
  
  if (provider.includes('gitlab')) {
    return createGitLabBuilder(config);
  }
  
  // Default to GitHub
  return createGitHubBuilder(config);
}

/**
 * GitHub URL builder
 */
function createGitHubBuilder(config: UrlBuilderConfig): UrlBuilder {
  const [owner, repo] = config.gitRepository.split('/').filter(Boolean);
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
    
    getJobRunsUrl(jobName) {
      // GitHub doesn't have a direct job filter, but we can search
      return `${baseUrl}/actions?query=${encodeURIComponent(jobName)}`;
    },
    
    getSonarqubeComponentUrl(componentKey) {
      if (!config.sonarqubeUrl) {
        return '#';
      }
      return `${config.sonarqubeUrl}/code?id=${encodeURIComponent(config.sonarqubeProject || '')}&selected=${encodeURIComponent(componentKey)}`;
    },
    
    getSonarqubeProjectUrl() {
      if (!config.sonarqubeUrl) {
        return '#';
      }
      return config.sonarqubeProject
        ? `${config.sonarqubeUrl}/dashboard?id=${encodeURIComponent(config.sonarqubeProject)}`
        : `${config.sonarqubeUrl}/dashboard`;
    },
  };
}

/**
 * GitLab URL builder
 */
function createGitLabBuilder(config: UrlBuilderConfig): UrlBuilder {
  const [owner, repo] = config.gitRepository.split('/').filter(Boolean);
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
    
    getJobRunsUrl(jobName) {
      // GitLab pipeline jobs can be filtered by name
      return `${baseUrl}/-/pipelines?scope=all`;
    },
    
    getSonarqubeComponentUrl(componentKey) {
      if (!config.sonarqubeUrl) {
        return '#';
      }
      return `${config.sonarqubeUrl}/code?id=${encodeURIComponent(config.sonarqubeProject || '')}&selected=${encodeURIComponent(componentKey)}`;
    },
    
    getSonarqubeProjectUrl() {
      if (!config.sonarqubeUrl) {
        return '#';
      }
      return config.sonarqubeProject
        ? `${config.sonarqubeUrl}/dashboard?id=${encodeURIComponent(config.sonarqubeProject)}`
        : `${config.sonarqubeUrl}/dashboard`;
    },
  };
}
