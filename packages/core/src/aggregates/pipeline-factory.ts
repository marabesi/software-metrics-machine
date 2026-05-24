import { PipelinesRepository } from './pipelines-repository';
import { Configuration, FileSystemRepository, IRepository } from '../infrastructure';
import type { IGithubWorkflowClient } from '../providers';
import {
  WorkflowJobJsonResponse,
  WorkflowJsonResponse,
} from '../providers/github/github-response-types';

export default class PipelineFactory {
  static create(configuration: Configuration, githubWorkflowClient: IGithubWorkflowClient) {
    const pipelineRunFileSystemRepository = new FileSystemRepository<WorkflowJsonResponse>(
      `${configuration.getPipelinePath()}/workflows.json`
    );
    const pipelineJobsFileSystemRepository = new FileSystemRepository<WorkflowJobJsonResponse>(
      `${configuration.getPipelinePath()}/jobs.json`
    );

    return new PipelinesRepository(
      configuration,
      githubWorkflowClient,
      pipelineRunFileSystemRepository,
      pipelineJobsFileSystemRepository
    );
  }
}
