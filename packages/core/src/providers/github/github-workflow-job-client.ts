import axios, { AxiosInstance } from 'axios';
import { Logger } from '@smmachine/utils';
import { GitHubWorkflowJobResponse, IGithubWorkflowJobClient } from './github-workflow';

export class GithubWorkflowJobClient implements IGithubWorkflowJobClient {
  private axiosInstance: AxiosInstance;
  private logger: Logger;
  private readonly baseUrl = 'https://api.github.com';

  constructor(
    token: string,
    private owner: string,
    private repo: string
  ) {
    this.logger = new Logger('GithubWorkflowClient');

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      timeout: 30000,
    });
  }

  async fetchJobsPage(
    runId: string,
    page: number,
    perPage: number = 100
  ): Promise<GitHubWorkflowJobResponse> {
    const url = `/repos/${this.owner}/${this.repo}/actions/runs/${runId}/jobs`;
    const requestParams = {
      params: {
        per_page: perPage,
        page,
      },
    };

    this.logger.info(`${url} ${JSON.stringify(requestParams.params)}`);

    const response = await this.axiosInstance.get(url, requestParams);

    const jobs = response.data.jobs || [];
    const hasNext = this.hasNextLink(response.headers?.link) || jobs.length === perPage;
    return { jobs, hasNext };
  }

  private hasNextLink(linkHeader?: string): boolean {
    if (!linkHeader) {
      return false;
    }
    return linkHeader.includes('rel="next"');
  }
}
