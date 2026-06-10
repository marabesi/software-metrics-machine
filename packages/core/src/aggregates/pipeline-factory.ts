import { PipelinesRepository } from './pipelines-repository';
import { Configuration, FileSystemRepository } from '../infrastructure';
import {
  WorkflowJobJsonResponse,
  WorkflowJsonResponse,
} from '../providers/github/github-response-types';
import { PipelinesFetchRepository } from '../providers/github/pipelines-fetch-repository';
import { GithubWorkflowClient, GithubWorkflowJobClient } from '../providers';
import { PipelinesJobFetchRepository } from '../providers/github/pipelines-job-fetch-repository';
import {
  PipelineFiltersRepository,
  PipelineFilterOptions,
} from './pipeline-filters-repository';

export default class PipelineFactory {
  static create(config: Configuration) {
    const [githubOwner, githubRepo] = config.githubRepository!.split('/');
    const githubToken = config.githubToken!;

    const githubWorkflowClient = new GithubWorkflowClient(githubToken, githubOwner, githubRepo);

    const githubWorkflowJobClient = new GithubWorkflowJobClient(
      githubToken,
      githubOwner,
      githubRepo
    );

    const pipelineRunFileSystemRepository = new FileSystemRepository<WorkflowJsonResponse>(
      `${config.getPathFromGitProvider()}/workflows.json`
    );
    const pipelineJobsFileSystemRepository = new FileSystemRepository<WorkflowJobJsonResponse>(
      `${config.getPathFromGitProvider()}/jobs.json`
    );
    const pipelineFiltersFileSystemRepository =
      new FileSystemRepository<PipelineFilterOptions>(
        `${config.getPathFromGitProvider()}/pipeline-filter-options.json`
      );

    const pipelineRepository = new PipelinesRepository(
      pipelineRunFileSystemRepository,
      pipelineJobsFileSystemRepository
    );
    const pipelineFiltersRepository = new PipelineFiltersRepository(
      pipelineRunFileSystemRepository,
      pipelineJobsFileSystemRepository,
      pipelineFiltersFileSystemRepository
    );

    const workflowRepository = new PipelinesFetchRepository(
      config,
      githubWorkflowClient,
      pipelineRunFileSystemRepository,
      pipelineFiltersRepository
    );
    const workflowJobRepository = new PipelinesJobFetchRepository(
      config,
      githubWorkflowJobClient,
      pipelineRunFileSystemRepository,
      pipelineJobsFileSystemRepository,
      pipelineFiltersRepository
    );

    return {
      pipelineRepository,
      pipelineFiltersRepository,
      workflowRepository,
      workflowJobRepository,
    };
  }
}
