import { IRepository } from '../infrastructure';
import { Logger } from '@smmachine/utils';
import {
  WorkflowJobJsonResponse,
  WorkflowJobStepJsonResponse,
  WorkflowJsonResponse,
} from '../providers/github/github-response-types';
import { PipelineJob, PipelineRun, PipelineStep } from '../domain';
import { TimeZoneProvider } from '../infrastructure/timezone-provider';
import { CommonRepository, RawFilter } from './common-repository';

export type LoadPipelinesOptions = {
  includeJobs?: boolean;
  startDate?: string;
  endDate?: string;
  workflowPath?: string;
  status?: string;
  conclusion?: string;
  targetBranch?: string;
  event?: string;
  jobName?: string;
  jobNames?: string[];
  excludeJobName?: string | string[];
  jobConclusion?: string;
  rawFilters?: string;
  sort_by?: {
    created_at?: 'asc' | 'desc';
  };
};

export interface IPipelinesRepository {
  loadPipelines(options?: LoadPipelinesOptions): Promise<PipelineRun[]>;
}

export class PipelinesRepository extends CommonRepository implements IPipelinesRepository {
  private tz: TimeZoneProvider;

  constructor(
    private pipelineRunFileSystemRepository: IRepository<WorkflowJsonResponse>,
    private pipelineJobsFileSystemRepository: IRepository<WorkflowJobJsonResponse>,
    private logger: Logger,
    timeZoneProvider: TimeZoneProvider
  ) {
    super();
    this.tz = timeZoneProvider;
  }

  private async loadPipelineRuns(): Promise<PipelineRun[]> {
    const runs = await this.pipelineRunFileSystemRepository.loadAll();
    const pipelineRuns = runs.map(this.mapPipelinesToDomain);

    this.logger.info(`Loaded ${pipelineRuns.length} pipeline runs from file system repository`);

    return pipelineRuns;
  }

  async loadPipelines(
    options: LoadPipelinesOptions = { includeJobs: true }
  ): Promise<PipelineRun[]> {
    const pipelineRuns = this.filterRuns(await this.loadPipelineRuns(), options);
    const selectedJobNames = this.normalizeJobNames(options.jobNames, options.jobName);
    const excludedJobNames = this.normalizeJobNames(undefined, options.excludeJobName);
    const targetJobConclusion = options.jobConclusion?.trim().toLowerCase();
    const rawFilters = this.parseRawFilters(options.rawFilters);
    const needsJobs =
      options.includeJobs !== false ||
      selectedJobNames.length > 0 ||
      Boolean(targetJobConclusion) ||
      rawFilters.length > 0;

    if (!needsJobs) {
      return this.applyRawFilters(pipelineRuns, rawFilters);
    }

    const jobs = await this.pipelineJobsFileSystemRepository.loadAll();
    if (jobs.length === 0 || pipelineRuns.length === 0) {
      if (selectedJobNames.length > 0 || targetJobConclusion) {
        return [];
      }
      const filteredRuns = this.applyRawFilters(pipelineRuns, rawFilters);
      return options.includeJobs === false ? filteredRuns.map(this.withoutJobs) : filteredRuns;
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
      excludedJobNames,
      targetJobConclusion
    );

    const namedFilteredRuns =
      selectedJobNames.length === 0 && excludedJobNames.length === 0 && !targetJobConclusion
        ? jobFilteredRuns
        : jobFilteredRuns.map((run) => ({
            ...run,
            jobs: this.filterJobs(
              run.jobs || [],
              selectedJobNames,
              excludedJobNames,
              targetJobConclusion
            ),
          }));

    const rawFilteredRuns = this.applyRawFilters(namedFilteredRuns, rawFilters);
    return options.includeJobs === false ? rawFilteredRuns.map(this.withoutJobs) : rawFilteredRuns;
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

  private normalizeJobNames(jobNames?: string[], jobName?: string | string[]): string[] {
    const rawJobNames = Array.isArray(jobName)
      ? jobName.flatMap((name) => this.parseCsvList(name))
      : this.parseCsvList(jobName);

    return [...(jobNames || []), ...rawJobNames]
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean);
  }

  private parseCsvList(value?: string): string[] {
    if (!value) {
      return [];
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private filterRuns(runs: PipelineRun[], options: LoadPipelinesOptions): PipelineRun[] {
    const selectedStatuses = this.parseCsvList(options.status).map((item) => item.toLowerCase());
    const selectedConclusions = this.parseCsvList(options.conclusion).map((item) =>
      item.toLowerCase()
    );
    const selectedBranches = this.parseCsvList(options.targetBranch);
    const selectedEvents = this.parseCsvList(options.event);
    const start = options.startDate ? this.toTimestamp(options.startDate) : 0;
    const end = options.endDate ? this.toDateBoundaryTimestamp(options.endDate, 'end') : 0;

    const filteredRuns = runs.filter((run) => {
      if (start || end) {
        const runTimestamp = this.toTimestamp(this.getRunMetricDate(run));
        if (start && runTimestamp < start) return false;
        if (end && runTimestamp > end) return false;
      }
      if (options.workflowPath && run.path !== options.workflowPath) {
        return false;
      }
      if (
        selectedStatuses.length > 0 &&
        !selectedStatuses.includes((run.status || '').toLowerCase())
      ) {
        return false;
      }
      if (
        selectedConclusions.length > 0 &&
        !selectedConclusions.includes((run.conclusion || '').toLowerCase())
      ) {
        return false;
      }
      if (selectedBranches.length > 0 && !selectedBranches.includes(run.branch || '')) {
        return false;
      }
      if (selectedEvents.length > 0 && !selectedEvents.includes(run.event || '')) {
        return false;
      }

      return true;
    });

    if (options.sort_by?.created_at) {
      return this.sortRunsByMetricDate(filteredRuns, options.sort_by.created_at);
    }

    return filteredRuns;
  }

  private filterRunsByJobs(
    runs: PipelineRun[],
    selectedJobNames: string[],
    excludedJobNames: string[],
    targetJobConclusion?: string
  ): PipelineRun[] {
    if (selectedJobNames.length === 0 && excludedJobNames.length === 0 && !targetJobConclusion) {
      return runs;
    }

    return runs.filter(
      (run) =>
        this.filterJobs(run.jobs || [], selectedJobNames, excludedJobNames, targetJobConclusion)
          .length > 0
    );
  }

  private filterJobs(
    jobs: PipelineJob[],
    selectedJobNames: string[],
    excludedJobNames: string[],
    targetJobConclusion?: string
  ): PipelineJob[] {
    return jobs
      .filter(
        (job) =>
          selectedJobNames.length === 0 || selectedJobNames.includes((job.name || '').toLowerCase())
      )
      .filter((job) => !excludedJobNames.includes((job.name || '').toLowerCase()))
      .filter((job) => {
        if (!targetJobConclusion) {
          return true;
        }

        return (job.conclusion || '').toLowerCase() === targetJobConclusion;
      });
  }

  private applyRawFilters(runs: PipelineRun[], rawFilters: RawFilter[]): PipelineRun[] {
    if (rawFilters.length === 0) {
      return runs;
    }

    return runs.flatMap((run) => {
      const runWithoutJobs = { ...run };
      delete runWithoutJobs.jobs;

      const jobs = run.jobs || [];
      const matchesAtAnyLayer = rawFilters.every(
        (filter) =>
          this.matchesRawFilters(runWithoutJobs, [filter]) ||
          jobs.some((job) => this.matchesRawFilters(job, [filter]))
      );
      const jobRelevantFilters = rawFilters.filter((filter) =>
        jobs.some((job) => this.collectRawFilterValues(job, filter.key).length > 0)
      );
      const filteredJobs =
        jobRelevantFilters.length > 0
          ? jobs.filter((job) => this.matchesRawFilters(job, jobRelevantFilters))
          : jobs;

      if (!matchesAtAnyLayer) {
        return [];
      }

      if (!run.jobs) {
        return [run];
      }

      return [{ ...run, jobs: filteredJobs }];
    });
  }

  private withoutJobs(run: PipelineRun): PipelineRun {
    const runWithoutJobs = { ...run };
    delete runWithoutJobs.jobs;
    return runWithoutJobs;
  }

  private getRunMetricDate(run: PipelineRun): string | undefined {
    return run.completedAt || run.createdAt;
  }

  private toTimestamp(value?: string): number {
    if (!value) {
      return 0;
    }

    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toDateBoundaryTimestamp(value: string, boundary: 'start' | 'end'): number {
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    if (isDateOnly) {
      const d =
        boundary === 'end'
          ? this.tz.getEndOfDayBoundary(value)
          : this.tz.getStartOfDayBoundary(value);
      return d.getTime();
    }

    return this.toTimestamp(value);
  }

  private sortRunsByMetricDate(runs: PipelineRun[], direction: 'asc' | 'desc'): PipelineRun[] {
    const sortDirection = direction === 'asc' ? 1 : -1;
    return [...runs].sort(
      (a, b) =>
        (this.toTimestamp(this.getRunMetricDate(a)) - this.toTimestamp(this.getRunMetricDate(b))) *
        sortDirection
    );
  }

  private calculateDurationInSeconds(startedAt: string, completedAt: string): number {
    if (!startedAt || !completedAt) return 0;
    return (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000;
  }
}
