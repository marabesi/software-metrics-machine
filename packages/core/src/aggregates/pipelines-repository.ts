import { IRepository } from '../infrastructure';
import {
  WorkflowJobJsonResponse,
  WorkflowJsonResponse,
} from '../providers/github/github-response-types';
import { PipelineJob, PipelineRun } from '../domain';

export class PipelinesRepository {
  constructor(
    private pipelineRunFileSystemRepository: IRepository<WorkflowJsonResponse>,
    private pipelineJobsFileSystemRepository: IRepository<WorkflowJobJsonResponse>
  ) {}

  async loadPipelines(): Promise<PipelineRun[]> {
    const runs = await this.pipelineRunFileSystemRepository.loadAll();
    return runs.map(this.mapPipelinesToDomain);
  }

  async loadPipelineJobs(): Promise<PipelineJob[]> {
    const jobs = await this.pipelineJobsFileSystemRepository.loadAll();
    return jobs.map(this.mapPipelineJobsToDomain);
  }

  private mapPipelinesToDomain(run: WorkflowJsonResponse): PipelineRun {
    return {
      ...run,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      number: Number(run.run_number),
      startedAt: run.run_started_at,
      completedAt: run.updated_at,
      branch: run.head_branch,
      path: run.path,
    };
  }

  private mapPipelineJobsToDomain(job: WorkflowJobJsonResponse): PipelineJob {
    return {
      completedAt: job.completed_at,
      conclusion: job.conclusion,
      durationSeconds: this.calculateDurationInSeconds(job.started_at, job.completed_at),
      id: job.id,
      name: job.name,
      runId: job.run_id,
      startedAt: job.started_at,
      status: job.status,
    };
  }

  private calculateDurationInSeconds(startedAt: string, completedAt: string): number {
    if (!startedAt || !completedAt) return 0;
    return (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000;
  }
}
