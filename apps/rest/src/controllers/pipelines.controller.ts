import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PipelinesRepository, Configuration, PipelinesService } from '@smmachine/core';

type PipelineDurationsMetrics = {
  durations: number[];
  workflowName?: string;
};

interface PipelineFiltersQuery {
  start_date?: string;
  end_date?: string;
  workflow_path?: string;
  status?: string;
  conclusion?: string;
  branch?: string;
  job_name?: string;
  event?: string;
}

interface RunLike {
  path?: string;
  createdAt?: string;
  completedAt?: string;
  startedAt?: string;
  status?: string;
  conclusion?: string;
  branch?: string;
  event?: string;
  jobs?: Array<{
    name?: string;
    status?: string;
    conclusion?: string;
    startedAt?: string;
    completedAt?: string;
  }>;
}

/**
 * Pipeline Metrics REST Controller
 * Provides endpoints for CI/CD pipeline metrics and analysis
 */
@ApiTags('Pipeline Metrics')
@Controller()
export class PipelinesController {
  private readonly logger = new Logger('PipelinesController');

  constructor(
    private readonly pipelinesRepo: PipelinesRepository,
    private readonly config: Configuration,
    private readonly pipelinesService: PipelinesService
  ) {}

  @Get('/pipelines/summary')
  async pipelineSummary(@Query() query: PipelineFiltersQuery) {
    const runs = await this.loadRunsWithFilters({ ...query, includeJobs: false });

    const sortedByDate = [...runs].sort(
      (a, b) => this.toTimestamp(a.createdAt) - this.toTimestamp(b.createdAt)
    );
    return {
      total_runs: runs.length,
      first_run: sortedByDate.length > 0 ? sortedByDate[0] : null,
      last_run: sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1] : null,
      in_progress: runs.filter((run) => (run.status || '').toLowerCase() === 'in_progress').length,
      queued: runs.filter((run) => (run.status || '').toLowerCase() === 'queued').length,
    };
  }

  @Get('/pipelines/by-status')
  async byStatus(@Query() query: PipelineFiltersQuery) {
    const runs = await this.loadRunsWithFilters({ ...query, includeJobs: true });

    const grouped = new Map<string, number>();
    for (const run of runs) {
      const key = run.status || 'unknown';
      grouped.set(key, (grouped.get(key) || 0) + 1);
    }

    return Array.from(grouped.entries())
      .map(([state, count]) => ({ status: state, count }))
      .sort((a, b) => b.count - a.count);
  }

  @Get('/pipelines/jobs-by-status')
  async jobsByStatus(@Query() query: PipelineFiltersQuery) {
    const runs = await this.loadRunsWithFilters({ ...query, includeJobs: true });

    const grouped = new Map<string, number>();

    for (const run of runs) {
      const jobs = run.jobs || [];
      for (const job of jobs) {
        const key = job.conclusion || job.status || 'unknown';
        grouped.set(key, (grouped.get(key) || 0) + 1);
      }
    }

    return Array.from(grouped.entries())
      .map(([state, count]) => ({ Status: state, Count: count }))
      .sort((a, b) => b.Count - a.Count);
  }

  @Get('/pipelines/jobs-summary')
  async jobsSummary(@Query() query: PipelineFiltersQuery) {
    const metrics = await this.pipelinesService.getJobMetrics(this.toServiceFilters(query));

    return {
      result: metrics.map((item) => ({
        job_name: item.jobName,
        total_runs: item.totalRuns,
        avg_duration_minutes: item.averageDurationMinutes,
        success_count: item.successCount,
        failure_count: item.failureCount,
        success_rate: item.successRate,
        rerun_count: item.rerunCount,
      })),
    };
  }

  @Get('/pipelines/jobs-reruns-by-day')
  async jobsRerunsByDay(@Query() query: PipelineFiltersQuery) {
    const metrics = await this.pipelinesService.getJobRerunsByDay(this.toServiceFilters(query));

    return { result: metrics };
  }

  @Get('/pipelines/runs-duration')
  async runsDuration(
    @Query('aggregation') aggregation?: string,
    @Query() query?: PipelineFiltersQuery
  ) {
    const runs = await this.loadRunsWithFilters({ ...(query || {}), includeJobs: false });

    const grouped = new Map<string, number[]>();

    for (const run of runs) {
      const duration = this.getDurationMinutes(run.startedAt, run.completedAt);
      if (duration === null) {
        continue;
      }
      const workflow = run.path || 'unknown';
      const existing = grouped.get(workflow) || [];
      existing.push(duration);
      grouped.set(workflow, existing);
    }

    const normalizedAggregation = (aggregation || '').toLowerCase();

    return Array.from(grouped.entries())
      .map(([workflow, durations]) => {
        const n = durations.length;
        const avgDuration = n > 0 ? durations.reduce((a, b) => a + b, 0) / n : 0;
        const minDuration = n > 0 ? Math.min(...durations) : 0;
        const maxDuration = n > 0 ? Math.max(...durations) : 0;

        if (normalizedAggregation === 'avg' || normalizedAggregation === 'min' || normalizedAggregation === 'max') {
          return {
            workflow,
            aggregation: normalizedAggregation,
            duration: normalizedAggregation === 'avg' ? avgDuration : normalizedAggregation === 'min' ? minDuration : maxDuration,
            total_runs: n,
          };
        }

        return {
          workflow,
          avg_duration: avgDuration,
          min_duration: minDuration,
          max_duration: maxDuration,
          total_runs: n,
        };
      })
      .sort((a, b) => b.total_runs - a.total_runs);
  }

  @Get('/pipelines/jobs-duration-by-workflow')
  async jobsDurationByWorkflow(@Query() query: PipelineFiltersQuery) {
    const runs = await this.loadRunsWithFilters({ ...query, includeJobs: true });

    // Map: workflow -> job name -> list of durations
    const grouped = new Map<string, Map<string, number[]>>();

    for (const run of runs) {
      const workflow = run.path || 'unknown';
      const jobs = run.jobs || [];
      for (const job of jobs) {
        const name = (job.name || '').trim();
        if (!name) continue;
        const duration = this.getDurationMinutes(job.startedAt, job.completedAt);
        if (duration === null) continue;
        if (!grouped.has(workflow)) grouped.set(workflow, new Map());
        const jobMap = grouped.get(workflow)!;
        const existing = jobMap.get(name) || [];
        existing.push(duration);
        jobMap.set(name, existing);
      }
    }

    // Return one row per workflow with each job's avg duration as a key
    return Array.from(grouped.entries()).map(([workflow, jobMap]) => {
      const jobs: Record<string, number> = {};
      for (const [name, durations] of jobMap.entries()) {
        jobs[name] = durations.reduce((a, b) => a + b, 0) / durations.length;
      }
      return { workflow, jobs };
    }).sort((a, b) => a.workflow.localeCompare(b.workflow));
  }

  @Get('/pipelines/deployment-frequency')
  async deploymentFrequency(@Query() query: PipelineFiltersQuery) {
    return this.pipelinesService.getDeploymentFrequencyWithAllIntervals(this.toServiceFilters(query));
  }

  @Get('/pipelines/runs-by')
  async runsBy(
    @Query('aggregate_by') aggregateBy?: string,
    @Query() query?: PipelineFiltersQuery
  ) {
    const runs = await this.loadRunsWithFilters({ ...(query || {}), includeJobs: false });

    const mode = (aggregateBy || 'week').toLowerCase();
    const grouped = new Map<string, number>();

    for (const run of runs) {
      const keyDate = run.completedAt || run.createdAt;
      if (!keyDate) {
        continue;
      }
      const period =
        mode === 'day'
          ? this.toDayKey(keyDate)
          : mode === 'month'
            ? this.toMonthKey(keyDate)
            : this.toWeekKey(keyDate);
      const workflow = run.path || 'unknown';
      const key = `${period}||${workflow}`;
      grouped.set(key, (grouped.get(key) || 0) + 1);
    }

    return Array.from(grouped.entries())
      .map(([key, count]) => {
        const [period, workflow] = key.split('||');
        return { period, workflow, runs: count };
      })
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  @Get('/pipelines/jobs-average-time')
  async jobsAverageTime(
    @Query('exclude_jobs') excludeJobs?: string,
    @Query('top') top?: string,
    @Query() query?: PipelineFiltersQuery
  ) {
    const runs = await this.loadRunsWithFilters({ ...(query || {}), includeJobs: true });

    const excluded = new Set(this.parseCsvList(excludeJobs).map((name) => name.toLowerCase()));
    const grouped = new Map<string, PipelineDurationsMetrics>();

    for (const run of runs) {
      const jobs = run.jobs || [];
      for (const job of jobs) {
        const name = (job.name || '').trim();
        if (!name || excluded.has(name.toLowerCase())) {
          continue;
        }
        const duration = this.getDurationMinutes(job.startedAt, job.completedAt);
        if (duration === null) {
          continue;
        }

        const existing: PipelineDurationsMetrics = grouped.get(name) || { durations: [], workflowName: (job as any).workflow_name };
        existing.durations.push(duration);
        grouped.set(name, existing);
      }
    }

    const maxRows = top ? Number(top) : 20;
    const result = Array.from(grouped.entries())
      .map(([jobNameValue, data]) => ({
        job_name: jobNameValue,
        workflow_name: data.workflowName,
        avg_time:
          data.durations.length > 0 ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length : 0,
        count: data.durations.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, Number.isFinite(maxRows) ? maxRows : 20);

    return { result };
  }

  @Get('/pipelines/jobs-average-time-by-day')
  async jobsAverageTimeByDay(
    @Query('exclude_jobs') excludeJobs?: string,
    @Query() query?: PipelineFiltersQuery
  ) {
    const runs = await this.loadRunsWithFilters({ ...(query || {}), includeJobs: true });

    const excluded = new Set(this.parseCsvList(excludeJobs).map((name) => name.toLowerCase()));
    const grouped = new Map<string, number[]>();

    for (const run of runs) {
      const jobs = run.jobs || [];
      const runDate = run.completedAt || run.createdAt;
      if (!runDate) {
        continue;
      }
      const day = this.toDayKey(runDate);

      for (const job of jobs) {
        const name = (job.name || '').trim();
        if (!name || excluded.has(name.toLowerCase())) {
          continue;
        }
        const duration = this.getDurationMinutes(job.startedAt, job.completedAt);
        if (duration === null) {
          continue;
        }

        if (!grouped.has(day)) {
          grouped.set(day, []);
        }
        grouped.get(day)!.push(duration);
      }
    }

    const result = Array.from(grouped.entries())
      .map(([day, durations]) => ({
        day,
        avg_time:
          durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        count: durations.length,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));

    return { result };
  }

  @Get('/pipelines/workflows')
  async workflows() {
    return this.pipelinesService.loadUniqueWorkflows();
  }

  @Get('/pipelines/statuses')
  async statuses(@Query() query: PipelineFiltersQuery) {
    const runs = await this.loadRunsWithFilters({ ...query, includeJobs: false });
    return Array.from(
      new Set(runs.map((run) => run.status || '').filter((value) => value.length > 0))
    ).sort();
  }

  @Get('/pipelines/conclusions')
  async conclusions(@Query() query: PipelineFiltersQuery) {
    const runs = await this.loadRunsWithFilters({ ...query, includeJobs: false });
    return Array.from(
      new Set(runs.map((run) => run.conclusion || '').filter((value) => value.length > 0))
    ).sort();
  }

  @Get('/pipelines/branches')
  async branches(@Query() query: PipelineFiltersQuery) {
    const runs = await this.loadRunsWithFilters({ ...query, includeJobs: false });
    return Array.from(
      new Set(runs.map((run) => run.branch || '').filter((value) => value.length > 0))
    ).sort();
  }

  @Get('/pipelines/events')
  async events() {
    const runs = await this.pipelinesRepo.loadPipelines();
    return Array.from(
      new Set(
        runs.map((run: RunLike) => run.event || '').filter((value: string) => value.length > 0)
      )
    ).sort();
  }

  @Get('/pipelines/jobs')
  async jobs(@Query() query: PipelineFiltersQuery) {
    const runs = await this.loadRunsWithFilters({ ...query, includeJobs: true });
    const names = new Set<string>();

    for (const run of runs) {
      for (const job of run.jobs || []) {
        if (job.name && job.name.length > 0) {
          names.add(job.name);
        }
      }
    }

    return Array.from(names)
      .sort()
      .map((name) => ({ name, id: name }));
  }

  // ========== PRIVATE HELPERS ==========

  private parseCsvList(value?: string): string[] {
    if (!value) {
      return [];
    }
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private toTimestamp(value?: string): number {
    if (!value) {
      return 0;
    }
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private getDurationMinutes(startedAt?: string, completedAt?: string): number | null {
    const start = this.toTimestamp(startedAt);
    const end = this.toTimestamp(completedAt);
    if (start === 0 || end === 0 || end < start) {
      return null;
    }
    return (end - start) / (1000 * 60);
  }

  private toDayKey(dateString?: string): string {
    return dateString ? dateString.split('T')[0] : 'unknown';
  }

  private toWeekKey(dateString?: string): string {
    if (!dateString) {
      return 'unknown';
    }
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const year = monday.getFullYear();
    const week = Math.ceil(
      (monday.getTime() - new Date(year, 0, 1).getTime()) / ((24 * 60 * 60 * 1000) / 7)
    );
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private toMonthKey(dateString?: string): string {
    if (!dateString) {
      return 'unknown';
    }
    return dateString.substring(0, 7);
  }

  private toServiceFilters(query: PipelineFiltersQuery) {
    return {
      startDate: query.start_date,
      endDate: query.end_date,
      workflowPath: query.workflow_path,
      status: query.status,
      conclusion: query.conclusion,
      targetBranch: query.branch,
      jobName: query.job_name,
      event: query.event,
    };
  }

  private async loadRunsWithFilters(filters: {
    start_date?: string;
    end_date?: string;
    workflow_path?: string;
    status?: string;
    conclusion?: string;
    branch?: string;
    job_name?: string;
    job_conclusion?: string;
    event?: string;
    includeJobs: boolean;
  }): Promise<RunLike[]> {
    this.logger.debug('Loading runs with filters:', filters);
    const runs = await this.pipelinesRepo.loadPipelines();
    const selectedJobNames = filters.job_name
      ? filters.job_name
          .split(',')
          .map((n) => n.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const filteredRuns = runs.filter((run: RunLike) => {
      if (
        filters.start_date &&
        this.toTimestamp(run.createdAt) < this.toTimestamp(filters.start_date)
      ) {
        return false;
      }
      if (filters.end_date && this.toTimestamp(run.createdAt) > this.toTimestamp(filters.end_date)) {
        return false;
      }
      if (filters.workflow_path && run.path !== filters.workflow_path) {
        return false;
      }
      if (filters.status && (run.status || '').toLowerCase() !== filters.status.toLowerCase()) {
        return false;
      }
      if (
        filters.conclusion &&
        (run.conclusion || '').toLowerCase() !== filters.conclusion.toLowerCase()
      ) {
        return false;
      }
      if (filters.branch && run.branch !== filters.branch) {
        return false;
      }
      if (filters.event && run.event !== filters.event) {
        return false;
      }
      if (filters.job_name) {
        const hasJob = (run.jobs || []).some((job) =>
          selectedJobNames.includes((job.name || '').toLowerCase())
        );
        if (!hasJob) {
          return false;
        }
      }
      return true;
    });

    if (!filters.includeJobs || selectedJobNames.length === 0) {
      return filteredRuns;
    }

    return filteredRuns.map((run) => ({
      ...run,
      jobs: (run.jobs || [])
        .filter(job => selectedJobNames.includes((job.name || '').toLowerCase()))
        .filter(job => {
          if (filters.job_conclusion) {
            return (job.conclusion || '').toLowerCase() === filters.job_conclusion.toLowerCase();
          }
          return true;
        }
      ),
    }));
  }
}
