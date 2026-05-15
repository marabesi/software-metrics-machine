import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PipelinesRepository, Configuration } from '@smmachine/core';

interface RunLike {
  path?: string;
  createdAt?: string;
  completedAt?: string;
  startedAt?: string;
  status?: string;
  conclusion?: string;
  branch?: string;
  event?: string;
  jobs?: Array<{ name?: string; status?: string; conclusion?: string; startedAt?: string; completedAt?: string }>;
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
  ) {}

  @Get('/pipelines/summary')
  async pipelineSummary(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('workflow_path') workflowPath?: string,
    @Query('status') status?: string,
    @Query('conclusion') conclusion?: string,
    @Query('branch') branch?: string,
    @Query('job_name') jobName?: string,
    @Query('event') event?: string,
  ) {
    const runs = await this.loadRunsWithFilters({
      startDate,
      endDate,
      workflowPath,
      status,
      conclusion,
      branch,
      jobName,
      event,
      includeJobs: false,
    });

    const sortedByDate = [...runs].sort((a, b) => this.toTimestamp(a.createdAt) - this.toTimestamp(b.createdAt));
    return {
      total_runs: runs.length,
      first_run: sortedByDate.length > 0 ? sortedByDate[0] : null,
      last_run: sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1] : null,
      in_progress: runs.filter((run) => (run.status || '').toLowerCase() === 'in_progress').length,
      queued: runs.filter((run) => (run.status || '').toLowerCase() === 'queued').length,
    };
  }

  @Get('/pipelines/by-status')
  async byStatus(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('workflow_path') workflowPath?: string,
    @Query('status') status?: string,
    @Query('conclusion') conclusion?: string,
    @Query('branch') branch?: string,
    @Query('job_name') jobName?: string,
    @Query('event') event?: string,
  ) {
    const runs = await this.loadRunsWithFilters({
      startDate,
      endDate,
      workflowPath,
      status,
      conclusion,
      branch,
      jobName,
      event,
      includeJobs: true,
    });

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
  async jobsByStatus(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('workflow_path') workflowPath?: string,
    @Query('status') status?: string,
    @Query('conclusion') conclusion?: string,
    @Query('branch') branch?: string,
    @Query('job_name') jobName?: string,
    @Query('event') event?: string,
  ) {
    const runs = await this.loadRunsWithFilters({
      startDate,
      endDate,
      workflowPath,
      status,
      conclusion,
      branch,
      jobName,
      event,
      includeJobs: true,
    });

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

  @Get('/pipelines/runs-duration')
  async runsDuration(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('workflow_path') workflowPath?: string,
    @Query('status') status?: string,
    @Query('conclusion') conclusion?: string,
    @Query('branch') branch?: string,
    @Query('job_name') jobName?: string,
    @Query('event') event?: string,
  ) {
    const runs = await this.loadRunsWithFilters({
      startDate,
      endDate,
      workflowPath,
      status,
      conclusion,
      branch,
      jobName,
      event,
      includeJobs: false,
    });

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

    return Array.from(grouped.entries())
      .map(([workflow, durations]) => ({
        workflow,
        avg_duration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        total_runs: durations.length,
      }))
      .sort((a, b) => b.total_runs - a.total_runs);
  }

  @Get('/pipelines/deployment-frequency')
  async deploymentFrequency(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('workflow_path') workflowPath?: string,
    @Query('job_name') jobName?: string,
    @Query('status') status?: string,
    @Query('conclusion') conclusion?: string,
    @Query('branch') branch?: string,
    @Query('event') event?: string,
  ) {
    const runs = await this.loadRunsWithFilters({
      startDate,
      endDate,
      workflowPath,
      status,
      conclusion,
      branch,
      jobName,
      event,
      includeJobs: true,
    });

    const successfulRuns = runs.filter((run) => (run.conclusion || '').toLowerCase() === 'success');

    const dailyCounts = new Map<string, number>();
    const weeklyCounts = new Map<string, number>();
    const monthlyCounts = new Map<string, number>();

    for (const run of successfulRuns) {
      const timestamp = run.completedAt || run.createdAt;
      if (!timestamp) {
        continue;
      }

      const day = this.toDayKey(timestamp);
      const week = this.toWeekKey(timestamp);
      const month = this.toMonthKey(timestamp);

      dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1);
      weeklyCounts.set(week, (weeklyCounts.get(week) || 0) + 1);
      monthlyCounts.set(month, (monthlyCounts.get(month) || 0) + 1);
    }

    const orderedDays = Array.from(dailyCounts.keys()).sort();
    return orderedDays.map((day) => {
      const week = this.toWeekKey(day);
      const month = this.toMonthKey(day);
      return {
        days: day,
        weeks: week,
        months: month,
        daily_counts: dailyCounts.get(day) || 0,
        weekly_counts: weeklyCounts.get(week) || 0,
        monthly_counts: monthlyCounts.get(month) || 0,
        commits: '',
        links: '',
      };
    });
  }

  @Get('/pipelines/runs-by')
  async runsBy(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('aggregate_by') aggregateBy?: string,
    @Query('workflow_path') workflowPath?: string,
    @Query('status') status?: string,
    @Query('conclusion') conclusion?: string,
    @Query('branch') branch?: string,
    @Query('job_name') jobName?: string,
    @Query('event') event?: string,
  ) {
    const runs = await this.loadRunsWithFilters({
      startDate,
      endDate,
      workflowPath,
      status,
      conclusion,
      branch,
      jobName,
      event,
      includeJobs: false,
    });

    const mode = (aggregateBy || 'week').toLowerCase();
    const grouped = new Map<string, number>();

    for (const run of runs) {
      const keyDate = run.completedAt || run.createdAt;
      if (!keyDate) {
        continue;
      }
      const period = mode === 'month' ? this.toMonthKey(keyDate) : this.toWeekKey(keyDate);
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
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('workflow_path') workflowPath?: string,
    @Query('status') status?: string,
    @Query('conclusion') conclusion?: string,
    @Query('branch') branch?: string,
    @Query('job_name') jobName?: string,
    @Query('exclude_jobs') excludeJobs?: string,
    @Query('event') event?: string,
    @Query('top') top?: string,
  ) {
    const runs = await this.loadRunsWithFilters({
      startDate,
      endDate,
      workflowPath,
      status,
      conclusion,
      branch,
      jobName,
      event,
      includeJobs: true,
    });

    const excluded = new Set(this.parseCsvList(excludeJobs).map((name) => name.toLowerCase()));
    const grouped = new Map<string, number[]>();

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
        const existing = grouped.get(name) || [];
        existing.push(duration);
        grouped.set(name, existing);
      }
    }

    const maxRows = top ? Number(top) : 20;
    const result = Array.from(grouped.entries())
      .map(([jobNameValue, durations]) => ({
        job_name: jobNameValue,
        avg_time: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        count: durations.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, Number.isFinite(maxRows) ? maxRows : 20);

    return { result };
  }

  @Get('/pipelines/workflows')
  async workflows() {
    const runs = await this.pipelinesRepo.refreshPipelines();
    const values = Array.from(
      new Set(runs.map((run: RunLike) => run.path || '').filter((value: string) => value.length > 0)),
    ).sort();
    return values.map((workflow) => ({ name: workflow, path: workflow }));
  }

  @Get('/pipelines/statuses')
  async statuses(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const runs = await this.loadRunsWithFilters({ startDate, endDate, includeJobs: false });
    return Array.from(
      new Set(runs.map((run) => run.status || '').filter((value) => value.length > 0)),
    ).sort();
  }

  @Get('/pipelines/conclusions')
  async conclusions(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const runs = await this.loadRunsWithFilters({ startDate, endDate, includeJobs: false });
    return Array.from(
      new Set(runs.map((run) => run.conclusion || '').filter((value) => value.length > 0)),
    ).sort();
  }

  @Get('/pipelines/branches')
  async branches(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const runs = await this.loadRunsWithFilters({ startDate, endDate, includeJobs: false });
    return Array.from(
      new Set(runs.map((run) => run.branch || '').filter((value) => value.length > 0)),
    ).sort();
  }

  @Get('/pipelines/events')
  async events() {
    const runs = await this.pipelinesRepo.refreshPipelines();
    return Array.from(
      new Set(runs.map((run: RunLike) => run.event || '').filter((value: string) => value.length > 0)),
    ).sort();
  }

  @Get('/pipelines/jobs')
  async jobs(@Query('workflow_path') workflowPath?: string) {
    const runs = await this.loadRunsWithFilters({ workflowPath, includeJobs: true });
    const names = new Set<string>();

    for (const run of runs) {
      for (const job of run.jobs || []) {
        if (job.name && job.name.length > 0) {
          names.add(job.name);
        }
      }
    }

    return Array.from(names).sort().map((name) => ({ name, id: name }));
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
    const week = Math.ceil((monday.getTime() - new Date(year, 0, 1).getTime()) / (24 * 60 * 60 * 1000 / 7));
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private toMonthKey(dateString?: string): string {
    if (!dateString) {
      return 'unknown';
    }
    return dateString.substring(0, 7);
  }

  private async loadRunsWithFilters(filters: {
    startDate?: string;
    endDate?: string;
    workflowPath?: string;
    status?: string;
    conclusion?: string;
    branch?: string;
    jobName?: string;
    event?: string;
    includeJobs: boolean;
  }): Promise<RunLike[]> {
    const runs = await this.pipelinesRepo.refreshPipelines();
    return runs.filter((run: RunLike) => {
      if (filters.startDate && this.toTimestamp(run.createdAt) < this.toTimestamp(filters.startDate)) {
        return false;
      }
      if (filters.endDate && this.toTimestamp(run.createdAt) > this.toTimestamp(filters.endDate)) {
        return false;
      }
      if (filters.workflowPath && run.path !== filters.workflowPath) {
        return false;
      }
      if (filters.status && (run.status || '').toLowerCase() !== filters.status.toLowerCase()) {
        return false;
      }
      if (filters.conclusion && (run.conclusion || '').toLowerCase() !== filters.conclusion.toLowerCase()) {
        return false;
      }
      if (filters.branch && run.branch !== filters.branch) {
        return false;
      }
      if (filters.event && run.event !== filters.event) {
        return false;
      }
      if (filters.jobName) {
        const hasJob = (run.jobs || []).some((job) => job.name === filters.jobName);
        if (!hasJob) {
          return false;
        }
      }
      return true;
    });
  }
}
