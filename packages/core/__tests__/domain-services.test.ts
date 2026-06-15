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
} from './builders/builders';
import { IRepository } from '../src';
import { IReadPullRequestsRepository } from '../src/aggregates/pull-requests-repository';
import { IPipelinesRepository } from '../src/aggregates/pipelines-repository';
import { Commit } from '../src/domain-types';

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

    pairingService = new PairingIndexService(mockCommitRepo);
  });

  it('should calculate pairing index correctly', async () => {
    const result = await pairingService.getPairingIndex();

    expect(result.totalAnalyzedCommits).toBeGreaterThan(0);
    expect(result.pairingIndexPercentage).toBeGreaterThanOrEqual(0);
    expect(result.pairingIndexPercentage).toBeLessThanOrEqual(100);
  });

  it('should return 0 for pairing index when no commits', async () => {
    pairingService = new PairingIndexService(
      new RepositoryBuilder<Commit>().withLoadAll([]).build()
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

    prsService = new PRsService(mockPrRepo);
  });

  it('should calculate overall metrics', async () => {
    const metrics = await prsService.getMetrics();

    expect(metrics.totalPRs).toBeGreaterThan(0);
    expect(metrics.averageOpenDays).toBeGreaterThanOrEqual(0);
    expect(metrics.averageComments).toBeGreaterThanOrEqual(0);
    expect(metrics.mergedPRs).toBeGreaterThanOrEqual(0);
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

    pipelinesService = new PipelinesService(mockPipelineRepo);
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

    pipelinesService = new PipelinesService(mockPipelineRepo, {
      getDeploymentFrequencyTargets: () => [
        { pipeline: '.github/workflows/release.yml', job: 'deploy-production' },
        { pipeline: '.github/workflows/mobile.yml', job: 'deploy-mobile' },
      ],
    } as any);

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
      pipelinesService = new PipelinesService(mockPipelineRepo);

      const metrics = await pipelinesService.getMetrics();

      // Average should be 4 minutes (only from run-1), not ~570k minutes
      expect(metrics.averageDurationMinutes).toBe(4);
    });
  });
});
