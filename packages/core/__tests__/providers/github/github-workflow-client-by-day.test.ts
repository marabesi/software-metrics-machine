import { describe, expect, it, vi } from 'vitest';
import { GithubWorkflowClient } from '../../../src/providers/github/github-workflow-client';
import { GitHubRateLimitManager } from '../../../src/providers/github/github-rate-limit-manager';
import { MockLoggerBuilder } from '../../mock-logger-builder';

describe('GithubWorkflowClient - Fetch workflows by day', () => {
  const token = 'test-token';
  const owner = 'test-owner';
  const repo = 'test-repo';
  const logger = new MockLoggerBuilder().build();

  it('should fetch workflows by day when byDay is true', async () => {
    const client = new GithubWorkflowClient(
      token,
      owner,
      repo,
      new GitHubRateLimitManager(logger),
      logger
    );

    const mockRuns1 = [
      {
        id: 1,
        run_number: '1',
        name: 'CI',
        status: 'completed',
        conclusion: 'success',
        created_at: '2026-05-10T10:00:00Z',
        updated_at: '2026-05-10T10:05:00Z',
        run_started_at: '2026-05-10T10:00:00Z',
        head_sha: 'abc123',
        head_branch: 'main',
        path: '.github/workflows/ci.yml',
      },
    ];

    const mockRuns2 = [
      {
        id: 2,
        run_number: '2',
        name: 'CI',
        status: 'completed',
        conclusion: 'success',
        created_at: '2026-05-11T10:00:00Z',
        updated_at: '2026-05-11T10:05:00Z',
        run_started_at: '2026-05-11T10:00:00Z',
        head_sha: 'def456',
        head_branch: 'main',
        path: '.github/workflows/ci.yml',
      },
    ];

    const fetchWorkflowRunsPageSpy = vi
      .spyOn(client, 'fetchWorkflowRunsPage')
      .mockImplementationOnce(() =>
        Promise.resolve({
          runs: mockRuns1,
          hasNext: false,
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          runs: mockRuns2,
          hasNext: false,
        })
      );

    const result = await client.fetchWorkflows({
      startDate: '2026-05-10T00:00:00Z',
      endDate: '2026-05-11T23:59:59Z',
      byDay: true,
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
    expect(fetchWorkflowRunsPageSpy).toHaveBeenCalledTimes(2);
  });

  it('should fetch all pages for each day before moving to next day', async () => {
    const client = new GithubWorkflowClient(token, owner, repo, new GitHubRateLimitManager(logger), logger);

    const mockPage1Day1 = [
      {
        id: 1,
        run_number: '1',
        name: 'CI',
        status: 'completed',
        conclusion: 'success',
        created_at: '2026-05-10T10:00:00Z',
        updated_at: '2026-05-10T10:05:00Z',
        run_started_at: '2026-05-10T10:00:00Z',
        head_sha: 'abc123',
        head_branch: 'main',
        path: '.github/workflows/ci.yml',
      },
    ];

    const mockPage2Day1 = [
      {
        id: 2,
        run_number: '2',
        name: 'CI',
        status: 'completed',
        conclusion: 'success',
        created_at: '2026-05-10T11:00:00Z',
        updated_at: '2026-05-10T11:05:00Z',
        run_started_at: '2026-05-10T11:00:00Z',
        head_sha: 'def456',
        head_branch: 'main',
        path: '.github/workflows/ci.yml',
      },
    ];

    const mockDay2 = [
      {
        id: 3,
        run_number: '3',
        name: 'CI',
        status: 'completed',
        conclusion: 'success',
        created_at: '2026-05-11T10:00:00Z',
        updated_at: '2026-05-11T10:05:00Z',
        run_started_at: '2026-05-11T10:00:00Z',
        head_sha: 'ghi789',
        head_branch: 'main',
        path: '.github/workflows/ci.yml',
      },
    ];

    const fetchWorkflowRunsPageSpy = vi
      .spyOn(client, 'fetchWorkflowRunsPage')
      .mockImplementationOnce(() =>
        Promise.resolve({
          runs: mockPage1Day1,
          hasNext: true,
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          runs: mockPage2Day1,
          hasNext: false,
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          runs: mockDay2,
          hasNext: false,
        })
      );

    const result = await client.fetchWorkflows({
      startDate: '2026-05-10T00:00:00Z',
      endDate: '2026-05-11T23:59:59Z',
      byDay: true,
    });

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
    expect(result[2].id).toBe(3);
    expect(fetchWorkflowRunsPageSpy).toHaveBeenCalledTimes(3);

    // Verify day separation
    const calls = fetchWorkflowRunsPageSpy.mock.calls;
    expect(calls[0][2]?.created).toContain('2026-05-10');
    expect(calls[1][2]?.created).toContain('2026-05-10');
    expect(calls[2][2]?.created).toContain('2026-05-11');
  });

  it('should use original behavior when byDay is false', async () => {
    const client = new GithubWorkflowClient(token, owner, repo, new GitHubRateLimitManager(logger), logger);

    const mockRuns = [
      {
        id: 1,
        run_number: '1',
        name: 'CI',
        status: 'completed',
        conclusion: 'success',
        created_at: '2026-05-10T10:00:00Z',
        updated_at: '2026-05-10T10:05:00Z',
        run_started_at: '2026-05-10T10:00:00Z',
        head_sha: 'abc123',
        head_branch: 'main',
        path: '.github/workflows/ci.yml',
      },
    ];

    const fetchWorkflowRunsPageSpy = vi
      .spyOn(client, 'fetchWorkflowRunsPage')
      .mockResolvedValueOnce({
        runs: mockRuns,
        hasNext: false,
      });

    const result = await client.fetchWorkflows({
      startDate: '2026-05-10T00:00:00Z',
      endDate: '2026-05-11T23:59:59Z',
      byDay: false,
    });

    expect(result).toHaveLength(1);
    // With byDay false, should make single request with range
    expect(fetchWorkflowRunsPageSpy).toHaveBeenCalledTimes(1);
    const params = fetchWorkflowRunsPageSpy.mock.calls[0][2];
    expect(params?.created).toContain('..');
  });

  it('should use original behavior when byDay is not provided', async () => {
    const client = new GithubWorkflowClient(token, owner, repo, new GitHubRateLimitManager(logger), logger);

    const mockRuns = [
      {
        id: 1,
        run_number: '1',
        name: 'CI',
        status: 'completed',
        conclusion: 'success',
        created_at: '2026-05-10T10:00:00Z',
        updated_at: '2026-05-10T10:05:00Z',
        run_started_at: '2026-05-10T10:00:00Z',
        head_sha: 'abc123',
        head_branch: 'main',
        path: '.github/workflows/ci.yml',
      },
    ];

    const fetchWorkflowRunsPageSpy = vi
      .spyOn(client, 'fetchWorkflowRunsPage')
      .mockResolvedValueOnce({
        runs: mockRuns,
        hasNext: false,
      });

    const result = await client.fetchWorkflows({
      startDate: '2026-05-10T00:00:00Z',
      endDate: '2026-05-11T23:59:59Z',
    });

    expect(result).toHaveLength(1);
    expect(fetchWorkflowRunsPageSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle single day with byDay flag', async () => {
    const client = new GithubWorkflowClient(token, owner, repo, new GitHubRateLimitManager(logger), logger);

    const mockRuns = [
      {
        id: 1,
        run_number: '1',
        name: 'CI',
        status: 'completed',
        conclusion: 'success',
        created_at: '2026-05-10T10:00:00Z',
        updated_at: '2026-05-10T10:05:00Z',
        run_started_at: '2026-05-10T10:00:00Z',
        head_sha: 'abc123',
        head_branch: 'main',
        path: '.github/workflows/ci.yml',
      },
    ];

    const fetchWorkflowRunsPageSpy = vi
      .spyOn(client, 'fetchWorkflowRunsPage')
      .mockResolvedValueOnce({
        runs: mockRuns,
        hasNext: false,
      });

    const result = await client.fetchWorkflows({
      startDate: '2026-05-10T00:00:00Z',
      endDate: '2026-05-10T23:59:59Z',
      byDay: true,
    });

    expect(result).toHaveLength(1);
    expect(fetchWorkflowRunsPageSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle raw filters with byDay', async () => {
    const client = new GithubWorkflowClient(token, owner, repo, new GitHubRateLimitManager(logger), logger);

    const mockRuns = [
      {
        id: 1,
        run_number: '1',
        name: 'CI',
        status: 'completed',
        conclusion: 'success',
        created_at: '2026-05-10T10:00:00Z',
        updated_at: '2026-05-10T10:05:00Z',
        run_started_at: '2026-05-10T10:00:00Z',
        head_sha: 'abc123',
        head_branch: 'main',
        path: '.github/workflows/ci.yml',
      },
    ];

    const fetchWorkflowRunsPageSpy = vi
      .spyOn(client, 'fetchWorkflowRunsPage')
      .mockResolvedValueOnce({
        runs: mockRuns,
        hasNext: false,
      })
      .mockResolvedValueOnce({
        runs: [],
        hasNext: false,
      });

    const result = await client.fetchWorkflows({
      startDate: '2026-05-10T00:00:00Z',
      endDate: '2026-05-11T23:59:59Z',
      rawFilters: 'status=success,branch=main',
      byDay: true,
    });

    expect(result).toHaveLength(1);
    expect(fetchWorkflowRunsPageSpy).toHaveBeenCalledTimes(2);

    const call1 = fetchWorkflowRunsPageSpy.mock.calls[0];
    expect(call1[2]?.rawFilters).toBe('status=success,branch=main');
    expect(call1[2]?.created).toContain('2026-05-10');

    const call2 = fetchWorkflowRunsPageSpy.mock.calls[1];
    expect(call2[2]?.rawFilters).toBe('status=success,branch=main');
    expect(call2[2]?.created).toContain('2026-05-11');
  });
});
