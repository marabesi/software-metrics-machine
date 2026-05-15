import { Controller, Get, Logger, Query } from '@nestjs/common';
import {
  CodeMetricsRepository,
  Configuration,
  PipelinesRepository,
  PullRequestsRepository,
} from '@smmachine/core';
import * as fs from 'fs/promises';
import * as path from 'path';

type GenericRecord = Record<string, string | number | null>;

interface RunLike {
  path?: string;
  status?: string;
  conclusion?: string;
  branch?: string;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
  jobs?: Array<{ name?: string; status?: string; conclusion?: string; startedAt?: string; completedAt?: string }>;
  event?: string;
}

interface PRLike {
  title: string;
  createdAt: string;
  mergedAt?: string;
  closedAt?: string;
  comments?: number;
  author?: { login?: string };
  labels?: Array<{ name?: string }>;
}

@Controller()
export class DashboardController {
  private readonly logger = new Logger('DashboardController');

  constructor(
    private readonly codeRepo: CodeMetricsRepository,
    private readonly pipelinesRepo: PipelinesRepository,
    private readonly pullRequestsRepo: PullRequestsRepository,
    private readonly config: Configuration,
  ) {}

  @Get('/code/pairing-index')
  async pairingIndex(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('authors') authors?: string,
  ) {
    const selectedAuthors = this.parseCsvList(authors);
    const pairing = await this.codeRepo.getPairingIndex({
      startDate,
      endDate,
      selectedAuthors: selectedAuthors.length > 0 ? selectedAuthors : undefined,
    });

    return {
      pairing_index_percentage: pairing?.pairingIndexPercentage ?? 0,
      total_analyzed_commits: pairing?.totalAnalyzedCommits ?? 0,
      paired_commits: pairing?.pairedCommits ?? 0,
    };
  }

  @Get('/code/code-churn')
  async codeChurn(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('type_churn') typeChurn?: string,
  ) {
    const churn = await this.codeRepo.getCodeChurn({ startDate, endDate });
    const churnType = (typeChurn || 'total').toLowerCase();

    return (churn?.data || []).map((row: { date: string; added: number; deleted: number; commits: number }) => {
      const value =
        churnType === 'added'
          ? row.added
          : churnType === 'deleted'
          ? row.deleted
          : churnType === 'commits'
          ? row.commits
          : row.added + row.deleted;

      return {
        date: row.date,
        type: churnType,
        value,
      };
    });
  }

  @Get('/code/coupling')
  async coupling(
    @Query('ignore_files') ignoreFiles?: string,
    @Query('include_only') includeOnly?: string,
    @Query('top') top?: string,
  ) {
    const ignorePatterns = this.parseCsvList(ignoreFiles);
    const includePatterns = this.parseCsvList(includeOnly);
    const coupling = await this.codeRepo.getFileCoupling({
      ignorePatterns: ignorePatterns.length > 0 ? ignorePatterns : undefined,
    });

    const filtered = coupling
      .filter((row: { file1: string; file2: string; couplingStrength: number }) =>
        this.matchesIncludeOnly(row.file1, includePatterns) ||
        this.matchesIncludeOnly(row.file2, includePatterns) ||
        includePatterns.length === 0,
      )
      .sort((a: { couplingStrength: number }, b: { couplingStrength: number }) => b.couplingStrength - a.couplingStrength);

    const maxRows = top ? Number(top) : 20;
    return filtered.slice(0, Number.isFinite(maxRows) ? maxRows : 20).map((row: { file1: string; file2: string; couplingStrength: number }) => ({
      entity: row.file1,
      coupled: row.file2,
      degree: row.couplingStrength,
    }));
  }

  @Get('/code/entity-churn')
  async entityChurn(
    @Query('ignore_files') ignoreFiles?: string,
    @Query('include_only') includeOnly?: string,
    @Query('top') top?: string,
  ) {
    const rows = await this.readCsvRecords('entity-churn.csv');
    const filtered = this.filterEntities(rows, ignoreFiles, includeOnly)
      .map((row) => ({
        entity: String(row.entity || ''),
        added: this.toNumber(row.added),
        deleted: this.toNumber(row.deleted),
        commits: this.toNumber(row.commits),
      }))
      .sort((a, b) => b.added + b.deleted - (a.added + a.deleted));

    const maxRows = top ? Number(top) : 20;
    return filtered.slice(0, Number.isFinite(maxRows) ? maxRows : 20);
  }

  @Get('/code/entity-effort')
  async entityEffort(
    @Query('ignore_files') ignoreFiles?: string,
    @Query('include_only') includeOnly?: string,
    @Query('top') top?: string,
  ) {
    const rows = await this.readCsvRecords('entity-effort.csv');
    const filtered = this.filterEntities(rows, ignoreFiles, includeOnly)
      .map((row) => ({
        entity: String(row.entity || ''),
        'total-revs': this.toNumber(row['total-revs'] || row.total_revs || row.revs),
      }))
      .sort((a, b) => b['total-revs'] - a['total-revs']);

    const maxRows = top ? Number(top) : 30;
    return filtered.slice(0, Number.isFinite(maxRows) ? maxRows : 30);
  }

  @Get('/code/entity-ownership')
  async entityOwnership(
    @Query('ignore_files') ignoreFiles?: string,
    @Query('include_only') includeOnly?: string,
    @Query('authors') authors?: string,
    @Query('top') top?: string,
  ) {
    const authorFilter = new Set(this.parseCsvList(authors).map((author) => author.toLowerCase()));
    const rows = await this.readCsvRecords('entity-ownership.csv');

    const filtered = this.filterEntities(rows, ignoreFiles, includeOnly)
      .filter((row) => {
        if (authorFilter.size === 0) {
          return true;
        }
        const author = String(row.author || '').toLowerCase();
        return authorFilter.has(author);
      })
      .map((row) => ({
        entity: String(row.entity || ''),
        author: String(row.author || ''),
        added: this.toNumber(row.added),
        deleted: this.toNumber(row.deleted),
      }))
      .sort((a, b) => b.added + b.deleted - (a.added + a.deleted));

    const maxRows = top ? Number(top) : 100;
    return filtered.slice(0, Number.isFinite(maxRows) ? maxRows : 100);
  }

  @Get('/code/authors')
  async codeAuthors() {
    const rows = await this.readCsvRecords('entity-ownership.csv');
    return Array.from(
      new Set(rows.map((row) => String(row.author || '').trim()).filter((author) => author.length > 0)),
    ).sort();
  }

  @Get('/pipelines/by-status')
  async pipelinesByStatus(
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

  @Get('/pipelines/runs-duration')
  async pipelineRunsDuration(
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

  @Get('/pull-requests/summary')
  async pullRequestSummary(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('authors') authors?: string,
    @Query('labels') labels?: string,
  ) {
    const prs = await this.loadPRsWithFilters({ startDate, endDate, authors, labels });

    const merged = prs.filter((pr) => Boolean(pr.mergedAt)).length;
    const closed = prs.filter((pr) => Boolean(pr.closedAt) && !pr.mergedAt).length;
    const open = prs.filter((pr) => !pr.closedAt && !pr.mergedAt).length;
    const totalComments = prs.reduce((sum, pr) => sum + (pr.comments || 0), 0);
    const avgComments = prs.length > 0 ? totalComments / prs.length : 0;
    const authorsSet = new Set(prs.map((pr) => pr.author?.login || '').filter((name) => name.length > 0));
    const labelsSet = new Set(
      prs.flatMap((pr) => (pr.labels || []).map((label) => label.name || '').filter((name) => name.length > 0)),
    );

    const sorted = [...prs].sort((a, b) => this.toTimestamp(a.createdAt) - this.toTimestamp(b.createdAt));

    return {
      result: {
        total_prs: prs.length,
        merged_prs: merged,
        closed_prs: closed,
        open_prs: open,
        avg_comments_per_pr: avgComments,
        unique_authors: authorsSet.size,
        unique_labels: labelsSet.size,
        first_pr: sorted.length > 0 ? sorted[0] : null,
        last_pr: sorted.length > 0 ? sorted[sorted.length - 1] : null,
        top_themes: this.extractTopThemes(prs),
      },
    };
  }

  @Get('/pull-requests/through-time')
  async pullRequestThroughTime(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('authors') authors?: string,
    @Query('labels') labels?: string,
  ) {
    const prs = await this.loadPRsWithFilters({ startDate, endDate, authors, labels });
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
  async pullRequestsByAuthor(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('labels') labels?: string,
    @Query('top') top?: string,
    @Query('authors') authors?: string,
  ) {
    const prs = await this.loadPRsWithFilters({ startDate, endDate, authors, labels });
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
  ) {
    const prs = await this.loadPRsWithFilters({ startDate, endDate, authors, labels });
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
  ) {
    const mode = (aggregateBy || 'week').toLowerCase();
    const prs = await this.loadPRsWithFilters({ startDate, endDate, authors, labels });
    const grouped = new Map<string, number[]>();

    for (const pr of prs) {
      const period = mode === 'month' ? this.toMonthKey(pr.createdAt) : this.toWeekKey(pr.createdAt);
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
  ) {
    const prs = await this.loadPRsWithFilters({ startDate, endDate, authors, labels });
    const totalComments = prs.reduce((sum, pr) => sum + (pr.comments || 0), 0);
    const avgComments = prs.length > 0 ? totalComments / prs.length : 0;
    return { avg_comments: avgComments };
  }

  @Get('/pull-requests/authors')
  async pullRequestAuthors() {
    const prs = await this.pullRequestsRepo.refreshPRs();
    return Array.from(
      new Set(prs.map((pr: PRLike) => pr.author?.login || '').filter((name: string) => name.length > 0)),
    ).sort();
  }

  @Get('/pull-requests/labels')
  async pullRequestLabels() {
    const prs = await this.pullRequestsRepo.refreshPRs();
    return Array.from(
      new Set(
        prs.flatMap((pr: PRLike) => (pr.labels || []).map((label) => label.name || '').filter((name) => name.length > 0)),
      ),
    ).sort();
  }

  @Get('/configuration')
  configuration() {
    return {
      result: {
        git_provider: this.config.gitProvider,
        github_repository: this.config.githubRepository,
        git_repository_location: this.config.gitRepositoryLocation,
        store_data: this.config.storeData,
        deployment_frequency_target_pipeline: this.config.deploymentFrequencyTargetPipeline || null,
        deployment_frequency_target_job: this.config.deploymentFrequencyTargetJob || null,
        main_branch: this.config.mainBranch,
        dashboard_start_date: this.config.dashboardStartDate || null,
        dashboard_end_date: this.config.dashboardEndDate || null,
        dashboard_color: this.config.dashboardColor,
        logging_level: this.config.loggingLevel,
        jira_url: this.config.jiraUrl || null,
        jira_email: this.config.jiraEmail || null,
        jira_token: this.config.jiraToken || null,
        jira_project: this.config.jiraProject || null,
      },
    };
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

  private toNumber(value: string | number | null | undefined): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 0;
    }
    return 0;
  }

  private matchesIncludeOnly(entity: string, includePatterns: string[]): boolean {
    if (includePatterns.length === 0) {
      return true;
    }
    const normalized = entity.toLowerCase();
    return includePatterns.some((pattern) => normalized.includes(pattern.toLowerCase()));
  }

  private matchesIgnore(entity: string, ignorePatterns: string[]): boolean {
    if (ignorePatterns.length === 0) {
      return false;
    }
    const normalized = entity.toLowerCase();
    return ignorePatterns.some((pattern) => normalized.includes(pattern.toLowerCase()));
  }

  private async readCsvRecords(fileName: string): Promise<GenericRecord[]> {
    const csvPath = path.join(this.buildDataDirectories().codemaatDirectory, fileName);

    try {
      const content = await fs.readFile(csvPath, 'utf-8');
      const lines = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length < 2) {
        return [];
      }

      const header = lines[0].split(',').map((item) => item.trim().replace(/^"|"$/g, ''));
      const records: GenericRecord[] = [];

      for (let index = 1; index < lines.length; index += 1) {
        const row = lines[index].split(',').map((item) => item.trim().replace(/^"|"$/g, ''));
        if (row.length === 0) {
          continue;
        }

        const entry: GenericRecord = {};
        for (let col = 0; col < header.length; col += 1) {
          entry[header[col]] = row[col] ?? '';
        }
        records.push(entry);
      }

      return records;
    } catch (error) {
      this.logger.warn(`Failed to read CSV ${csvPath}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private filterEntities(rows: GenericRecord[], ignoreFiles?: string, includeOnly?: string): GenericRecord[] {
    const ignorePatterns = this.parseCsvList(ignoreFiles);
    const includePatterns = this.parseCsvList(includeOnly);

    return rows.filter((row) => {
      const entity = String(row.entity || '');
      if (!entity) {
        return false;
      }

      if (this.matchesIgnore(entity, ignorePatterns)) {
        return false;
      }

      if (!this.matchesIncludeOnly(entity, includePatterns)) {
        return false;
      }

      return true;
    });
  }

  private buildDataDirectories() {
    const baseDir = this.config.storeData || './outputs';
    const gitProvider = this.config.gitProvider || 'github';
    const repoSlug = (this.config.githubRepository || '').replace('/', '_');
    const dataDirectory = path.join(baseDir, `${gitProvider}_${repoSlug}`);

    return {
      gitProviderDirectory: path.join(dataDirectory, gitProvider),
      codemaatDirectory: path.join(dataDirectory, 'codemaat'),
    };
  }

  private async loadRunsWithFilters(options: {
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
    const runs = (await this.pipelinesRepo.refreshPipelines({
      startDate: options.startDate,
      endDate: options.endDate,
      includeJobs: options.includeJobs,
    })) as unknown as RunLike[];

    const statuses = new Set(this.parseCsvList(options.status).map((v) => v.toLowerCase()));
    const conclusions = new Set(this.parseCsvList(options.conclusion).map((v) => v.toLowerCase()));
    const branches = new Set(this.parseCsvList(options.branch).map((v) => v.toLowerCase()));
    const jobs = new Set(this.parseCsvList(options.jobName).map((v) => v.toLowerCase()));
    const events = new Set(this.parseCsvList(options.event).map((v) => v.toLowerCase()));

    return runs.filter((run) => {
      if (options.workflowPath && !(run.path || '').includes(options.workflowPath)) {
        return false;
      }

      if (statuses.size > 0 && !statuses.has((run.status || '').toLowerCase())) {
        return false;
      }

      if (conclusions.size > 0 && !conclusions.has((run.conclusion || '').toLowerCase())) {
        return false;
      }

      if (branches.size > 0 && !branches.has((run.branch || '').toLowerCase())) {
        return false;
      }

      if (events.size > 0 && !events.has((run.event || '').toLowerCase())) {
        return false;
      }

      if (jobs.size > 0) {
        const runJobNames = (run.jobs || []).map((job) => (job.name || '').toLowerCase());
        if (!runJobNames.some((name) => jobs.has(name))) {
          return false;
        }
      }

      return true;
    });
  }

  private async loadPRsWithFilters(options: {
    startDate?: string;
    endDate?: string;
    authors?: string;
    labels?: string;
  }): Promise<PRLike[]> {
    const prs = (await this.pullRequestsRepo.refreshPRs({
      startDate: options.startDate,
      endDate: options.endDate,
    })) as unknown as PRLike[];

    const authors = new Set(this.parseCsvList(options.authors).map((v) => v.toLowerCase()));
    const labels = new Set(this.parseCsvList(options.labels).map((v) => v.toLowerCase()));

    return prs.filter((pr) => {
      if (authors.size > 0) {
        const author = (pr.author?.login || '').toLowerCase();
        if (!authors.has(author)) {
          return false;
        }
      }

      if (labels.size > 0) {
        const names = (pr.labels || []).map((label) => (label.name || '').toLowerCase());
        if (!names.some((name) => labels.has(name))) {
          return false;
        }
      }

      return true;
    });
  }

  private toTimestamp(value?: string): number {
    if (!value) {
      return 0;
    }
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toDayKey(value: string): string {
    const date = new Date(value);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
      date.getUTCDate(),
    ).padStart(2, '0')}`;
  }

  private toMonthKey(value: string): string {
    const date = new Date(value);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private toWeekKey(value: string): string {
    const date = new Date(value);
    const temp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = temp.getUTCDay() || 7;
    temp.setUTCDate(temp.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${temp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  private getDurationMinutes(startedAt?: string, completedAt?: string): number | null {
    if (!startedAt || !completedAt) {
      return null;
    }

    const start = this.toTimestamp(startedAt);
    const end = this.toTimestamp(completedAt);
    if (start <= 0 || end <= 0 || end < start) {
      return null;
    }

    return (end - start) / (1000 * 60);
  }

  private extractTopThemes(prs: PRLike[]): Array<{ theme: string; count: number }> {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'of', 'to', 'for', 'in', 'on', 'with', 'by', 'from',
      'fix', 'feat', 'chore', 'refactor', 'docs', 'test', 'tests', 'merge', 'pull', 'request',
    ]);

    const frequencies = new Map<string, number>();

    for (const pr of prs) {
      const words = pr.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 2 && !stopWords.has(word));

      for (const word of words) {
        frequencies.set(word, (frequencies.get(word) || 0) + 1);
      }
    }

    return Array.from(frequencies.entries())
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}