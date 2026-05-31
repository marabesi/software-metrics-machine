import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PullRequestsRepository, PRsService, PRDetails } from '@smmachine/core';

@ApiTags('Pull Request Metrics')
@Controller()
export class PullRequestsController {
  constructor(
    private readonly pullRequestsRepo: PullRequestsRepository,
    private readonly prsService: PRsService,
  ) {}

  @Get('/pull-requests/summary')
  async summary(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('authors') authors?: string,
    @Query('labels') labels?: string,
    @Query('status') status?: PRDetails['state']
  ) {
    const realFilters = { startDate, endDate, authors: authors?.split(',') || [], labels: labels?.split(',') || [], state: status };
    return this.prsService.getSummary(realFilters);
  }

  @Get('/pull-requests/through-time')
  async throughTime(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('authors') authors?: string,
    @Query('labels') labels?: string,
    @Query('status') status?: PRDetails['state']
  ) {
    const prs = await this.loadPRsWithFilters({ startDate, endDate, authors, labels, status });
    const counts = new Map<string, { Opened: number; Closed: number }>();

    for (const pr of prs) {
      const opened = this.toDayKey(pr.createdAt);
      const current = counts.get(opened) || { Opened: 0, Closed: 0 };
      current.Opened += 1;
      counts.set(opened, current);

      const closedAt = pr.mergedAt || pr.closedAt;
      if (closedAt) {
        const closedDay = this.toDayKey(closedAt);
        const closedCurrent = counts.get(closedDay) || { Opened: 0, Closed: 0 };
        closedCurrent.Closed += 1;
        counts.set(closedDay, closedCurrent);
      }
    }

    const dates = Array.from(counts.keys()).sort();
    const rows: Array<{ date: string; kind: string; count: number }> = [];

    for (const date of dates) {
      const value = counts.get(date) || { Opened: 0, Closed: 0 };
      rows.push({ date, kind: 'Opened', count: value.Opened });
      rows.push({ date, kind: 'Closed', count: value.Closed });
    }

    return { result: rows };
  }

  @Get('/pull-requests/by-author')
  async byAuthor(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('labels') labels?: string,
    @Query('top') top?: string,
    @Query('authors') authors?: string,
    @Query('status') status?: PRDetails['state']
  ) {
    const prs = await this.loadPRsWithFilters({ startDate, endDate, authors, labels, status });
    const grouped = new Map<string, number>();

    for (const pr of prs) {
      const author = pr.author?.login || 'unknown';
      grouped.set(author, (grouped.get(author) || 0) + 1);
    }

    const maxRows = top ? Number(top) : 10;
    const result = Array.from(grouped.entries())
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, Number.isFinite(maxRows) ? maxRows : 10);

    return { result };
  }

  @Get('/pull-requests/average-review-time')
  async averageReviewTime(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('labels') labels?: string,
    @Query('top') top?: string,
    @Query('authors') authors?: string,
    @Query('status') status?: PRDetails['state']
  ) {
    const prs = await this.loadPRsWithFilters({ startDate, endDate, authors, labels, status });
    const merged = prs.filter((pr) => Boolean(pr.mergedAt) || Boolean(pr.closedAt));
    const grouped = new Map<string, number[]>();

    for (const pr of merged) {
      const start = this.toTimestamp(pr.createdAt);
      const end = this.toTimestamp(pr.mergedAt || pr.closedAt || pr.createdAt);
      const days = (end - start) / (1000 * 60 * 60 * 24);
      const author = pr.author?.login || 'unknown';
      const existing = grouped.get(author) || [];
      existing.push(days);
      grouped.set(author, existing);
    }

    const maxRows = top ? Number(top) : 10;
    const result = Array.from(grouped.entries())
      .map(([author, values]) => ({
        author,
        avg_days: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      }))
      .sort((a, b) => b.avg_days - a.avg_days)
      .slice(0, Number.isFinite(maxRows) ? maxRows : 10);

    return { result };
  }

  @Get('/pull-requests/average-open-by')
  async averageOpenBy(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('aggregate_by') aggregateBy?: string,
    @Query('labels') labels?: string,
    @Query('authors') authors?: string,
    @Query('status') status?: PRDetails['state']
  ) {
    const mode = (aggregateBy || 'week').toLowerCase();
    const prs = await this.loadPRsWithFilters({ startDate, endDate, authors, labels, status });
    const grouped = new Map<string, number[]>();

    for (const pr of prs) {
      const period =
        mode === 'month' ? this.toMonthKey(pr.createdAt) : this.toWeekKey(pr.createdAt);
      const start = this.toTimestamp(pr.createdAt);
      const end = this.toTimestamp(pr.mergedAt || pr.closedAt || pr.createdAt);
      const days = (end - start) / (1000 * 60 * 60 * 24);
      const existing = grouped.get(period) || [];
      existing.push(days);
      grouped.set(period, existing);
    }

    return Array.from(grouped.entries())
      .map(([period, values]) => ({
        period,
        avg_days: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  @Get('/pull-requests/average-comments')
  async averageComments(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('labels') labels?: string,
    @Query('authors') authors?: string,
    @Query('status') status?: PRDetails['state']
  ) {
    const prs = await this.loadPRsWithFilters({ startDate, endDate, authors, labels, status });
    const totalComments = prs.reduce((sum, pr) => sum + (pr.totalComments || 0), 0);
    const avgComments = prs.length > 0 ? totalComments / prs.length : 0;
    return { avg_comments: avgComments };
  }

  @Get('/pull-requests/authors')
  async authors() {
    const prs = await this.pullRequestsRepo.loadPrsWithFilters();
    return Array.from(
      new Set(
        prs.map((pr: PRDetails) => pr.author?.login || '').filter((name: string) => name.length > 0)
      )
    ).sort();
  }

  @Get('/pull-requests/labels')
  async labels() {
    const prs = await this.pullRequestsRepo.loadPrsWithFilters();
    return Array.from(
      new Set(
        prs.flatMap((pr: PRDetails) =>
          (pr.labels || []).map((label) => label.name || '').filter((name) => name.length > 0)
        )
      )
    ).sort();
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

  private toTimestamp(value?: string): number {
    if (!value) {
      return 0;
    }
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
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


  private async loadPRsWithFilters(filters: {
    startDate?: string;
    endDate?: string;
    authors?: string;
    labels?: string;
    status?: PRDetails['state'];
  }): Promise<PRDetails[]> {
    const realFilters = { startDate: filters.startDate, endDate: filters.endDate, authors: filters.authors?.split(',') || [], labels: filters.labels?.split(',') || [], state: filters.status };
    return await this.pullRequestsRepo.loadPrsWithFilters(realFilters);
  }
}
