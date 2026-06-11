import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PairingIndexService } from '../src';
import { PRsService } from '../src';
import { PipelinesService } from '../src';
import { CommitBuilder, PullRequestBuilder, PipelineRunBuilder } from './builders/builders';
import { IRepository } from '../src';
import { IReadPullRequestsRepository } from '../src/aggregates/pull-requests-repository';
import { IPipelinesRepository } from '../src/aggregates/pipelines-repository';
import { Commit } from '../src/domain-types';

describe('PairingIndexService', () => {
  let pairingService: PairingIndexService;
  let mockCommitRepo: IRepository<Commit>;

  beforeEach(() => {
    // Create mock repository
    mockCommitRepo = {
      save: vi.fn(),
      saveAll: vi.fn(),
      load: vi.fn(),
      loadAll: vi.fn(async () => {
        // Return test commits
        return [
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
        ];
      }),
      delete: vi.fn(),
      exists: vi.fn(),
    };

    pairingService = new PairingIndexService(mockCommitRepo);
  });

  it('should calculate pairing index correctly', async () => {
    const result = await pairingService.getPairingIndex();

    expect(result.totalAnalyzedCommits).toBeGreaterThan(0);
    expect(result.pairingIndexPercentage).toBeGreaterThanOrEqual(0);
    expect(result.pairingIndexPercentage).toBeLessThanOrEqual(100);
  });

  it('should return 0 for pairing index when no commits', async () => {
    mockCommitRepo.loadAll = vi.fn(async () => []);

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

    mockPrRepo = {
      loadPrsWithFilters: vi.fn(async () => prs),
    };

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

    mockPipelineRepo = {
      loadPipelines: vi.fn(async () => runs),
    };

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
    mockPipelineRepo.loadPipelines = vi.fn(async () => [
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
            runId: 'release-run',
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
            runId: 'mobile-run',
            name: 'deploy-mobile',
            status: 'completed',
            conclusion: 'success',
            startedAt: '2025-01-01T09:05:00Z',
            completedAt: '2025-01-01T09:15:00Z',
          },
        ],
      },
    ]);

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
});
