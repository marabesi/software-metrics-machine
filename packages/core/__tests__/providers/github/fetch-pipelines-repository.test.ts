import { describe, expect, it, vi } from 'vitest';
import { PipelineGitHubRunBuilder } from '../../../src';
import { InMemoryRepository } from '../../../src/test/in-memory-repository';
import { IGithubWorkflowClient } from '../../../src';
import { WorkflowJsonResponse } from '../../../src/providers/github/github-response-types';
import { PipelinesFetchRepository } from '../../../src/providers/github/pipelines-fetch-repository';

describe('PipelinesRepository', () => {
  const configuration = {
    getPipelinePath: () => '/tmp',
  } as any;

  const pipelineRunRepository = new InMemoryRepository<WorkflowJsonResponse>();

  const createRepository = async (githubWorkflowClient: IGithubWorkflowClient) => {
    const repository = new PipelinesFetchRepository(
      configuration,
      githubWorkflowClient,
      pipelineRunRepository
    );

    return { repository };
  };

  const storeFetchedWorkflows = async (runs: WorkflowJsonResponse[]) => {
    await pipelineRunRepository.saveAll(runs);
  };

  it('should fetch workflow runs without date filters', async () => {
    const fetchWorkflowRunsPage = vi.fn().mockResolvedValueOnce({
      runs: [
        new PipelineGitHubRunBuilder()
          .id('run-1')
          .number('1')
          .name('CI')
          .status('completed')
          .createdAt('2026-05-10T00:00:00Z')
          .updatedAt('2026-05-10T00:05:00Z')
          .startedAt('2026-05-10T00:00:00Z')
          .branch('main')
          .path('.github/workflows/ci.yml')
          .build(),
      ],
      hasNext: false,
    });

    const githubWorkflowClient: IGithubWorkflowClient = {
      fetchWorkflows: vi.fn(),
      fetchWorkflowRunsPage,
    };

    const { repository } = await createRepository(githubWorkflowClient);
    await storeFetchedWorkflows([]);

    const workflows = await repository.fetchPipelines({ forceRefresh: true });

    expect(workflows).toHaveLength(1);
    expect(workflows[0].id).toBe('run-1');
    expect(fetchWorkflowRunsPage).toHaveBeenCalledTimes(1);
    expect(fetchWorkflowRunsPage).toHaveBeenCalledWith(1, 100, {
      created: undefined,
      rawFilters: undefined,
    });
  });

  it('should return cached workflows when force refresh is disabled', async () => {
    const cachedRuns = [
      new PipelineGitHubRunBuilder()
        .id('cached-run')
        .number('10')
        .name('CI')
        .status('completed')
        .createdAt('2026-05-01T00:00:00Z')
        .updatedAt('2026-05-01T00:05:00Z')
        .startedAt('2026-05-01T00:00:00Z')
        .branch('main')
        .path('.github/workflows/ci.yml')
        .build(),
    ];

    const fetchWorkflowRunsPage = vi.fn();

    const githubWorkflowClient: IGithubWorkflowClient = {
      fetchWorkflows: vi.fn(),
      fetchWorkflowRunsPage,
    };

    const { repository } = await createRepository(githubWorkflowClient);
    await storeFetchedWorkflows(cachedRuns);

    const workflows = await repository.fetchPipelines({});

    expect(workflows).toHaveLength(1);
    expect(workflows[0].id).toBe('cached-run');
    expect(fetchWorkflowRunsPage).not.toHaveBeenCalled();
  });

  it('should forward created and raw filters when fetching workflows', async () => {
    const fetchWorkflowRunsPage = vi.fn().mockResolvedValueOnce({
      runs: [
        new PipelineGitHubRunBuilder()
          .id('filtered-run')
          .number('2')
          .name('CI')
          .status('completed')
          .createdAt('2026-05-10T00:00:00Z')
          .updatedAt('2026-05-10T00:05:00Z')
          .startedAt('2026-05-10T00:00:00Z')
          .branch('main')
          .path('.github/workflows/ci.yml')
          .build(),
      ],
      hasNext: false,
    });

    const githubWorkflowClient: IGithubWorkflowClient = {
      fetchWorkflows: vi.fn(),
      fetchWorkflowRunsPage,
    };

    const { repository } = await createRepository(githubWorkflowClient);
    await storeFetchedWorkflows([]);

    const workflows = await repository.fetchPipelines({
      forceRefresh: true,
      startDate: '2026-05-05T00:00:00Z',
      endDate: '2026-05-15T00:00:00Z',
      rawFilters: 'status=success,branch=main',
    });

    expect(workflows).toHaveLength(1);
    expect(workflows[0].id).toBe('filtered-run');
    expect(fetchWorkflowRunsPage).toHaveBeenCalledTimes(1);
    expect(fetchWorkflowRunsPage).toHaveBeenCalledWith(1, 100, {
      created: '2026-05-05T00:00:00Z..2026-05-15T00:00:00Z',
      rawFilters: 'status=success,branch=main',
    });
  });

  it('should paginate workflows until hasNext is false', async () => {
    const fetchWorkflowRunsPage = vi
      .fn()
      .mockResolvedValueOnce({
        runs: [
          new PipelineGitHubRunBuilder()
            .id('run-1')
            .number('1')
            .name('CI')
            .status('completed')
            .createdAt('2026-05-10T00:00:00Z')
            .updatedAt('2026-05-10T00:05:00Z')
            .startedAt('2026-05-10T00:00:00Z')
            .branch('main')
            .path('.github/workflows/ci.yml')
            .build(),
        ],
        hasNext: true,
      })
      .mockResolvedValueOnce({
        runs: [
          new PipelineGitHubRunBuilder()
            .id('run-2')
            .number('2')
            .name('CI')
            .status('completed')
            .createdAt('2026-05-11T00:00:00Z')
            .updatedAt('2026-05-11T00:05:00Z')
            .startedAt('2026-05-11T00:00:00Z')
            .branch('main')
            .path('.github/workflows/ci.yml')
            .build(),
        ],
        hasNext: false,
      });

    const githubWorkflowClient: IGithubWorkflowClient = {
      fetchWorkflows: vi.fn(),
      fetchWorkflowRunsPage,
    };

    const { repository } = await createRepository(githubWorkflowClient);
    await storeFetchedWorkflows([]);

    const workflows = await repository.fetchPipelines({ forceRefresh: true });

    expect(workflows).toHaveLength(2);
    expect(workflows[0].id).toBe('run-1');
    expect(workflows[1].id).toBe('run-2');
    expect(fetchWorkflowRunsPage).toHaveBeenCalledTimes(2);
    expect(fetchWorkflowRunsPage).toHaveBeenNthCalledWith(1, 1, 100, {
      created: undefined,
      rawFilters: undefined,
    });
    expect(fetchWorkflowRunsPage).toHaveBeenNthCalledWith(2, 2, 100, {
      created: undefined,
      rawFilters: undefined,
    });
  });

  it('should stop pagination when GitHub returns 422 and keep fetched runs', async () => {
    const fetchWorkflowRunsPage = vi
      .fn()
      .mockResolvedValueOnce({
        runs: [
          new PipelineGitHubRunBuilder()
            .id('run-1')
            .number('1')
            .name('CI')
            .status('completed')
            .createdAt('2026-05-10T00:00:00Z')
            .updatedAt('2026-05-10T00:05:00Z')
            .startedAt('2026-05-10T00:00:00Z')
            .branch('main')
            .path('.github/workflows/ci.yml')
            .build(),
        ],
        hasNext: true,
      })
      .mockRejectedValueOnce({
        response: { status: 422 },
      });

    const githubWorkflowClient: IGithubWorkflowClient = {
      fetchWorkflows: vi.fn(),
      fetchWorkflowRunsPage,
    };

    const { repository } = await createRepository(githubWorkflowClient);
    await storeFetchedWorkflows([]);

    const workflows = await repository.fetchPipelines({ forceRefresh: true });

    expect(workflows).toHaveLength(1);
    expect(workflows[0].id).toBe('run-1');
    expect(fetchWorkflowRunsPage).toHaveBeenCalledTimes(2);
  });
});
