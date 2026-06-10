import { IRepository } from '../infrastructure';
import { logger } from '@smmachine/utils';
import {
  WorkflowJobJsonResponse,
  WorkflowJobStepJsonResponse,
  WorkflowJsonResponse,
} from '../providers/github/github-response-types';
import { PipelineJob, PipelineRun, PipelineStep } from '../domain';

export type LoadPipelinesOptions = {
  includeJobs?: boolean;
  jobNames?: string[];
  jobConclusion?: string;
};

export interface IPipelinesRepository {
  loadPipelines(options?: LoadPipelinesOptions): Promise<PipelineRun[]>;
}

export class PipelinesRepository implements IPipelinesRepository {
  constructor(
    private pipelineRunFileSystemRepository: IRepository<WorkflowJsonResponse>,
    private pipelineJobsFileSystemRepository: IRepository<WorkflowJobJsonResponse>
  ) {}

  private async loadPipelineRuns(): Promise<PipelineRun[]> {
    const runs = await this.pipelineRunFileSystemRepository.loadAll();
    const pipelineRuns = runs.map(this.mapPipelinesToDomain);

    logger.info(`Loaded ${pipelineRuns.length} pipeline runs from file system repository`);

    return pipelineRuns;
  }

  async loadPipelines(
    options: LoadPipelinesOptions = { includeJobs: true }
  ): Promise<PipelineRun[]> {
    const pipelineRuns = await this.loadPipelineRuns();
    const selectedJobNames = this.normalizeJobNames(options.jobNames);
    const targetJobConclusion = options.jobConclusion?.trim().toLowerCase();
    const needsJobs =
      options.includeJobs !== false || selectedJobNames.length > 0 || Boolean(targetJobConclusion);

    if (!needsJobs) {
      return pipelineRuns;
    }

    const jobs = await this.pipelineJobsFileSystemRepository.loadAll();
    if (jobs.length === 0 || pipelineRuns.length === 0) {
      return pipelineRuns;
    }

    const runsById = new Map<string, PipelineRun>();
    for (const run of pipelineRuns) {
      runsById.set(String(run.id), run);
    }

    for (const job of jobs) {
      const run = runsById.get(String(job.run_id));
      if (!run) {
        continue;
      }

      if (!run.jobs) {
        run.jobs = [];
      }

      run.jobs.push(this.mapPipelineJobsToDomain(job));
    }

    const jobFilteredRuns = this.filterRunsByJobs(
      pipelineRuns,
      selectedJobNames,
      targetJobConclusion
    );

    if (options.includeJobs === false) {
      return jobFilteredRuns.map(this.withoutJobs);
    }

    if (selectedJobNames.length === 0 && !targetJobConclusion) {
      return jobFilteredRuns;
    }

    return jobFilteredRuns.map((run) => ({
      ...run,
      jobs: this.filterJobs(run.jobs || [], selectedJobNames, targetJobConclusion),
    }));
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
      runAttempt: Number(run.run_attempt || 1),
      branch: run.head_branch,
      path: run.path,
    };
  }

  private mapPipelineJobsToDomain = (job: WorkflowJobJsonResponse): PipelineJob => {
    return {
      completedAt: job.completed_at,
      conclusion: job.conclusion,
      durationSeconds: this.calculateDurationInSeconds(job.started_at, job.completed_at),
      id: job.id,
      name: job.name,
      runId: job.run_id,
      startedAt: job.started_at,
      status: job.status,
      steps: job.steps ? job.steps.map(this.mapPipelineJobsStepToDomain) : [],
    };
  };

  private mapPipelineJobsStepToDomain = (step: WorkflowJobStepJsonResponse): PipelineStep => {
    return {
      name: step.name,
      status: step.status,
      conclusion: step.conclusion,
      number: step.number,
      startedAt: step.started_at,
      completedAt: step.completed_at,
    };
  };

  private normalizeJobNames(jobNames?: string[]): string[] {
    return jobNames?.map((name) => name.trim().toLowerCase()).filter(Boolean) || [];
  }

  private filterRunsByJobs(
    runs: PipelineRun[],
    selectedJobNames: string[],
    targetJobConclusion?: string
  ): PipelineRun[] {
    if (selectedJobNames.length === 0 && !targetJobConclusion) {
      return runs;
    }

    return runs.filter(
      (run) => this.filterJobs(run.jobs || [], selectedJobNames, targetJobConclusion).length > 0
    );
  }

  private filterJobs(
    jobs: PipelineJob[],
    selectedJobNames: string[],
    targetJobConclusion?: string
  ): PipelineJob[] {
    return jobs
      .filter(
        (job) =>
          selectedJobNames.length === 0 || selectedJobNames.includes((job.name || '').toLowerCase())
      )
      .filter((job) => {
        if (!targetJobConclusion) {
          return true;
        }

        return (job.conclusion || '').toLowerCase() === targetJobConclusion;
      });
  }

  private withoutJobs(run: PipelineRun): PipelineRun {
    const runWithoutJobs = { ...run };
    delete runWithoutJobs.jobs;
    return runWithoutJobs;
  }

  private calculateDurationInSeconds(startedAt: string, completedAt: string): number {
    if (!startedAt || !completedAt) return 0;
    return (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000;
  }
}
