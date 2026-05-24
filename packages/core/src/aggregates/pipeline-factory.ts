import { PipelinesRepository } from './pipelines-repository';
import { Configuration, FileSystemRepository } from '../infrastructure';
import {
  WorkflowJobJsonResponse,
  WorkflowJsonResponse,
} from '../providers/github/github-response-types';
import { PipelinesFetchRepository } from './pipelines-fetch-repository';
import { GithubWorkflowClient, GithubWorkflowJobClient } from '../providers';
import { PipelinesJobFetchRepository } from './pipelines-job-fetch-repository';

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
      `${config.getPipelinePath()}/workflows.json`
    );
    const pipelineJobsFileSystemRepository = new FileSystemRepository<WorkflowJobJsonResponse>(
      `${config.getPipelinePath()}/jobs.json`
    );

    const pipelineRepository = new PipelinesRepository(
      pipelineRunFileSystemRepository,
      pipelineJobsFileSystemRepository
    );

    const workflowRepository = new PipelinesFetchRepository(
      config,
      githubWorkflowClient,
      pipelineRunFileSystemRepository
    );
    const workflowJobRepository = new PipelinesJobFetchRepository(
      config,
      githubWorkflowJobClient,
      pipelineRunFileSystemRepository,
      pipelineJobsFileSystemRepository
    );

    return {
      pipelineRepository,
      workflowRepository,
      workflowJobRepository,
    };
  }
}
