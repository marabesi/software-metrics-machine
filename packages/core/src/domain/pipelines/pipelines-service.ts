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

export interface IPipelinesService {
  getMetrics(filters?: PipelineFilters): Promise<PipelineMetrics>;
  getDeploymentFrequencyWithAllIntervals(filters?: PipelineFilters): Promise<Array<{
    days: string;
    weeks: string;
    months: string;
    daily_counts: number;
    weekly_counts: number;
    monthly_counts: number;
    commits: string;
    links: string;
  }>>;
  getJobMetrics(filters?: PipelineFilters): Promise<JobMetrics[]>;
  getJobRerunsByDay(filters?: PipelineFilters): Promise<Array<{ day: string; rerun_count: number }>>;
}

export class PipelinesService implements IPipelinesService {
  private logger: Logger = logger;

  constructor(private pipelineRepository: IPipelinesRepository, private configuration: Configuration) {}

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
  async getDeploymentFrequencyWithAllIntervals(filters?: PipelineFilters): Promise<Array<{
    days: string;
    weeks: string;
    months: string;
    daily_counts: number;
    weekly_counts: number;
    monthly_counts: number;
    commits: string;
    links: string;
  }>> {
    const targetPipeline = (this.configuration.deploymentFrequencyTargetPipeline || '').trim();
    const targetJob = (this.configuration.deploymentFrequencyTargetJob || '').trim();

    if (!targetPipeline || !targetJob) {
      this.logger.warn(
        'Deployment frequency requested without deployment_frequency_target_pipeline or deployment_frequency_target_job configured'
      );
      return [];
    }

    const deployments = await this.filterRuns({
      ...filters,
      workflowPath: targetPipeline,
      jobName: targetJob,
      conclusion: 'success',
      status: 'completed',
    });

    const dailyCounts = new Map<string, number>();
    const weeklyCounts = new Map<string, number>();
    const monthlyCounts = new Map<string, number>();

    const jobsOnly = deployments.map(run => run.jobs || []).flat();

    this.logger.info(`Jobs only for deployment frequency calculation: ${jobsOnly.length}`);

    for (const job of jobsOnly) {
      const timestamp = job.completedAt || job.startedAt;
      if (!timestamp) {
        continue;
      }

      const date = new Date(timestamp);
      const day = this.getIntervalKey(date, 'day');
      const week = this.getIntervalKey(date, 'week');
      const month = this.getIntervalKey(date, 'month');

      dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1);
      weeklyCounts.set(week, (weeklyCounts.get(week) || 0) + 1);
      monthlyCounts.set(month, (monthlyCounts.get(month) || 0) + 1);
    }

    // Create result grouped by day
    const orderedDays = Array.from(dailyCounts.keys()).sort();
    return orderedDays.map((day) => {
      const week = this.getIntervalKey(new Date(day), 'week');
      const month = this.getIntervalKey(new Date(day), 'month');
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
      result = this.filterByDateRange(result, filters.startDate, filters.endDate);
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

    return result;
  }

  private filterByDateRange(
    runs: PipelineRun[],
    startDate?: string,
    endDate?: string
  ): PipelineRun[] {
    if (!startDate && !endDate) {
      return runs;
    }

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    return runs.filter((run) => {
      const runDate = new Date(run.createdAt);
      if (start && runDate < start) return false;
      if (end && runDate > end) return false;
      return true;
    });
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
