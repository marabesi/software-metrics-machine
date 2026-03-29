import { Logger, logger } from '@utils/logger';
import { IRepository } from '../../infrastructure/repository';
import {
  PRDetails,
  PRFilters,
  PRMetrics,
  PRsByTimeframe,
  LabelSummary,
} from './pr-types';

export interface IPRsService {
  getMetrics(filters?: PRFilters): Promise<PRMetrics>;
  getMetricsByMonth(filters?: PRFilters): Promise<PRsByTimeframe[]>;
  getMetricsByWeek(filters?: PRFilters): Promise<PRsByTimeframe[]>;
  getLabelSummaries(filters?: PRFilters): Promise<LabelSummary[]>;
}

/**
 * PRsRepository provides analytics on Pull Requests.
 * Calculates lead time, review speed, and other PR metrics.
 */
export class PRsService implements IPRsService {
  private logger: Logger = logger;

  constructor(private prRepository: IRepository<PRDetails>) {}

  /**
   * Get overall PR metrics for the given filters.
   */
  async getMetrics(filters?: PRFilters): Promise<PRMetrics> {
    const prs = await this.filterPRs(filters);

    const mergedPRs = prs.filter(pr => pr.mergedAt);
    const closedPRs = prs.filter(pr => pr.closedAt && !pr.mergedAt);
    const openPRs = prs.filter(pr => !pr.closedAt && !pr.mergedAt);

    const openDays = mergedPRs.map(pr => this.calculateOpenDays(pr));
    const averageOpenDays =
      openDays.length > 0
        ? openDays.reduce((a, b) => a + b, 0) / openDays.length
        : 0;

    const totalComments = prs.reduce((sum, pr) => sum + (pr.comments || 0), 0);
    const averageComments =
      prs.length > 0 ? totalComments / prs.length : 0;

    this.logger.info(
      `PR Metrics: ${prs.length} total, ${mergedPRs.length} merged, avg ${averageOpenDays.toFixed(2)} days open`
    );

    return {
      averageOpenDays: Math.round(averageOpenDays * 100) / 100,
      totalPRs: prs.length,
      mergedPRs: mergedPRs.length,
      closedPRs: closedPRs.length,
      openPRs: openPRs.length,
      averageComments: Math.round(averageComments * 100) / 100,
    };
  }

  /**
   * Get PR metrics grouped by month.
   */
  async getMetricsByMonth(filters?: PRFilters): Promise<PRsByTimeframe[]> {
    const prs = await this.filterPRs(filters);

    // Group PRs by month
    const byMonth = new Map<string, PRDetails[]>();

    for (const pr of prs) {
      const createdDate = new Date(pr.createdAt);
      const monthKey = this.getMonthKey(createdDate);
      
      if (!byMonth.has(monthKey)) {
        byMonth.set(monthKey, []);
      }
      byMonth.get(monthKey)!.push(pr);
    }

    // Calculate metrics for each month
    const result: PRsByTimeframe[] = [];
    const months = Array.from(byMonth.keys()).sort();

    for (const month of months) {
      const monthPRs = byMonth.get(month) || [];
      const metrics = this.calculateTimeframeMetrics(month, monthPRs);
      result.push(metrics);
    }

    return result;
  }

  /**
   * Get PR metrics grouped by week.
   */
  async getMetricsByWeek(filters?: PRFilters): Promise<PRsByTimeframe[]> {
    const prs = await this.filterPRs(filters);

    // Group PRs by week (only merged PRs)
    const byWeek = new Map<string, PRDetails[]>();

    for (const pr of prs) {
      if (!pr.mergedAt) continue; // Only count merged PRs for weekly view

      const mergedDate = new Date(pr.mergedAt);
      const weekKey = this.getWeekKey(mergedDate);

      if (!byWeek.has(weekKey)) {
        byWeek.set(weekKey, []);
      }
      byWeek.get(weekKey)!.push(pr);
    }

    // Calculate metrics for each week
    const result: PRsByTimeframe[] = [];
    const weeks = Array.from(byWeek.keys()).sort();

    for (const week of weeks) {
      const weekPRs = byWeek.get(week) || [];
      const metrics = this.calculateTimeframeMetrics(week, weekPRs);
      result.push(metrics);
    }

    return result;
  }

  /**
   * Get summary statistics for each label.
   */
  async getLabelSummaries(filters?: PRFilters): Promise<LabelSummary[]> {
    const prs = await this.filterPRs(filters);

    const labelMap = new Map<string, PRDetails[]>();

    for (const pr of prs) {
      for (const label of pr.labels || []) {
        const labelKey = label.name.toLowerCase();
        if (!labelMap.has(labelKey)) {
          labelMap.set(labelKey, []);
        }
        labelMap.get(labelKey)!.push(pr);
      }
    }

    const result: LabelSummary[] = [];

    for (const [label, labelPRs] of labelMap.entries()) {
      const openDays = labelPRs.map(pr => this.calculateOpenDays(pr));
      const averageOpenDays =
        openDays.length > 0
          ? openDays.reduce((a, b) => a + b, 0) / openDays.length
          : 0;

      result.push({
        label,
        count: labelPRs.length,
        averageOpenDays: Math.round(averageOpenDays * 100) / 100,
      });
    }

    return result.sort((a, b) => b.count - a.count);
  }

  /**
   * Filter PRs by the provided criteria.
   */
  private async filterPRs(filters?: PRFilters): Promise<PRDetails[]> {
    const allPRs = await this.prRepository.loadAll();

    let result = allPRs;

    if (!filters) {
      return result;
    }

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      result = this.filterByDateRange(result, filters.startDate, filters.endDate);
    }

    // Filter by authors
    if (filters.authors && filters.authors.length > 0) {
      result = this.filterByAuthors(result, filters.authors);
    }

    // Filter by labels
    if (filters.labels && filters.labels.length > 0) {
      result = this.filterByLabels(result, filters.labels);
    }

    // Filter by state
    if (filters.state) {
      result = this.filterByState(result, filters.state);
    }

    return result;
  }

  private filterByDateRange(
    prs: PRDetails[],
    startDate?: string,
    endDate?: string
  ): PRDetails[] {
    if (!startDate && !endDate) {
      return prs;
    }

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    return prs.filter(pr => {
      const createdDate = new Date(pr.createdAt);
      if (start && createdDate < start) return false;
      if (end && createdDate > end) return false;
      return true;
    });
  }

  private filterByAuthors(
    prs: PRDetails[],
    authors: string[]
  ): PRDetails[] {
    const authorSet = new Set(authors.map(a => a.toLowerCase()));
    return prs.filter(pr =>
      authorSet.has(pr.author.login.toLowerCase())
    );
  }

  private filterByLabels(
    prs: PRDetails[],
    labels: string[]
  ): PRDetails[] {
    const labelSet = new Set(labels.map(l => l.toLowerCase()));
    return prs.filter(pr =>
      pr.labels.some(label =>
        labelSet.has(label.name.toLowerCase())
      )
    );
  }

  private filterByState(
    prs: PRDetails[],
    state: 'merged' | 'closed' | 'open'
  ): PRDetails[] {
    if (state === 'merged') {
      return prs.filter(pr => pr.mergedAt !== undefined);
    } else if (state === 'closed') {
      return prs.filter(pr => pr.closedAt !== undefined && !pr.mergedAt);
    } else if (state === 'open') {
      return prs.filter(pr => !pr.closedAt && !pr.mergedAt);
    }
    return prs;
  }

  private calculateOpenDays(pr: PRDetails): number {
    const created = new Date(pr.createdAt);
    const closed = pr.mergedAt
      ? new Date(pr.mergedAt)
      : pr.closedAt
      ? new Date(pr.closedAt)
      : new Date(); // Use current time if still open

    const diffMs = closed.getTime() - created.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24)); // Convert to days
  }

  private getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private getWeekKey(date: Date): string {
    // ISO week calculation
    const temp = new Date(date);
    const dayOfWeek = temp.getUTCDay();
    const diff = temp.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
    const firstDay = new Date(temp.setUTCDate(diff));

    const week = Math.ceil((firstDay.getTime() - new Date(firstDay.getUTCFullYear(), 0, 1).getTime()) / 604800000);
    const year = firstDay.getUTCFullYear();
    
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  private calculateTimeframeMetrics(
    period: string,
    prs: PRDetails[]
  ): PRsByTimeframe {
    const openDays = prs.map(pr => this.calculateOpenDays(pr));
    const averageOpenDays =
      openDays.length > 0
        ? openDays.reduce((a, b) => a + b, 0) / openDays.length
        : 0;

    const totalComments = prs.reduce((sum, pr) => sum + (pr.comments || 0), 0);
    const averageComments =
      prs.length > 0 ? totalComments / prs.length : 0;

    return {
      period,
      count: prs.length,
      averageOpenDays: Math.round(averageOpenDays * 100) / 100,
      averageComments: Math.round(averageComments * 100) / 100,
    };
  }
}
