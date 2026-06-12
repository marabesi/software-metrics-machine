import { Logger, logger } from '@smmachine/utils';
import {
  JobMetrics,
  PipelineFilters,
  PipelineJob,
  PipelineMetrics,
  PipelineRun,
} from './pipeline-types';
import { IPipelinesRepository } from '../../aggregates/pipelines-repository';
import { Configuration } from '../..';

type PipelineDateFields = {
  createdAt?: string;
  completedAt?: string;
};

type PipelineRunFilterOptions = {
  sort_by?: {
    created_at?: 'asc' | 'desc';
  };
};

export interface IPipelinesService {
  filterRunsByDateRange<T extends PipelineDateFields>(
    runs: T[],
    startDate?: string,
    endDate?: string,
    options?: PipelineRunFilterOptions
  ): T[];
  getRunMetricDate(run: PipelineDateFields): string | undefined;
  getDurationMinutes(startedAt?: string, completedAt?: string): number | null;
  getPeriodKey(dateString: string | undefined, interval: 'day' | 'week' | 'month'): string;
  getMetrics(filters?: PipelineFilters): Promise<PipelineMetrics>;
  getDeploymentFrequency(interval: 'day' | 'week' | 'month', filters?: PipelineFilters): Promise<Array<{
    period: string;
    count: number;
  }>>;
  getDeploymentFrequencyWithAllIntervals(filters?: PipelineFilters): Promise<DeploymentFrequencyRow[]>;
  getJobMetrics(filters?: PipelineFilters): Promise<JobMetrics[]>;
  getJobRerunsByDay(filters?: PipelineFilters): Promise<Array<{ day: string; rerun_count: number }>>;
  getJobStepsAverageTime(filters?: PipelineFilters): Promise<Array<{ name: string; averageDurationMinutes: number; count: number }>>;
  getJobStepsAverageTimeByDay(filters?: PipelineFilters): Promise<Array<{ day: string; steps: Array<{ name: string; averageDurationMinutes: number }> }>>;
}

interface DeploymentFrequencyTarget {
  pipeline: string;
  job: string;
}

export interface DeploymentFrequencyRow {
  pipeline: string;
  job: string;
  days: string;
  weeks: string;
  months: string;
  daily_counts: number;
  weekly_counts: number;
  monthly_counts: number;
  commits: string;
  links: string;
}

export class PipelinesService implements IPipelinesService {
  private logger: Logger = logger;

  constructor(private pipelineRepository: IPipelinesRepository, private configuration?: Configuration) {}

  filterRunsByDateRange<T extends PipelineDateFields>(
    runs: T[],
    startDate?: string,
    endDate?: string,
    options?: PipelineRunFilterOptions
  ): T[] {
    const start = startDate ? this.toTimestamp(startDate) : 0;
    const end = endDate ? this.toDateBoundaryTimestamp(endDate, 'end') : 0;
    const filteredRuns = start || end ? runs.filter((run) => {
      const runTimestamp = this.toTimestamp(this.getRunMetricDate(run));
      if (start && runTimestamp < start) return false;
      if (end && runTimestamp > end) return false;
      return true;
    }) : runs;

    if (options?.sort_by?.created_at) {
      return this.sortRunsByMetricDate(filteredRuns, options.sort_by.created_at);
    }

    return filteredRuns;
  }

  getRunMetricDate(run: PipelineDateFields): string | undefined {
    return run.completedAt || run.createdAt;
  }

  getDurationMinutes(startedAt?: string, completedAt?: string): number | null {
    const start = this.toTimestamp(startedAt);
    const end = this.toTimestamp(completedAt);
    if (start === 0 || end === 0 || end < start) {
      return null;
    }
    return (end - start) / (1000 * 60);
  }

  getPeriodKey(dateString: string | undefined, interval: 'day' | 'week' | 'month'): string {
    if (!dateString) {
      return 'unknown';
    }

    if (interval === 'day') {
      return dateString.split('T')[0];
    }

    return this.getIntervalKey(new Date(dateString), interval);
  }

  /**
   * Get overall pipeline metrics for the given filters.
   */
  async getMetrics(filters?: PipelineFilters): Promise<PipelineMetrics> {
    const runs = await this.filterRuns(filters);

    const completedRuns = runs.filter((r) => r.conclusion);
    const successful = completedRuns.filter((r) => r.conclusion === 'success');
    const failed = completedRuns.filter((r) => r.conclusion === 'failure');

    const successRate =
      completedRuns.length > 0 ? (successful.length / completedRuns.length) * 100 : 0;

    // Calculate average duration
    const durations = this.extractDurations(runs);
    const averageDuration =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    this.logger.info(
      `Pipeline Metrics: ${runs.length} total, ${successful.length} successful, ${successRate.toFixed(2)}% success rate`
    );

    return {
      totalRuns: runs.length,
      successfulRuns: successful.length,
      failedRuns: failed.length,
      successRate: Math.round(successRate * 100) / 100,
      averageDurationMinutes: Math.round(averageDuration * 100) / 100,
    };
  }

  /**
   * Get deployment frequency with all intervals (daily, weekly, monthly) grouped by day.
   * Returns data in the format expected by the frontend.
   */
  async getDeploymentFrequency(
    interval: 'day' | 'week' | 'month',
    filters?: PipelineFilters
  ): Promise<Array<{ period: string; count: number }>> {
    const frequency = await this.getDeploymentFrequencyWithAllIntervals(filters);
    const groupedByTarget = new Map<string, number>();

    for (const item of frequency) {
      let period = item.months;
      let count = item.monthly_counts;

      if (interval === 'day') {
        period = item.days;
        count = item.daily_counts;
      } else if (interval === 'week') {
        period = item.weeks;
        count = item.weekly_counts;
      }

      const targetKey = `${item.pipeline}||${item.job}||${period}`;
      groupedByTarget.set(targetKey, Math.max(groupedByTarget.get(targetKey) || 0, count));
    }

    const grouped = new Map<string, number>();
    for (const [key, count] of groupedByTarget.entries()) {
      const period = key.split('||')[2];
      grouped.set(period, (grouped.get(period) || 0) + count);
    }

    return Array.from(grouped.entries()).map(([period, count]) => ({ period, count }));
  }

  async getDeploymentFrequencyWithAllIntervals(filters?: PipelineFilters): Promise<DeploymentFrequencyRow[]> {
    const targets = this.getDeploymentFrequencyTargets();

    if (targets.length === 0) {
      this.logger.warn(
        'Deployment frequency requested without deployment_frequency_targets configured'
      );
      return [];
    }

    const targetCounts = new Map<
      string,
      {
        target: DeploymentFrequencyTarget;
        dailyCounts: Map<string, number>;
        weeklyCounts: Map<string, number>;
        monthlyCounts: Map<string, number>;
      }
    >();
    const allDays = new Set<string>();
    let deploymentJobCount = 0;

    for (const target of targets) {
      const targetKey = `${target.pipeline}||${target.job}`;
      const counts = {
        target,
        dailyCounts: new Map<string, number>(),
        weeklyCounts: new Map<string, number>(),
        monthlyCounts: new Map<string, number>(),
      };

      const deployments = await this.filterRuns({
        ...filters,
        workflowPath: target.pipeline,
        jobName: target.job,
        jobConclusion: 'success',
        conclusion: 'success',
        status: 'completed',
      });

      const jobsOnly = deployments.map((run) => run.jobs || []).flat();
      deploymentJobCount += jobsOnly.length;

      for (const job of jobsOnly) {
        const timestamp = job.completedAt || job.startedAt;
        if (!timestamp) {
          continue;
        }

        const date = new Date(timestamp);
        const day = this.getIntervalKey(date, 'day');
        const week = this.getIntervalKey(date, 'week');
        const month = this.getIntervalKey(date, 'month');

        counts.dailyCounts.set(day, (counts.dailyCounts.get(day) || 0) + 1);
        counts.weeklyCounts.set(week, (counts.weeklyCounts.get(week) || 0) + 1);
        counts.monthlyCounts.set(month, (counts.monthlyCounts.get(month) || 0) + 1);
        allDays.add(day);
      }

      targetCounts.set(targetKey, counts);
    }

    this.logger.info(`Jobs only for deployment frequency calculation: ${deploymentJobCount}`);

    if (allDays.size === 0) {
      return [];
    }

    // Determine the start and end dates from the deployments
    const sortedDays = Array.from(allDays.keys()).sort();
    const firstDayStr = sortedDays[0];
    const lastDayStr = sortedDays[sortedDays.length - 1];

    const result: DeploymentFrequencyRow[] = [];
    const [startYear, startMonth, startDay] = firstDayStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = lastDayStr.split('-').map(Number);

    // Use midday to avoid daylight saving time boundary issues when incrementing.
    const firstDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 12, 0, 0));
    const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, 12, 0, 0));

    for (const counts of targetCounts.values()) {
      const currentDate = new Date(firstDate);

      while (currentDate <= endDate) {
        const currentDayStr = this.getIntervalKey(currentDate, 'day');
        const currentWeekStr = this.getIntervalKey(currentDate, 'week');
        const currentMonthStr = this.getIntervalKey(currentDate, 'month');

        result.push({
          pipeline: counts.target.pipeline,
          job: counts.target.job,
          days: currentDayStr,
          weeks: currentWeekStr,
          months: currentMonthStr,
          daily_counts: counts.dailyCounts.get(currentDayStr) || 0,
          weekly_counts: counts.weeklyCounts.get(currentWeekStr) || 0,
          monthly_counts: counts.monthlyCounts.get(currentMonthStr) || 0,
          commits: '',
          links: '',
        });

        // Move to the next day
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    }

    return result;
  }

  /**
   * Get metrics aggregated by job name.
   */
  async getJobMetrics(filters?: PipelineFilters): Promise<JobMetrics[]> {
    const runs = await this.filterRuns(filters);

    const jobMetricsMap = new Map<string, JobMetrics>();

    for (const run of runs) {
      const jobs = run.jobs || [];

      for (const job of jobs) {
        const jobName = job.name;
        if (!jobMetricsMap.has(jobName)) {
          jobMetricsMap.set(jobName, {
            jobName,
            totalRuns: 0,
            averageDurationMinutes: 0,
            successCount: 0,
            failureCount: 0,
            successRate: 0,
            rerunCount: 0,
            actionRequiredCount: 0,
            cancelledCount: 0,
            skippedCount: 0,
            timedOutCount: 0,
            unknownCount: 0,
          });
        }

        const metrics = jobMetricsMap.get(jobName)!;
        metrics.totalRuns += 1;
        metrics.rerunCount += Math.max((run.runAttempt || 1) - 1, 0);

        if (job.conclusion === 'success') {
          metrics.successCount += 1;
        } else if (job.conclusion === 'failure') {
          metrics.failureCount += 1;
        } else if (job.conclusion === 'cancelled') {
          metrics.cancelledCount += 1;
        } else if (job.conclusion === 'timed_out') {
          metrics.timedOutCount += 1;
        } else if (job.conclusion === 'action_required') {
          metrics.actionRequiredCount += 1;
        } else if (job.conclusion === 'skipped') {
          metrics.skippedCount += 1;
        } else {
          metrics.unknownCount += 1;
        }
      }
    }

    // Calculate average durations and success rates
    const result: JobMetrics[] = [];

    for (const [jobName, metrics] of jobMetricsMap.entries()) {
      // Extract durations for this job
      const durations: number[] = [];
      for (const run of runs) {
        const job = (run.jobs || []).find((j) => j.name === jobName);
        if (job && job.startedAt && job.completedAt) {
          const duration = this.calculateJobDuration(job);
          if (duration !== null) {
            durations.push(duration);
          }
        }
      }

      metrics.averageDurationMinutes =
        durations.length > 0
          ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 100) / 100
          : 0;

      metrics.successRate =
        metrics.totalRuns > 0
          ? Math.round((metrics.successCount / metrics.totalRuns) * 10000) / 100
          : 0;

      result.push(metrics);
    }

    return result.sort((a, b) => b.totalRuns - a.totalRuns);
  }

  /**
   * Get rerun counts grouped by day.
   */
  async getJobRerunsByDay(filters?: PipelineFilters): Promise<Array<{ day: string; rerun_count: number }>> {
    const runs = await this.filterRuns(filters);

    const grouped = new Map<string, number>();

    for (const run of runs) {
      const runDate = run.completedAt || run.createdAt;
      if (!runDate) {
        continue;
      }

      const day = this.toDayKey(runDate);
      const runAttempt = run.runAttempt || 1;
      const reruns = Math.max(runAttempt - 1, 0);

      grouped.set(day, (grouped.get(day) || 0) + reruns);
    }

    return Array.from(grouped.entries())
      .map(([day, rerun_count]) => ({ day, rerun_count }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }

  /**
   * Get average duration of steps for a job.
   */
  async getJobStepsAverageTime(filters?: PipelineFilters): Promise<Array<{ name: string; averageDurationMinutes: number; count: number }>> {
    const runs = await this.filterRuns(filters);
    
    // Group durations by step name
    const stepDurations = new Map<string, number[]>();
    
    for (const run of runs) {
      for (const job of run.jobs || []) {
        for (const step of job.steps || []) {
          if (!step.name || !step.startedAt || !step.completedAt) continue;
          
          const started = new Date(step.startedAt).getTime();
          const completed = new Date(step.completedAt).getTime();
          const durationMinutes = (completed - started) / (1000 * 60);
          
          if (!stepDurations.has(step.name)) {
            stepDurations.set(step.name, []);
          }
          stepDurations.get(step.name)!.push(durationMinutes);
        }
      }
    }
    
    const result: Array<{ name: string; averageDurationMinutes: number; count: number }> = [];
    
    for (const [name, durations] of stepDurations.entries()) {
      const avg = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      result.push({
        name,
        averageDurationMinutes: Math.round(avg * 100) / 100,
        count: durations.length,
      });
    }
    
    return result;
  }

  /**
   * Get average duration of steps for a job, grouped by day.
   */
  async getJobStepsAverageTimeByDay(filters?: PipelineFilters): Promise<Array<{ day: string; steps: Array<{ name: string; averageDurationMinutes: number }> }>> {
    const runs = await this.filterRuns(filters);
    
    // day -> stepName -> durations
    const dayStepDurations = new Map<string, Map<string, number[]>>();
    
    for (const run of runs) {
      const runDate = run.completedAt || run.createdAt;
      if (!runDate) continue;
      const day = this.toDayKey(runDate);
      
      for (const job of run.jobs || []) {
        for (const step of job.steps || []) {
          if (!step.name || !step.startedAt || !step.completedAt) continue;
          
          const started = new Date(step.startedAt).getTime();
          const completed = new Date(step.completedAt).getTime();
          const durationMinutes = (completed - started) / (1000 * 60);
          
          if (!dayStepDurations.has(day)) {
            dayStepDurations.set(day, new Map());
          }
          const stepMap = dayStepDurations.get(day)!;
          if (!stepMap.has(step.name)) {
            stepMap.set(step.name, []);
          }
          stepMap.get(step.name)!.push(durationMinutes);
        }
      }
    }
    
    const result: Array<{ day: string; steps: Array<{ name: string; averageDurationMinutes: number }> }> = [];
    
    for (const [day, stepMap] of dayStepDurations.entries()) {
      const steps = [];
      for (const [name, durations] of stepMap.entries()) {
        const avg = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
        steps.push({
          name,
          averageDurationMinutes: Math.round(avg * 100) / 100,
        });
      }
      result.push({ day, steps });
    }
    
    return result.sort((a, b) => a.day.localeCompare(b.day));
  }

  async loadUniqueWorkflows(): Promise<{ name: string; path: string }[]> {
    const runs = await this.filterRuns();
    const values = Array.from(
      new Set(
        runs.map((run: PipelineRun) => run.path || '').filter((value: string) => value.length > 0)
      )
    ).sort();
    return values.map((workflow) => ({ name: workflow, path: workflow }));
  }

  private toDayKey(dateString: string): string {
    return dateString ? dateString.split('T')[0] : 'unknown';
  }

  private getDeploymentFrequencyTargets(): DeploymentFrequencyTarget[] {
    if (!this.configuration) {
      return [];
    }

    return this.configuration.getDeploymentFrequencyTargets();
  }

  /**
   * Filter runs by the provided criteria.
   */
  private async filterRuns(filters?: PipelineFilters): Promise<PipelineRun[]> {
    let result = await this.loadCachedWorkflowsWithJobs();

    if (!filters) {
      return result;
    }

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      result = this.filterRunsByDateRange(result, filters.startDate, filters.endDate);
    }

    // Filter by branch
    if (filters.targetBranch) {
      result = this.filterByBranch(result, filters.targetBranch);
    }

    // Filter by workflow path
    if (filters.workflowPath) {
      result = this.filterByWorkflowPath(result, filters.workflowPath);
    }

    // Filter by conclusion
    if (filters.conclusion) {
      result = this.filterByConclusion(result, filters.conclusion);
    }

    // Filter by status
    if (filters.status) {
      result = this.filterByStatus(result, filters.status);
    }

    // Filter by selected job names and keep only selected jobs on each run
    if (filters.jobName) {
      const selectedJobNames = filters.jobName
        .split(',')
        .map((name) => name.trim().toLowerCase())
        .filter((name) => name.length > 0);

      if (selectedJobNames.length > 0) {
        result = result
          .filter((run) =>
            (run.jobs || []).some((job) => selectedJobNames.includes((job.name || '').toLowerCase()))
          )
          .map((run) => ({
            ...run,
            jobs: (run.jobs || []).filter((job) =>
              selectedJobNames.includes((job.name || '').toLowerCase())
            ),
          }));
      }
    }

    if (filters.jobConclusion) {
      const targetJobConclusion = filters.jobConclusion.trim().toLowerCase();
      result = result
        .filter((run) =>
          (run.jobs || []).some((job) => job.conclusion === targetJobConclusion)
        )
        .map((run) => ({
          ...run,
          jobs: (run.jobs || []).filter((job) => job.conclusion === targetJobConclusion),
        }));
    }

    return result;
  }

  private toTimestamp(value?: string): number {
    if (!value) {
      return 0;
    }
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toDateBoundaryTimestamp(value: string, boundary: 'start' | 'end'): number {
    const normalizedValue =
      boundary === 'end' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999Z` : value;

    return this.toTimestamp(normalizedValue);
  }

  private sortRunsByMetricDate<T extends PipelineDateFields>(
    runs: T[],
    direction: 'asc' | 'desc'
  ): T[] {
    const sortDirection = direction === 'asc' ? 1 : -1;
    return [...runs].sort(
      (a, b) =>
        (this.toTimestamp(this.getRunMetricDate(a)) - this.toTimestamp(this.getRunMetricDate(b))) *
        sortDirection
    );
  }

  private filterByBranch(runs: PipelineRun[], branch: string): PipelineRun[] {
    return runs.filter((run) => run.branch === branch);
  }

  private filterByWorkflowPath(runs: PipelineRun[], path: string): PipelineRun[] {
    return runs.filter((run) => run.path.includes(path));
  }

  private filterByConclusion(runs: PipelineRun[], conclusion: string): PipelineRun[] {
    return runs.filter((run) => run.conclusion === conclusion);
  }

  private filterByStatus(runs: PipelineRun[], status: string): PipelineRun[] {
    return runs.filter((run) => run.status === status);
  }

  private extractDurations(runs: PipelineRun[]): number[] {
    const durations: number[] = [];

    for (const run of runs) {
      if (run.startedAt && run.completedAt) {
        const started = new Date(run.startedAt).getTime();
        const completed = new Date(run.completedAt).getTime();
        const durationMinutes = (completed - started) / (1000 * 60);
        durations.push(durationMinutes);
      }
    }

    return durations;
  }

  private calculateJobDuration(job: PipelineJob): number | null {
    if (!job.startedAt || !job.completedAt) {
      return null;
    }

    const started = new Date(job.startedAt).getTime();
    const completed = new Date(job.completedAt).getTime();
    return (completed - started) / (1000 * 60); // Convert to minutes
  }

  private getIntervalKey(date: Date, interval: 'day' | 'week' | 'month'): string {
    if (interval === 'day') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else if (interval === 'week') {
      // ISO week
      const temp = new Date(date);
      const dayOfWeek = temp.getUTCDay();
      const diff = temp.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const firstDay = new Date(temp.setUTCDate(diff));

      const week = Math.ceil(
        (firstDay.getTime() - new Date(firstDay.getUTCFullYear(), 0, 1).getTime()) / 604800000
      );
      const year = firstDay.getUTCFullYear();

      return `${year}-W${String(week).padStart(2, '0')}`;
    } else {
      // Month
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    }
  }

  private async loadCachedWorkflowsWithJobs(): Promise<PipelineRun[]> {
    return this.pipelineRepository.loadPipelines();
  }
}
