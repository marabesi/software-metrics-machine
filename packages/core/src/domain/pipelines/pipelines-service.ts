import { Logger, logger } from '@smm/utils';
import { IRepository } from '../../infrastructure/repository';
import {
  PipelineRun,
  PipelineJob,
  PipelineFilters,
  PipelineMetrics,
  DeploymentFrequencyByInterval,
  JobMetrics,
} from './pipeline-types';

export interface IPipelinesService {
  getMetrics(filters?: PipelineFilters): Promise<PipelineMetrics>;
  getDeploymentFrequency(
    interval: 'day' | 'week' | 'month',
    filters?: PipelineFilters
  ): Promise<DeploymentFrequencyByInterval[]>;
  getJobMetrics(filters?: PipelineFilters): Promise<JobMetrics[]>;
}

/**
 * PipelinesService provides analytics on CI/CD pipeline runs.
 * Calculates deployment frequency, lead time, and job metrics.
 */
export class PipelinesService implements IPipelinesService {
  private logger: Logger = logger;

  constructor(private pipelineRepository: IRepository<PipelineRun>) {}

  /**
   * Get overall pipeline metrics for the given filters.
   */
  async getMetrics(filters?: PipelineFilters): Promise<PipelineMetrics> {
    const runs = await this.filterRuns(filters);

    const completedRuns = runs.filter(r => r.conclusion);
    const successful = completedRuns.filter(r => r.conclusion === 'success');
    const failed = completedRuns.filter(r => r.conclusion === 'failure');

    const successRate =
      completedRuns.length > 0
        ? (successful.length / completedRuns.length) * 100
        : 0;

    // Calculate average duration
    const durations = this.extractDurations(runs);
    const averageDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    this.logger.info(
      `Pipeline Metrics: ${runs.length} total, ${successful.length} successful, ${(successRate).toFixed(2)}% success rate`
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
   * Get deployment frequency grouped by time interval.
   */
  async getDeploymentFrequency(
    interval: 'day' | 'week' | 'month',
    filters?: PipelineFilters
  ): Promise<DeploymentFrequencyByInterval[]> {
    const runs = await this.filterRuns(filters);

    // Only count successful runs for deployment frequency
    const deployments = runs.filter(r => r.conclusion === 'success');

    // Group by time interval
    const byInterval = new Map<string, PipelineRun[]>();

    for (const run of deployments) {
      const date = new Date(run.completedAt || run.createdAt);
      const key = this.getIntervalKey(date, interval);

      if (!byInterval.has(key)) {
        byInterval.set(key, []);
      }
      byInterval.get(key)!.push(run);
    }

    // Calculate metrics for each interval
    const result: DeploymentFrequencyByInterval[] = [];
    const intervals = Array.from(byInterval.keys()).sort();

    for (const intervalKey of intervals) {
      const intervalRuns = byInterval.get(intervalKey) || [];
      const durations = this.extractDurations(intervalRuns);
      const averageDuration =
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0;

      const successCount = intervalRuns.filter(
        r => r.conclusion === 'success'
      ).length;
      const failureCount = intervalRuns.filter(
        r => r.conclusion === 'failure'
      ).length;
      const successRate =
        intervalRuns.length > 0
          ? (successCount / intervalRuns.length) * 100
          : 0;

      result.push({
        period: intervalKey,
        count: intervalRuns.length,
        averageDurationMinutes: Math.round(averageDuration * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
      });
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
        if (job.conclusion === 'skipped') {
          continue;
        }

        const jobName = job.name;
        if (!jobMetricsMap.has(jobName)) {
          jobMetricsMap.set(jobName, {
            jobName,
            totalRuns: 0,
            averageDurationMinutes: 0,
            successCount: 0,
            failureCount: 0,
            successRate: 0,
          });
        }

        const metrics = jobMetricsMap.get(jobName)!;
        metrics.totalRuns += 1;

        if (job.conclusion === 'success') {
          metrics.successCount += 1;
        } else if (job.conclusion === 'failure') {
          metrics.failureCount += 1;
        }
      }
    }

    // Calculate average durations and success rates
    const result: JobMetrics[] = [];

    for (const [jobName, metrics] of jobMetricsMap.entries()) {
      // Extract durations for this job
      const durations: number[] = [];
      for (const run of runs) {
        const job = (run.jobs || []).find(j => j.name === jobName);
        if (job && job.startedAt && job.completedAt) {
          const duration = this.calculateJobDuration(job);
          if (duration !== null) {
            durations.push(duration);
          }
        }
      }

      metrics.averageDurationMinutes =
        durations.length > 0
          ? Math.round(
              (durations.reduce((a, b) => a + b, 0) / durations.length) * 100
            ) / 100
          : 0;

      metrics.successRate =
        metrics.totalRuns > 0
          ? Math.round((metrics.successCount / metrics.totalRuns) * 10000) / 100
          : 0;

      result.push(metrics);
    }

    return result.sort(
      (a, b) => b.totalRuns - a.totalRuns
    );
  }

  /**
   * Filter runs by the provided criteria.
   */
  private async filterRuns(filters?: PipelineFilters): Promise<PipelineRun[]> {
    const allRuns = await this.pipelineRepository.loadAll();

    let result = allRuns;

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

    return runs.filter(run => {
      const runDate = new Date(run.createdAt);
      if (start && runDate < start) return false;
      if (end && runDate > end) return false;
      return true;
    });
  }

  private filterByBranch(
    runs: PipelineRun[],
    branch: string
  ): PipelineRun[] {
    return runs.filter(run => run.branch === branch);
  }

  private filterByWorkflowPath(
    runs: PipelineRun[],
    path: string
  ): PipelineRun[] {
    return runs.filter(run => run.path.includes(path));
  }

  private filterByConclusion(
    runs: PipelineRun[],
    conclusion: string
  ): PipelineRun[] {
    return runs.filter(run => run.conclusion === conclusion);
  }

  private filterByStatus(
    runs: PipelineRun[],
    status: string
  ): PipelineRun[] {
    return runs.filter(run => run.status === status);
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

  private getIntervalKey(
    date: Date,
    interval: 'day' | 'week' | 'month'
  ): string {
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
        (firstDay.getTime() - new Date(firstDay.getUTCFullYear(), 0, 1).getTime()) /
          604800000
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
}
