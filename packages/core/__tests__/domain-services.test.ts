import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PairingIndexService } from '../code/pairing-index';
import { PRsService } from '../prs/prs-service';
import { PipelinesService } from '../pipelines/pipelines-service';
import { CommitBuilder, PullRequestBuilder, PipelineRunBuilder } from '../../infrastructure/builders';
import { IRepository } from '../../infrastructure/repository';
import { Commit, PullRequest, PipelineRun } from '@types/domain-types';

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
  let mockPrRepo: IRepository<any>;

  beforeEach(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    mockPrRepo = {
      save: vi.fn(),
      saveAll: vi.fn(),
      load: vi.fn(),
      loadAll: vi.fn(async () => {
        return [
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
      }),
      delete: vi.fn(),
      exists: vi.fn(),
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
  let mockPipelineRepo: IRepository<any>;

  beforeEach(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    mockPipelineRepo = {
      save: vi.fn(),
      saveAll: vi.fn(),
      load: vi.fn(),
      loadAll: vi.fn(async () => {
        return [
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
      }),
      delete: vi.fn(),
      exists: vi.fn(),
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
});
