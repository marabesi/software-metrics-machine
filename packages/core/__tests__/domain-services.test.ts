import { describe, it, expect, beforeEach } from 'vitest';
import { PairingIndexService } from '../src';
import { PRsService } from '../src';
import { PipelinesService } from '../src';
import {
  CommitBuilder,
  PullRequestBuilder,
  PipelineRunBuilder,
  RepositoryBuilder,
  ReadPullRequestsRepositoryBuilder,
  PipelinesRepositoryBuilder,
} from '../src/test/builders';
import { IRepository } from '../src';
import { IReadPullRequestsRepository } from '../src/aggregates/pull-requests-repository';
import { IPipelinesRepository } from '../src/aggregates/pipelines-repository';
import { Commit } from '../src/domain-types';
import { MockLoggerBuilder } from './mock-logger-builder';

const logger = new MockLoggerBuilder().build();

describe('PairingIndexService', () => {
  let pairingService: PairingIndexService;
  let mockCommitRepo: IRepository<Commit>;

  beforeEach(() => {
    mockCommitRepo = new RepositoryBuilder<Commit>()
      .withLoadAll([
        new CommitBuilder()
          .withAuthor('Alice')
          .withMessage('Add feature')
          .withTimestamp('2024-01-01T10:00:00Z')
          .withFiles([{ path: 'src/main.ts', additions: 10, deletions: 0, status: 'added' }])
          .build(),
        new CommitBuilder()
          .withAuthor('Bob')
          .withMessage('Fix bug')
          .withTimestamp('2024-01-02T10:00:00Z')
          .withFiles([{ path: 'src/utils.ts', additions: 5, deletions: 2, status: 'modified' }])
          .build(),
      ])
      .build();

    pairingService = new PairingIndexService(mockCommitRepo, undefined, logger);
  });

  it('should calculate pairing index correctly', async () => {
    const result = await pairingService.getPairingIndex();

    expect(result.totalAnalyzedCommits).toBeGreaterThan(0);
    expect(result.pairingIndexPercentage).toBeGreaterThanOrEqual(0);
    expect(result.pairingIndexPercentage).toBeLessThanOrEqual(100);
  });

  it('should return 0 for pairing index when no commits', async () => {
    pairingService = new PairingIndexService(
      new RepositoryBuilder<Commit>().withLoadAll([]).build(),
      undefined,
      logger
    );

    const result = await pairingService.getPairingIndex();

    expect(result.totalAnalyzedCommits).toBe(0);
    expect(result.pairingIndexPercentage).toBe(0);
  });

  it('should filter commits by author', async () => {
    const result = await pairingService.getPairingIndex({
      selectedAuthors: ['Alice'],
    });

    expect(result).toBeDefined();
    expect(typeof result.pairingIndexPercentage).toBe('number');
  });

  it('should filter commits by exclude authors', async () => {
    const result = await pairingService.getPairingIndex({
      excludeAuthors: 'Bob',
    });

    expect(result).toBeDefined();
    expect(result.totalAnalyzedCommits).toBeGreaterThanOrEqual(0);
  });

  it('should round pairing index to 2 decimal places', async () => {
    const result = await pairingService.getPairingIndex();

    const decimalPlaces = result.pairingIndexPercentage.toString().split('.')[1]?.length || 0;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });

  it('should filter commits by start date', async () => {
    const result = await pairingService.getPairingIndex({
      startDate: '2024-01-02',
    });

    expect(result.totalAnalyzedCommits).toBe(1);
  });

  it('should filter commits by end date', async () => {
    const result = await pairingService.getPairingIndex({
      endDate: '2024-01-01',
    });

    expect(result.totalAnalyzedCommits).toBe(1);
  });

  it('should filter commits by date range', async () => {
    const result = await pairingService.getPairingIndex({
      startDate: '2024-01-01',
      endDate: '2024-01-01',
    });

    expect(result.totalAnalyzedCommits).toBe(1);
  });

  it('should return 0 when start date is after all commits', async () => {
    const result = await pairingService.getPairingIndex({
      startDate: '2025-01-01',
    });

    expect(result.totalAnalyzedCommits).toBe(0);
  });

  it('should return 0 when end date is before all commits', async () => {
    const result = await pairingService.getPairingIndex({
      endDate: '2023-01-01',
    });

    expect(result.totalAnalyzedCommits).toBe(0);
  });
});

describe('PRsService', () => {
  let prsService: PRsService;
  let mockPrRepo: IReadPullRequestsRepository;

  beforeEach(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const prs = [
      new PullRequestBuilder()
        .withAuthor('Alice')
        .withTitle('Feature A')
        .withCreatedAt(oneWeekAgo.toISOString())
        .withMergedAt(twoDaysAgo.toISOString())
        .withComments(5)
        .withLabels([{ name: 'enhancement' }])
        .build(),
      new PullRequestBuilder()
        .withAuthor('Bob')
        .withTitle('Fix bug B')
        .withCreatedAt(new Date().toISOString())
        .withComments(2)
        .withLabels([{ name: 'bugfix' }])
        .build(),
    ];

    mockPrRepo = new ReadPullRequestsRepositoryBuilder().withPullRequests(prs).build();

    prsService = new PRsService(mockPrRepo, undefined, logger);
  });

  it('should calculate overall metrics', async () => {
    const metrics = await prsService.getMetrics();

    expect(metrics.totalPRs).toBeGreaterThan(0);
    expect(metrics.averageOpenDays).toBeGreaterThanOrEqual(0);
    expect(metrics.averageComments).toBeGreaterThanOrEqual(0);
    expect(metrics.mergedPRs).toBeGreaterThanOrEqual(0);
  });

  it('should calculate PR summary for CLI and REST consumers', async () => {
    const prs = [
      {
        id: 101,
        number: 1,
        title: 'First change',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        closedAt: '2025-01-02T00:00:00Z',
        author: { login: 'alice', id: 1 },
        labels: [{ name: 'bug' }],
        state: 'closed',
        url: 'https://example.test/pulls/1',
        totalComments: 1,
        comments: [
          {
            url: 'https://example.test/comments/1',
            body: 'github code review',
            pull_request_review_id: 1,
            id: 1,
            createdAt: '2025-01-01T02:00:00Z',
            author: { login: 'reviewer', id: 3 },
            reactions: {
              url: '',
              total_count: 0,
              '+1': 0,
              '-1': 0,
              laugh: 0,
              hooray: 0,
              confused: 0,
              heart: 0,
              rocket: 0,
              eyes: 0,
            },
          },
        ],
      },
      {
        id: 102,
        number: 2,
        title: 'Second change',
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
        mergedAt: '2025-01-04T00:00:00Z',
        closedAt: '2025-01-04T00:00:00Z',
        author: { login: 'bob', id: 2 },
        labels: [{ name: 'bug' }],
        state: 'merged',
        url: 'https://example.test/pulls/2',
        totalComments: 2,
        comments: [
          {
            url: 'https://example.test/comments/2',
            body: 'github code',
            pull_request_review_id: 2,
            id: 2,
            createdAt: '2025-01-03T04:00:00Z',
            author: { login: 'reviewer', id: 3 },
            reactions: {
              url: '',
              total_count: 0,
              '+1': 0,
              '-1': 0,
              laugh: 0,
              hooray: 0,
              confused: 0,
              heart: 0,
              rocket: 0,
              eyes: 0,
            },
          },
          {
            url: 'https://example.test/comments/3',
            body: 'code',
            pull_request_review_id: 3,
            id: 3,
            createdAt: '2025-01-03T05:00:00Z',
            author: { login: 'other-reviewer', id: 4 },
            reactions: {
              url: '',
              total_count: 0,
              '+1': 0,
              '-1': 0,
              laugh: 0,
              hooray: 0,
              confused: 0,
              heart: 0,
              rocket: 0,
              eyes: 0,
            },
          },
        ],
      },
    ];
    prsService = new PRsService(
      new ReadPullRequestsRepositoryBuilder().withPullRequests(prs).build(),
      undefined,
      logger
    );

    const summary = (await prsService.getSummary()).result;

    expect(summary.total_prs).toBe(2);
    expect(summary.merged_prs).toBe(1);
    expect(summary.closed_prs).toBe(2);
    expect(summary.prs_without_conclusion).toBe(1);
    expect(summary.avg_comments_per_pr).toBe(1.5);
    expect(summary.labels).toEqual([{ label: 'bug', prs: 2 }]);
    expect(summary.first_pr?.number).toBe(1);
    expect(summary.last_pr?.number).toBe(2);
    expect(summary.most_commented_pr).toMatchObject({ number: 2, comments: 2 });
    expect(summary.top_commenter).toEqual({ login: 'reviewer', comments: 2 });
    expect(summary.time_to_first_comment_hours).toMatchObject({
      average: 3,
      median: 3,
      min: 2,
      max: 4,
      prs_with_comment: 2,
      prs_without_comment: 0,
    });
  });

  it('should get metrics by month', async () => {
    const metrics = await prsService.getMetricsByMonth();

    expect(Array.isArray(metrics)).toBe(true);
    for (const month of metrics) {
      expect(month.period).toMatch(/^\d{4}-\d{2}$/); // YYYY-MM format
      expect(month.count).toBeGreaterThanOrEqual(0);
      expect(month.averageOpenDays).toBeGreaterThanOrEqual(0);
    }
  });

  it('should get metrics by week', async () => {
    const metrics = await prsService.getMetricsByWeek();

    expect(Array.isArray(metrics)).toBe(true);
    for (const week of metrics) {
      expect(week.period).toMatch(/^\d{4}-W\d{2}$/); // YYYY-Wxx format
      expect(week.count).toBeGreaterThanOrEqual(0);
    }
  });

  it('should get label summaries', async () => {
    const labels = await prsService.getLabelSummaries();

    expect(Array.isArray(labels)).toBe(true);
    for (const label of labels) {
      expect(label.label).toBeDefined();
      expect(label.count).toBeGreaterThan(0);
      expect(label.averageOpenDays).toBeGreaterThanOrEqual(0);
    }
  });

  it('should filter PRs by author', async () => {
    const metrics = await prsService.getMetrics({
      authors: ['Alice'],
    });

    expect(metrics).toBeDefined();
    expect(metrics.totalPRs).toBeGreaterThanOrEqual(0);
  });

  it('should filter PRs by state merged', async () => {
    const metrics = await prsService.getMetrics({
      state: 'merged',
    });

    expect(metrics.mergedPRs).toBeGreaterThanOrEqual(0);
  });

  describe('getMetrics', () => {
    it('should classify open, closed-not-merged, and merged PRs and apply the totalComments fallback', async () => {
      const openPr = { ...new PullRequestBuilder().withId(1).withTitle('Open PR').build() };
      const closedNotMergedPr = new PullRequestBuilder()
        .withId(2)
        .withTitle('Closed not merged')
        .withClosedAt('2025-01-05T00:00:00Z')
        .build();
      const mergedPr = new PullRequestBuilder()
        .withId(3)
        .withTitle('Merged PR')
        .withCreatedAt('2025-01-01T00:00:00Z')
        .withMergedAt('2025-01-02T00:00:00Z')
        .build();
      const prWithUndefinedTotalComments = {
        ...new PullRequestBuilder().withId(4).withTitle('No comments field').build(),
        totalComments: undefined,
      };

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder()
          .withPullRequests([openPr, closedNotMergedPr, mergedPr, prWithUndefinedTotalComments])
          .build(),
        undefined,
        logger
      );

      const metrics = await prsService.getMetrics();

      expect(metrics.openPRs).toBe(2);
      expect(metrics.closedPRs).toBe(1);
      expect(metrics.mergedPRs).toBe(1);
      expect(metrics.totalPRs).toBe(4);
      expect(metrics.averageComments).toBe(0);
    });

    it('should exclude PRs with zero or negative totalComments from most_commented_prs', async () => {
      const zeroComments = new PullRequestBuilder().withId(1).withTitle('Zero comments').build();
      const negativeComments = {
        ...new PullRequestBuilder().withId(2).withTitle('Negative comments').build(),
        totalComments: -1,
      };
      const withComments = new PullRequestBuilder()
        .withId(3)
        .withTitle('Has comments')
        .withComments(3)
        .build();

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder()
          .withPullRequests([zeroComments, negativeComments, withComments])
          .build(),
        undefined,
        logger
      );

      const metrics = await prsService.getMetrics();

      expect(metrics.most_commented_prs).toHaveLength(1);
      expect(metrics.most_commented_prs[0].pull_request_id).toBe(3);
    });

    it('should default averageOpenDays and averageComments to 0 for an empty PR list', async () => {
      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([]).build(),
        undefined,
        logger
      );

      const metrics = await prsService.getMetrics();

      expect(metrics.totalPRs).toBe(0);
      expect(metrics.averageOpenDays).toBe(0);
      expect(metrics.averageComments).toBe(0);
      expect(metrics.most_commented_prs).toEqual([]);
    });
  });

  describe('getMetricsByWeek', () => {
    it('should skip PRs with no mergedAt when grouping by week', async () => {
      const mergedPr = new PullRequestBuilder()
        .withId(1)
        .withTitle('Merged PR')
        .withCreatedAt('2025-01-01T00:00:00Z')
        .withMergedAt('2025-01-02T00:00:00Z')
        .build();
      const unmergedPr = new PullRequestBuilder()
        .withId(2)
        .withTitle('Unmerged PR')
        .withCreatedAt('2025-01-01T00:00:00Z')
        .build();

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([mergedPr, unmergedPr]).build(),
        undefined,
        logger
      );

      const weeks = await prsService.getMetricsByWeek();

      const totalCounted = weeks.reduce((sum, week) => sum + week.count, 0);
      expect(totalCounted).toBe(1);
    });
  });

  describe('getLabelSummaries', () => {
    it('should fall back to an empty label list when a PR has no labels', async () => {
      const noLabelsPr = {
        ...new PullRequestBuilder().withId(1).withTitle('No labels').build(),
        labels: undefined,
      };
      const labeledPr = new PullRequestBuilder()
        .withId(2)
        .withTitle('Labeled')
        .withLabels([{ name: 'bug' }])
        .build();

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([noLabelsPr, labeledPr]).build(),
        undefined,
        logger
      );

      const labels = await prsService.getLabelSummaries();

      expect(labels).toEqual([{ label: 'bug', count: 1, averageOpenDays: expect.any(Number) }]);
    });
  });

  describe('getSummary', () => {
    it('should exclude authorless PRs from the unique author count and use "unknown" for most_commented_pr/top_commenter', async () => {
      const authorlessPr = {
        ...new PullRequestBuilder()
          .withId(1)
          .withTitle('No author')
          .withComments(2)
          .build(),
        author: undefined,
      };

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([authorlessPr]).build(),
        undefined,
        logger
      );

      const summary = (await prsService.getSummary()).result;

      expect(summary.unique_authors).toBe(0);
      expect(summary.most_commented_pr?.author).toBe('unknown');
    });

    it('should exclude PRs missing id, title, or url from most_commented_prs', async () => {
      const missingId = {
        ...new PullRequestBuilder().withTitle('Missing id').withComments(5).build(),
        id: undefined,
      };
      const missingTitle = {
        ...new PullRequestBuilder().withId(2).withComments(4).build(),
        title: undefined,
      };
      const missingUrl = {
        ...new PullRequestBuilder().withId(3).withTitle('Missing url').withComments(3).build(),
        url: undefined,
      };
      const valid = new PullRequestBuilder()
        .withId(4)
        .withTitle('Valid PR')
        .withComments(1)
        .build();

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder()
          .withPullRequests([missingId, missingTitle, missingUrl, valid])
          .build(),
        undefined,
        logger
      );

      const summary = (await prsService.getSummary()).result;

      expect(summary.most_commented_prs).toHaveLength(1);
      expect(summary.most_commented_prs[0].pull_request_id).toBe(4);
    });

    it('should return null most_commented_pr when the top PR by sort has zero comments', async () => {
      const noComments = new PullRequestBuilder().withId(1).withTitle('No comments').build();

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([noComments]).build(),
        undefined,
        logger
      );

      const summary = (await prsService.getSummary()).result;

      expect(summary.most_commented_pr).toBeNull();
    });

    it('should return null first_pr, last_pr, and top_commenter for an empty PR list', async () => {
      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([]).build(),
        undefined,
        logger
      );

      const summary = (await prsService.getSummary()).result;

      expect(summary.first_pr).toBeNull();
      expect(summary.last_pr).toBeNull();
      expect(summary.top_commenter).toBeNull();
      expect(summary.most_commented_pr).toBeNull();
    });

    it('should break label-count ties alphabetically by label name', async () => {
      const prWithZebra = new PullRequestBuilder()
        .withId(1)
        .withTitle('Zebra labeled')
        .withLabels([{ name: 'zebra' }])
        .build();
      const prWithAlpha = new PullRequestBuilder()
        .withId(2)
        .withTitle('Alpha labeled')
        .withLabels([{ name: 'alpha' }])
        .build();

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([prWithZebra, prWithAlpha]).build(),
        undefined,
        logger
      );

      const summary = (await prsService.getSummary()).result;

      expect(summary.labels).toEqual([
        { label: 'alpha', prs: 1 },
        { label: 'zebra', prs: 1 },
      ]);
    });

    it('should break comment-count ties alphabetically by commenter login', async () => {
      const pr = {
        ...new PullRequestBuilder().withId(1).withTitle('Tied commenters').build(),
        comments: [
          { body: 'hi', author: { login: 'zoe', id: 1 } },
          { body: 'hi', author: { login: 'amy', id: 2 } },
        ],
      };

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([pr]).build(),
        undefined,
        logger
      );

      const summary = (await prsService.getSummary()).result;

      expect(summary.top_commenter).toEqual({ login: 'amy', comments: 1 });
    });
  });

  describe('getThroughTime', () => {
    it('should not record a Closed count for PRs with neither mergedAt nor closedAt', async () => {
      const openPr = new PullRequestBuilder()
        .withId(1)
        .withTitle('Still open')
        .withCreatedAt('2025-01-01T00:00:00Z')
        .build();

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([openPr]).build(),
        undefined,
        logger
      );

      const rows = await prsService.getThroughTime();

      const closedRow = rows.find((row) => row.kind === 'Closed');
      expect(closedRow?.count).toBe(0);
      const openedRow = rows.find((row) => row.kind === 'Opened');
      expect(openedRow?.count).toBe(1);
    });

    it('should default to week aggregation when aggregateBy is omitted', async () => {
      const pr = new PullRequestBuilder()
        .withId(1)
        .withTitle('PR')
        .withCreatedAt('2025-01-01T00:00:00Z')
        .build();

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([pr]).build(),
        undefined,
        logger
      );

      const rows = await prsService.getThroughTime();

      expect(rows[0].date).toMatch(/^\d{4}-W\d{2}$/);
    });

    it('should aggregate by day when aggregateBy is "day"', async () => {
      const pr = new PullRequestBuilder()
        .withId(1)
        .withTitle('PR')
        .withCreatedAt('2025-01-01T00:00:00Z')
        .build();

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([pr]).build(),
        undefined,
        logger
      );

      const rows = await prsService.getThroughTime(undefined, 'day');

      expect(rows[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should aggregate by month when aggregateBy is "month"', async () => {
      const pr = new PullRequestBuilder()
        .withId(1)
        .withTitle('PR')
        .withCreatedAt('2025-01-01T00:00:00Z')
        .build();

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([pr]).build(),
        undefined,
        logger
      );

      const rows = await prsService.getThroughTime(undefined, 'month');

      expect(rows[0].date).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should fall back to week aggregation for an invalid aggregateBy value', async () => {
      const pr = new PullRequestBuilder()
        .withId(1)
        .withTitle('PR')
        .withCreatedAt('2025-01-01T00:00:00Z')
        .build();

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([pr]).build(),
        undefined,
        logger
      );

      const rows = await prsService.getThroughTime(undefined, 'fortnight');

      expect(rows[0].date).toMatch(/^\d{4}-W\d{2}$/);
    });
  });

  describe('getByAuthor', () => {
    it('should group authorless PRs under "unknown"', async () => {
      const authorlessPr = {
        ...new PullRequestBuilder().withId(1).withTitle('No author').build(),
        author: undefined,
      };

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([authorlessPr]).build(),
        undefined,
        logger
      );

      const result = await prsService.getByAuthor();

      expect(result).toEqual([{ author: 'unknown', count: 1 }]);
    });

    it('should default to top 10 when top is omitted, and respect an explicit top value', async () => {
      const prs = Array.from({ length: 12 }, (_, i) =>
        new PullRequestBuilder().withId(i + 1).withTitle(`PR ${i}`).withAuthor(`author${i}`).build()
      );

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests(prs).build(),
        undefined,
        logger
      );

      const defaultTop = await prsService.getByAuthor();
      const explicitTop = await prsService.getByAuthor(undefined, 3);

      expect(defaultTop).toHaveLength(10);
      expect(explicitTop).toHaveLength(3);
    });
  });

  describe('getAverageReviewTime', () => {
    it('should use closedAt when mergedAt is absent, and mergedAt when both are present', async () => {
      const closedOnly = new PullRequestBuilder()
        .withId(1)
        .withTitle('Closed only')
        .withAuthor('alice')
        .withCreatedAt('2025-01-01T00:00:00Z')
        .withClosedAt('2025-01-03T00:00:00Z')
        .build();
      const mergedAndClosed = {
        ...new PullRequestBuilder()
          .withId(2)
          .withTitle('Merged and closed')
          .withAuthor('bob')
          .withCreatedAt('2025-01-01T00:00:00Z')
          .withMergedAt('2025-01-02T00:00:00Z')
          .build(),
        closedAt: '2025-01-05T00:00:00Z',
      };
      const authorless = {
        ...new PullRequestBuilder()
          .withId(3)
          .withTitle('Authorless')
          .withCreatedAt('2025-01-01T00:00:00Z')
          .withClosedAt('2025-01-02T00:00:00Z')
          .build(),
        author: undefined,
      };

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder()
          .withPullRequests([closedOnly, mergedAndClosed, authorless])
          .build(),
        undefined,
        logger
      );

      const result = await prsService.getAverageReviewTime();

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ author: 'alice', avg_days: 2 }),
          expect.objectContaining({ author: 'bob', avg_days: 1 }),
          expect.objectContaining({ author: 'unknown', avg_days: 1 }),
        ])
      );
    });

    it('should default to top 10 when top is omitted, and respect an explicit top value', async () => {
      const prs = Array.from({ length: 12 }, (_, i) =>
        new PullRequestBuilder()
          .withId(i + 1)
          .withTitle(`PR ${i}`)
          .withAuthor(`author${i}`)
          .withCreatedAt('2025-01-01T00:00:00Z')
          .withMergedAt('2025-01-02T00:00:00Z')
          .build()
      );

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests(prs).build(),
        undefined,
        logger
      );

      const defaultTop = await prsService.getAverageReviewTime();
      const explicitTop = await prsService.getAverageReviewTime(undefined, 3);

      expect(defaultTop).toHaveLength(10);
      expect(explicitTop).toHaveLength(3);
    });
  });

  describe('getAverageOpenBy', () => {
    it('should fall back to createdAt for the end timestamp when a PR has neither mergedAt nor closedAt', async () => {
      const stillOpenPr = new PullRequestBuilder()
        .withId(1)
        .withTitle('Still open')
        .withCreatedAt('2025-01-01T00:00:00Z')
        .build();

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([stillOpenPr]).build(),
        undefined,
        logger
      );

      const result = await prsService.getAverageOpenBy();

      expect(result).toEqual([{ period: expect.any(String), avg_days: 0 }]);
    });

    it('should use closedAt when mergedAt is absent', async () => {
      const closedOnly = new PullRequestBuilder()
        .withId(1)
        .withTitle('Closed only')
        .withCreatedAt('2025-01-01T00:00:00Z')
        .withClosedAt('2025-01-03T00:00:00Z')
        .build();

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([closedOnly]).build(),
        undefined,
        logger
      );

      const result = await prsService.getAverageOpenBy();

      expect(result).toEqual([{ period: expect.any(String), avg_days: 2 }]);
    });

    it('should aggregate by day when aggregateBy is "day"', async () => {
      const pr = new PullRequestBuilder()
        .withId(1)
        .withTitle('PR')
        .withCreatedAt('2025-01-01T00:00:00Z')
        .withMergedAt('2025-01-02T00:00:00Z')
        .build();

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([pr]).build(),
        undefined,
        logger
      );

      const result = await prsService.getAverageOpenBy(undefined, 'day');

      expect(result[0].period).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should sort multiple periods chronologically', async () => {
      const laterPr = new PullRequestBuilder()
        .withId(1)
        .withTitle('Later PR')
        .withCreatedAt('2025-02-01T00:00:00Z')
        .withMergedAt('2025-02-02T00:00:00Z')
        .build();
      const earlierPr = new PullRequestBuilder()
        .withId(2)
        .withTitle('Earlier PR')
        .withCreatedAt('2025-01-01T00:00:00Z')
        .withMergedAt('2025-01-02T00:00:00Z')
        .build();

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([laterPr, earlierPr]).build(),
        undefined,
        logger
      );

      const result = await prsService.getAverageOpenBy(undefined, 'month');

      expect(result.map((r) => r.period)).toEqual(['2025-01', '2025-02']);
    });
  });

  describe('extractTopThemes (via getSummary)', () => {
    it('should skip PRs with no comments and PRs whose comment bodies are empty/whitespace-only', async () => {
      const noCommentsPr = new PullRequestBuilder().withId(1).withTitle('No comments').build();
      const whitespaceOnlyPr = {
        ...new PullRequestBuilder().withId(2).withTitle('Whitespace only').build(),
        comments: [{ body: '   ' }, { body: '' }],
      };
      const meaningfulPr = {
        ...new PullRequestBuilder().withId(3).withTitle('Meaningful').build(),
        comments: [{ body: 'database migration database migration' }],
      };

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder()
          .withPullRequests([noCommentsPr, whitespaceOnlyPr, meaningfulPr])
          .build(),
        undefined,
        logger
      );

      const summary = (await prsService.getSummary()).result;

      expect(summary.top_themes).toEqual(
        expect.arrayContaining([{ text: 'database migration', value: 2 }])
      );
    });

    it('should exclude short words (<3 chars) and numeric-only tokens from themes', async () => {
      const pr = {
        ...new PullRequestBuilder().withId(1).withTitle('Short and numeric tokens').build(),
        comments: [{ body: 'ok 42 cache cache cache' }],
      };

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([pr]).build(),
        undefined,
        logger
      );

      const summary = (await prsService.getSummary()).result;

      expect(summary.top_themes).toEqual(
        expect.arrayContaining([{ text: 'cache', value: 3 }])
      );
      expect(summary.top_themes.some((theme) => theme.text.includes('ok'))).toBe(false);
      expect(summary.top_themes.some((theme) => theme.text.includes('42'))).toBe(false);
    });
  });

  describe('calculateFirstCommentTimeSummary (via getSummary)', () => {
    it('should ignore PRs with no comments and PRs whose comments all lack createdAt', async () => {
      const noCommentsPr = new PullRequestBuilder().withId(1).withTitle('No comments').build();
      const commentsWithoutCreatedAt = {
        ...new PullRequestBuilder().withId(2).withTitle('No createdAt on comments').build(),
        comments: [{ body: 'hi', createdAt: undefined }],
      };

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder()
          .withPullRequests([noCommentsPr, commentsWithoutCreatedAt])
          .build(),
        undefined,
        logger
      );

      const summary = (await prsService.getSummary()).result;

      expect(summary.time_to_first_comment_hours).toEqual({
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        prs_with_comment: 0,
        prs_without_comment: 2,
      });
    });

    it('should skip a PR whose first comment is timestamped before the PR was opened', async () => {
      const backdatedCommentPr = {
        ...new PullRequestBuilder()
          .withId(1)
          .withTitle('Backdated comment')
          .withCreatedAt('2025-01-05T00:00:00Z')
          .build(),
        comments: [{ body: 'too early', createdAt: '2025-01-01T00:00:00Z' }],
      };

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([backdatedCommentPr]).build(),
        undefined,
        logger
      );

      const summary = (await prsService.getSummary()).result;

      expect(summary.time_to_first_comment_hours.prs_with_comment).toBe(0);
      expect(summary.time_to_first_comment_hours.prs_without_comment).toBe(1);
    });

    it('should skip a PR with an empty createdAt (unparseable PR-opened timestamp)', async () => {
      const noCreatedAtPr = {
        ...new PullRequestBuilder().withId(1).withTitle('No createdAt').build(),
        createdAt: '',
        comments: [{ body: 'first', createdAt: '2025-01-01T01:00:00Z' }],
      };

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([noCreatedAtPr]).build(),
        undefined,
        logger
      );

      const summary = (await prsService.getSummary()).result;

      expect(summary.time_to_first_comment_hours.prs_with_comment).toBe(0);
      expect(summary.time_to_first_comment_hours.prs_without_comment).toBe(1);
    });

    it('should compute the odd-length median from a single PR with a comment', async () => {
      const pr = {
        ...new PullRequestBuilder()
          .withId(1)
          .withTitle('Single comment')
          .withCreatedAt('2025-01-01T00:00:00Z')
          .build(),
        comments: [{ body: 'first', createdAt: '2025-01-01T05:00:00Z' }],
      };

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([pr]).build(),
        undefined,
        logger
      );

      const summary = (await prsService.getSummary()).result;

      expect(summary.time_to_first_comment_hours).toMatchObject({
        average: 5,
        median: 5,
        min: 5,
        max: 5,
        prs_with_comment: 1,
        prs_without_comment: 0,
      });
    });

    it('should compute the even-length median from two PRs with comments', async () => {
      const prA = {
        ...new PullRequestBuilder()
          .withId(1)
          .withTitle('PR A')
          .withCreatedAt('2025-01-01T00:00:00Z')
          .build(),
        comments: [{ body: 'first', createdAt: '2025-01-01T02:00:00Z' }],
      };
      const prB = {
        ...new PullRequestBuilder()
          .withId(2)
          .withTitle('PR B')
          .withCreatedAt('2025-01-01T00:00:00Z')
          .build(),
        comments: [{ body: 'first', createdAt: '2025-01-01T08:00:00Z' }],
      };

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([prA, prB]).build(),
        undefined,
        logger
      );

      const summary = (await prsService.getSummary()).result;

      expect(summary.time_to_first_comment_hours).toMatchObject({
        average: 5,
        median: 5,
        min: 2,
        max: 8,
        prs_with_comment: 2,
        prs_without_comment: 0,
      });
    });

    it('should default average and median to 0 when zero PRs have comments', async () => {
      const pr = new PullRequestBuilder().withId(1).withTitle('No comments').build();

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([pr]).build(),
        undefined,
        logger
      );

      const summary = (await prsService.getSummary()).result;

      expect(summary.time_to_first_comment_hours.average).toBe(0);
      expect(summary.time_to_first_comment_hours.median).toBe(0);
    });
  });

  describe('getFirstCommentTime', () => {
    it('should ignore PRs with no comments and PRs whose comments all lack createdAt', async () => {
      const noCommentsPr = new PullRequestBuilder().withId(1).withTitle('No comments').build();
      const commentsWithoutCreatedAt = {
        ...new PullRequestBuilder().withId(2).withTitle('No createdAt').build(),
        comments: [{ body: 'hi', createdAt: undefined }],
      };

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder()
          .withPullRequests([noCommentsPr, commentsWithoutCreatedAt])
          .build(),
        undefined,
        logger
      );

      const result = await prsService.getFirstCommentTime();

      expect(result).toEqual([]);
    });

    it('should skip a PR whose first comment is timestamped before the PR was opened', async () => {
      const backdatedCommentPr = {
        ...new PullRequestBuilder()
          .withId(1)
          .withTitle('Backdated comment')
          .withAuthor('alice')
          .withCreatedAt('2025-01-05T00:00:00Z')
          .build(),
        comments: [{ body: 'too early', createdAt: '2025-01-01T00:00:00Z' }],
      };

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([backdatedCommentPr]).build(),
        undefined,
        logger
      );

      const result = await prsService.getFirstCommentTime();

      expect(result).toEqual([]);
    });

    it('should group by author and respect the default and explicit top values', async () => {
      const prs = Array.from({ length: 12 }, (_, i) => ({
        ...new PullRequestBuilder()
          .withId(i + 1)
          .withTitle(`PR ${i}`)
          .withAuthor(`author${i}`)
          .withCreatedAt('2025-01-01T00:00:00Z')
          .build(),
        comments: [{ body: 'first', createdAt: '2025-01-01T01:00:00Z' }],
      }));

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests(prs).build(),
        undefined,
        logger
      );

      const defaultTop = await prsService.getFirstCommentTime();
      const explicitTop = await prsService.getFirstCommentTime(undefined, 3);

      expect(defaultTop).toHaveLength(10);
      expect(explicitTop).toHaveLength(3);
      expect(defaultTop[0]).toMatchObject({ avg_hours: 1, prs_with_comments: 1 });
    });

    it('should use "unknown" for PRs with no author', async () => {
      const authorlessPr = {
        ...new PullRequestBuilder().withId(1).withTitle('No author').build(),
        author: undefined,
        comments: [{ body: 'first', createdAt: '2025-01-01T01:00:00Z' }],
        createdAt: '2025-01-01T00:00:00Z',
      };

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([authorlessPr]).build(),
        undefined,
        logger
      );

      const result = await prsService.getFirstCommentTime();

      expect(result).toEqual([{ author: 'unknown', avg_hours: 1, prs_with_comments: 1 }]);
    });

    it('should pick the earliest comment as first when a PR has multiple comments', async () => {
      const pr = {
        ...new PullRequestBuilder()
          .withId(1)
          .withTitle('Multiple comments')
          .withAuthor('alice')
          .withCreatedAt('2025-01-01T00:00:00Z')
          .build(),
        comments: [
          { body: 'later', createdAt: '2025-01-01T05:00:00Z' },
          { body: 'earlier', createdAt: '2025-01-01T01:00:00Z' },
        ],
      };

      prsService = new PRsService(
        new ReadPullRequestsRepositoryBuilder().withPullRequests([pr]).build(),
        undefined,
        logger
      );

      const result = await prsService.getFirstCommentTime();

      expect(result).toEqual([{ author: 'alice', avg_hours: 1, prs_with_comments: 1 }]);
    });
  });
});

describe('PipelinesService', () => {
  let pipelinesService: PipelinesService;
  let mockPipelineRepo: IPipelinesRepository;

  beforeEach(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const runs = [
      new PipelineRunBuilder()
        .withNumber(1)
        .withStatus('completed')
        .withConclusion('success')
        .withCreatedAt(oneWeekAgo.toISOString())
        .withStartedAt(oneWeekAgo.toISOString())
        .withCompletedAt(twoDaysAgo.toISOString())
        .withBranch('main')
        .build(),
      new PipelineRunBuilder()
        .withNumber(2)
        .withStatus('completed')
        .withConclusion('failure')
        .withCreatedAt(new Date().toISOString())
        .withStartedAt(new Date().toISOString())
        .withConclusion('failure')
        .build(),
    ];

    mockPipelineRepo = new PipelinesRepositoryBuilder().withPipelineRuns(runs).build();

    pipelinesService = new PipelinesService(mockPipelineRepo, undefined, logger);
  });

  it('should calculate overall metrics', async () => {
    const metrics = await pipelinesService.getMetrics();

    expect(metrics.totalRuns).toBeGreaterThan(0);
    expect(metrics.successfulRuns).toBeGreaterThanOrEqual(0);
    expect(metrics.failedRuns).toBeGreaterThanOrEqual(0);
    expect(metrics.successRate).toBeGreaterThanOrEqual(0);
    expect(metrics.successRate).toBeLessThanOrEqual(100);
  });

  it('should get deployment frequency by day', async () => {
    const freq = await pipelinesService.getDeploymentFrequency('day');

    expect(Array.isArray(freq)).toBe(true);
    for (const day of freq) {
      expect(day.period).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
      expect(day.count).toBeGreaterThanOrEqual(0);
    }
  });

  it('should get deployment frequency by week', async () => {
    const freq = await pipelinesService.getDeploymentFrequency('week');

    expect(Array.isArray(freq)).toBe(true);
    for (const week of freq) {
      expect(week.period).toMatch(/^\d{4}-W\d{2}$/); // YYYY-Wxx format
      expect(week.count).toBeGreaterThanOrEqual(0);
    }
  });

  it('should get deployment frequency by month', async () => {
    const freq = await pipelinesService.getDeploymentFrequency('month');

    expect(Array.isArray(freq)).toBe(true);
    for (const month of freq) {
      expect(month.period).toMatch(/^\d{4}-\d{2}$/); // YYYY-MM format
      expect(month.count).toBeGreaterThanOrEqual(0);
    }
  });

  it('should get job metrics', async () => {
    const jobMetrics = await pipelinesService.getJobMetrics();

    expect(Array.isArray(jobMetrics)).toBe(true);
    for (const job of jobMetrics) {
      expect(job.jobName).toBeDefined();
      expect(job.totalRuns).toBeGreaterThanOrEqual(0);
      expect(job.successRate).toBeGreaterThanOrEqual(0);
      expect(job.successRate).toBeLessThanOrEqual(100);
      expect(job.failureRate).toBeGreaterThanOrEqual(0);
      expect(job.failureRate).toBeLessThanOrEqual(100);
    }
  });

  it('should filter runs by branch', async () => {
    const metrics = await pipelinesService.getMetrics({
      targetBranch: 'main',
    });

    expect(metrics).toBeDefined();
    expect(metrics.totalRuns).toBeGreaterThanOrEqual(0);
  });

  it('should aggregate deployment frequency for configured workflow and job targets', async () => {
    const deployRuns: import('../src/domain-types').PipelineRun[] = [
      {
        id: 'release-run',
        number: 1,
        name: 'Release',
        status: 'completed',
        conclusion: 'success',
        createdAt: '2025-01-01T08:00:00Z',
        updatedAt: '2025-01-01T08:15:00Z',
        branch: 'main',
        path: '.github/workflows/release.yml',
        jobs: [
          {
            id: 'release-job',
            name: 'deploy-production',
            status: 'completed',
            conclusion: 'success',
            startedAt: '2025-01-01T08:05:00Z',
            completedAt: '2025-01-01T08:15:00Z',
          },
        ],
      },
      {
        id: 'mobile-run',
        number: 2,
        name: 'Mobile',
        status: 'completed',
        conclusion: 'success',
        createdAt: '2025-01-01T09:00:00Z',
        updatedAt: '2025-01-01T09:15:00Z',
        branch: 'main',
        path: '.github/workflows/mobile.yml',
        jobs: [
          {
            id: 'mobile-job',
            name: 'deploy-mobile',
            status: 'completed',
            conclusion: 'success',
            startedAt: '2025-01-01T09:05:00Z',
            completedAt: '2025-01-01T09:15:00Z',
          },
        ],
      },
    ];

    mockPipelineRepo = new PipelinesRepositoryBuilder().withPipelineRuns(deployRuns).build();

    pipelinesService = new PipelinesService(
      mockPipelineRepo,
      {
        getDeploymentFrequencyTargets: () => [
          { pipeline: '.github/workflows/release.yml', job: 'deploy-production' },
          { pipeline: '.github/workflows/mobile.yml', job: 'deploy-mobile' },
        ],
      } as any,
      logger
    );

    const frequency = await pipelinesService.getDeploymentFrequencyWithAllIntervals();

    expect(frequency).toHaveLength(2);
    expect(frequency).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          pipeline: '.github/workflows/release.yml',
          job: 'deploy-production',
          daily_counts: 1,
          weekly_counts: 1,
          monthly_counts: 1,
        }),
        expect.objectContaining({
          pipeline: '.github/workflows/mobile.yml',
          job: 'deploy-mobile',
          daily_counts: 1,
          weekly_counts: 1,
          monthly_counts: 1,
        }),
      ])
    );
  });

  describe('getRunDurationMinutes', () => {
    it('should compute duration from jobs when available', () => {
      const run = {
        startedAt: '2025-01-01T10:00:00Z',
        completedAt: '2025-01-01T20:00:00Z', // stale updated_at: 10 hours later
        jobs: [
          {
            startedAt: '2025-01-01T10:01:00Z',
            completedAt: '2025-01-01T10:05:00Z',
          },
        ],
      };

      const duration = pipelinesService.getRunDurationMinutes(run);

      // Should use job timestamps (4 minutes), not run-level (600 minutes)
      expect(duration).toBe(4);
    });

    it('should return null when no valid jobs exist', () => {
      const run = {
        startedAt: '2025-01-01T10:00:00Z',
        completedAt: '2026-02-05T10:05:00Z', // stale updated_at: ~570,000 minutes
        jobs: [],
      };

      const duration = pipelinesService.getRunDurationMinutes(run);

      // Should NOT fall back to stale run-level timestamps
      expect(duration).toBeNull();
    });

    it('should return null when jobs have invalid timestamps', () => {
      const run = {
        startedAt: '2025-01-01T10:00:00Z',
        completedAt: '2025-01-01T10:05:00Z',
        jobs: [
          {
            startedAt: '2025-01-01T10:01:00Z',
            completedAt: '', // invalid
          },
        ],
      };

      const duration = pipelinesService.getRunDurationMinutes(run);

      expect(duration).toBeNull();
    });

    it('should use the earliest job start and latest job end', () => {
      const run = {
        startedAt: '2025-01-01T10:00:00Z',
        completedAt: '2025-01-01T20:00:00Z',
        jobs: [
          {
            startedAt: '2025-01-01T10:02:00Z',
            completedAt: '2025-01-01T10:05:00Z',
          },
          {
            startedAt: '2025-01-01T10:01:00Z',
            completedAt: '2025-01-01T10:10:00Z',
          },
        ],
      };

      const duration = pipelinesService.getRunDurationMinutes(run);

      // earliest start: 10:01, latest end: 10:10 => 9 minutes
      expect(duration).toBe(9);
    });
  });

  describe('getMetrics average duration', () => {
    it('should exclude runs without jobs from average duration', async () => {
      const runs: import('../src/domain-types').PipelineRun[] = [
        {
          id: 'run-1',
          number: 1,
          name: 'Build',
          status: 'completed',
          conclusion: 'success',
          createdAt: '2025-01-01T08:00:00Z',
          updatedAt: '2025-01-01T08:15:00Z',
          startedAt: '2025-01-01T08:00:00Z',
          branch: 'main',
          path: '.github/workflows/build.yml',
          jobs: [
            {
              id: 'job-1',
              name: 'test',
              status: 'completed',
              conclusion: 'success',
              startedAt: '2025-01-01T08:01:00Z',
              completedAt: '2025-01-01T08:05:00Z', // 4 minutes
            },
          ],
        },
        {
          id: 'run-2',
          number: 2,
          name: 'Build',
          status: 'completed',
          conclusion: 'success',
          createdAt: '2025-01-01T09:00:00Z',
          updatedAt: '2026-06-01T09:00:00Z', // stale updated_at: ~570k minutes from startedAt
          startedAt: '2025-01-01T09:00:00Z',
          branch: 'main',
          path: '.github/workflows/build.yml',
          jobs: [], // no jobs - should be excluded
        },
      ];

      mockPipelineRepo = new PipelinesRepositoryBuilder().withPipelineRuns(runs).build();
      pipelinesService = new PipelinesService(mockPipelineRepo, undefined, logger);

      const metrics = await pipelinesService.getMetrics();

      // Average should be 4 minutes (only from run-1), not ~570k minutes
      expect(metrics.averageDurationMinutes).toBe(4);
    });
  });
});
