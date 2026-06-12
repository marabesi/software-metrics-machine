import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  PullRequestsRepository,
  PRsService,
  PRDetails,
  PullRequestFiltersRepository,
} from '@smmachine/core';

@ApiTags('Pull Request Metrics')
@Controller()
export class PullRequestsController {
  constructor(
    private readonly pullRequestsRepo: PullRequestsRepository,
    private readonly prsService: PRsService,
    private readonly pullRequestFiltersRepository: PullRequestFiltersRepository
  ) {}

  @Get('/pull-requests/summary')
  async summary(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('authors') authors?: string,
    @Query('exclude_authors') excludeAuthors?: string,
    @Query('exclude_commenters') excludeCommenters?: string,
    @Query('labels') labels?: string,
    @Query('status') status?: PRDetails['state']
  ) {
    const realFilters = {
      startDate,
      endDate,
      authors: this.parseCsvList(authors),
      excludeAuthors: this.parseCsvList(excludeAuthors),
      excludeCommenters: this.parseCsvList(excludeCommenters),
      labels: this.parseCsvList(labels),
      state: status,
    };
    return this.prsService.getSummary(realFilters);
  }

  @Get('/pull-requests/through-time')
  async throughTime(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('aggregate_by') aggregateBy?: string,
    @Query('authors') authors?: string,
    @Query('exclude_authors') excludeAuthors?: string,
    @Query('exclude_commenters') excludeCommenters?: string,
    @Query('labels') labels?: string,
    @Query('status') status?: PRDetails['state']
  ) {
    const mode = this.normalizeAggregation(aggregateBy);
    const prs = await this.loadPRsWithFilters({
      startDate,
      endDate,
      authors,
      excludeAuthors,
      excludeCommenters,
      labels,
      status,
    });
    const counts = new Map<string, { Opened: number; Closed: number }>();

    for (const pr of prs) {
      const opened = this.toPeriodKey(pr.createdAt, mode);
      const current = counts.get(opened) || { Opened: 0, Closed: 0 };
      current.Opened += 1;
      counts.set(opened, current);

      const closedAt = pr.mergedAt || pr.closedAt;
      if (closedAt) {
        const closedDay = this.toPeriodKey(closedAt, mode);
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
    @Query('exclude_authors') excludeAuthors?: string,
    @Query('exclude_commenters') excludeCommenters?: string,
    @Query('status') status?: PRDetails['state']
  ) {
    const prs = await this.loadPRsWithFilters({
      startDate,
      endDate,
      authors,
      excludeAuthors,
      excludeCommenters,
      labels,
      status,
    });
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
    @Query('exclude_authors') excludeAuthors?: string,
    @Query('exclude_commenters') excludeCommenters?: string,
    @Query('status') status?: PRDetails['state']
  ) {
    const prs = await this.loadPRsWithFilters({
      startDate,
      endDate,
      authors,
      excludeAuthors,
      excludeCommenters,
      labels,
      status,
    });
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
    @Query('exclude_authors') excludeAuthors?: string,
    @Query('exclude_commenters') excludeCommenters?: string,
    @Query('status') status?: PRDetails['state']
  ) {
    const mode = this.normalizeAggregation(aggregateBy);
    const prs = await this.loadPRsWithFilters({
      startDate,
      endDate,
      authors,
      excludeAuthors,
      excludeCommenters,
      labels,
      status,
    });
    const grouped = new Map<string, number[]>();

    for (const pr of prs) {
      const period = this.toPeriodKey(pr.createdAt, mode);
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
    @Query('exclude_authors') excludeAuthors?: string,
    @Query('exclude_commenters') excludeCommenters?: string,
    @Query('status') status?: PRDetails['state']
  ) {
    const prs = await this.loadPRsWithFilters({
      startDate,
      endDate,
      authors,
      excludeAuthors,
      excludeCommenters,
      labels,
      status,
    });
    const totalComments = prs.reduce((sum, pr) => sum + (pr.totalComments || 0), 0);
    const avgComments = prs.length > 0 ? totalComments / prs.length : 0;
    return { avg_comments: avgComments };
  }

  @Get('/pull-requests/comments-by-author')
  async commentsByAuthor(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('labels') labels?: string,
    @Query('top') top?: string,
    @Query('authors') authors?: string,
    @Query('exclude_authors') excludeAuthors?: string,
    @Query('exclude_commenters') excludeCommenters?: string,
    @Query('status') status?: PRDetails['state']
  ) {
    const prs = await this.loadPRsWithFilters({
      startDate,
      endDate,
      authors,
      excludeAuthors,
      excludeCommenters,
      labels,
      status,
    });
    const grouped = new Map<string, number>();

    for (const pr of prs) {
      for (const comment of pr.comments || []) {
        const author = comment.author?.login || 'unknown';
        grouped.set(author, (grouped.get(author) || 0) + 1);
      }
    }

    const maxRows = top ? Number(top) : 10;
    const result = Array.from(grouped.entries())
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, Number.isFinite(maxRows) ? maxRows : 10);

    return { result };
  }

  @Get('/pull-requests/first-comment-time')
  async firstCommentTime(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('labels') labels?: string,
    @Query('top') top?: string,
    @Query('authors') authors?: string,
    @Query('exclude_authors') excludeAuthors?: string,
    @Query('exclude_commenters') excludeCommenters?: string,
    @Query('status') status?: PRDetails['state']
  ) {
    const prs = await this.loadPRsWithFilters({
      startDate,
      endDate,
      authors,
      excludeAuthors,
      excludeCommenters,
      labels,
      status,
    });
    const grouped = new Map<string, number[]>();

    for (const pr of prs) {
      if (!Array.isArray(pr.comments) || pr.comments.length === 0) {
        continue;
      }

      const firstComment = [...pr.comments]
        .filter((comment) => Boolean(comment.createdAt))
        .sort((a, b) => this.toTimestamp(a.createdAt) - this.toTimestamp(b.createdAt))[0];

      if (!firstComment) {
        continue;
      }

      const prOpenedAt = this.toTimestamp(pr.createdAt);
      const firstCommentAt = this.toTimestamp(firstComment.createdAt);
      if (prOpenedAt === 0 || firstCommentAt === 0 || firstCommentAt < prOpenedAt) {
        continue;
      }

      const author = pr.author?.login || 'unknown';
      const hours = (firstCommentAt - prOpenedAt) / (1000 * 60 * 60);
      const existing = grouped.get(author) || [];
      existing.push(hours);
      grouped.set(author, existing);
    }

    const maxRows = top ? Number(top) : 10;
    const result = Array.from(grouped.entries())
      .map(([author, values]) => ({
        author,
        avg_hours: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
        prs_with_comments: values.length,
      }))
      .sort((a, b) => b.avg_hours - a.avg_hours)
      .slice(0, Number.isFinite(maxRows) ? maxRows : 10);

    return { result };
  }

  @Get('/pull-requests/filter-options')
  async filterOptions() {
    return this.pullRequestFiltersRepository.loadOptions();
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

  private normalizeAggregation(aggregateBy?: string): 'day' | 'week' | 'month' {
    const mode = (aggregateBy || 'week').toLowerCase();
    return mode === 'day' || mode === 'month' ? mode : 'week';
  }

  private toPeriodKey(dateString: string | undefined, mode: 'day' | 'week' | 'month'): string {
    if (mode === 'day') {
      return this.toDayKey(dateString);
    }
    if (mode === 'month') {
      return this.toMonthKey(dateString);
    }
    return this.toWeekKey(dateString);
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
      (monday.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
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
    excludeAuthors?: string;
    excludeCommenters?: string;
    labels?: string;
    status?: PRDetails['state'];
  }): Promise<PRDetails[]> {
    const realFilters = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      authors: this.parseCsvList(filters.authors),
      excludeAuthors: this.parseCsvList(filters.excludeAuthors),
      excludeCommenters: this.parseCsvList(filters.excludeCommenters),
      labels: this.parseCsvList(filters.labels),
      state: filters.status,
    };
    return await this.pullRequestsRepo.loadPrsWithFilters(realFilters);
  }

  private parseCsvList(value?: string): string[] {
    return (value || '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
}
