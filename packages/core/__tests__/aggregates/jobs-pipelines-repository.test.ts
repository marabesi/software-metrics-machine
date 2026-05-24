import { describe, expect, it, vi } from 'vitest';
import {
  IRepository,
  PipelineRun,
  PipelinesRepository,
  PipelineGitHubJobBuilder,
  PipelineGitHubRunBuilder,
  type IGithubWorkflowClient,
} from '../../src';
import { InMemoryRepository } from '../../src/test/in-memory-repository';
import {
  GitHubWorkflowFilters,
  GitHubWorkflowResponse,
} from '../../src/providers/github/github-workflow';
import {
  WorkflowJobJsonResponse,
  WorkflowJsonResponse,
} from '../../src/providers/github/github-response-types';

describe('Jobs PipelinesRepository', () => {
  const createRepository = async (githubWorkflowClient: IGithubWorkflowClient) => {
    const configuration = {
      getPipelinePath: () => '/tmp',
    } as any;

    const pipelineRunRepository = new InMemoryRepository<WorkflowJsonResponse>();
    const pipelineJobsRepository = new InMemoryRepository<WorkflowJobJsonResponse>();

    const repository = new PipelinesRepository(
      configuration,
      githubWorkflowClient,
      pipelineRunRepository,
      pipelineJobsRepository
    );

    return { repository, pipelineRunRepository, pipelineJobsRepository };
  };

  const createCachedWorkflows = async (
    pipelineRunRepository: IRepository<WorkflowJsonResponse>,
    runs: WorkflowJsonResponse[]
  ) => {
    await pipelineRunRepository.saveAll(runs);
  };

  it('should fetch jobs for workflows without date filters', async () => {
    const cachedRuns = [
      new PipelineGitHubRunBuilder()
        .id('run-1')
        .number('8888')
        .name('CI')
        .status('completed')
        .createdAt('2026-05-10T00:00:00Z')
        .updatedAt('2026-05-10T00:05:00Z')
        .startedAt('2026-05-10T00:00:00Z')
        .updatedAt('2026-05-10T00:05:00Z')
        .branch('main')
        .path('.github/workflows/ci.yml')
        .build(),
      new PipelineGitHubRunBuilder()
        .id('run-2')
        .number('9999')
        .name('CI')
        .status('completed')
        .createdAt('2026-05-11T00:00:00Z')
        .updatedAt('2026-05-11T00:05:00Z')
        .startedAt('2026-05-11T00:00:00Z')
        .updatedAt('2026-05-11T00:05:00Z')
        .branch('main')
        .path('.github/workflows/ci.yml')
        .build(),
    ];

    const fetchJobsPage = vi
      .fn()
      .mockResolvedValueOnce({
        jobs: [
          new PipelineGitHubJobBuilder()
            .id('job-1')
            .runId('run-1')
            .name('build')
            .startedAt('2026-05-10T00:01:00Z')
            .completedAt('2026-05-10T00:02:00Z')
            .status('completed')
            .conclusion('success')
            .build(),
        ],
        hasNext: false,
      })
      .mockResolvedValueOnce({
        jobs: [
          new PipelineGitHubJobBuilder()
            .id('job-2')
            .name('build')
            .runId('run-2')
            .startedAt('2026-05-11T00:01:00Z')
            .completedAt('2026-05-11T00:02:00Z')
            .status('completed')
            .conclusion('success')
            .build(),
        ],
        hasNext: false,
      });

    const githubWorkflowClient: IGithubWorkflowClient = {
      fetchWorkflowRunsPage(
        page: number,
        perPage?: number,
        options?: GitHubWorkflowFilters
      ): Promise<GitHubWorkflowResponse> {
        return Promise.resolve({ runs: [], hasNext: false });
      },
      fetchWorkflows(): Promise<any[]> {
        return Promise.resolve([]);
      },
      fetchJobsPage,
    };

    const { repository, pipelineRunRepository, pipelineJobsRepository } =
      await createRepository(githubWorkflowClient);

    await createCachedWorkflows(pipelineRunRepository, cachedRuns);

    const jobs = await repository.fetchJobs({});

    expect(jobs).toHaveLength(2);
    expect(jobs[0].run_id).toBe('run-1');
    expect(jobs[1].run_id).toBe('run-2');
    expect(fetchJobsPage).toHaveBeenCalledTimes(2);

    const expectedJob = new PipelineGitHubJobBuilder()
      .id('job-1')
      .runId('run-1')
      .name('build')
      .startedAt('2026-05-10T00:01:00Z')
      .completedAt('2026-05-10T00:02:00Z')
      .status('completed')
      .conclusion('success')
      .build();

    const persistedJobs = await pipelineJobsRepository.loadAll();

    expect(persistedJobs).toHaveLength(2);
    expect(persistedJobs[0]).toMatchObject(expectedJob);
  });

  it('should filter workflows by start date', async () => {
    const cachedRuns = [
      new PipelineGitHubRunBuilder()
        .id('run-old')
        .number('1')
        .name('CI')
        .status('completed')
        .createdAt('2026-05-05T00:00:00Z')
        .updatedAt('2026-05-05T00:05:00Z')
        .startedAt('2026-05-05T00:00:00Z')
        .updatedAt('2026-05-05T00:05:00Z')
        .branch('main')
        .path('.github/workflows/ci.yml')
        .build(),
      new PipelineGitHubRunBuilder()
        .id('run-new')
        .number('2')
        .name('CI')
        .status('completed')
        .createdAt('2026-05-15T00:00:00Z')
        .updatedAt('2026-05-15T00:05:00Z')
        .startedAt('2026-05-15T00:00:00Z')
        .updatedAt('2026-05-15T00:05:00Z')
        .branch('main')
        .path('.github/workflows/ci.yml')
        .build(),
    ];

    const fetchJobsPage = vi.fn().mockResolvedValueOnce({
      jobs: [
        new PipelineGitHubJobBuilder()
          .id('job-new')
          .name('build')
          .runId('run-new')
          .startedAt('2026-05-15T00:01:00Z')
          .completedAt('2026-05-15T00:02:00Z')
          .status('completed')
          .conclusion('success')
          .build(),
      ],
      hasNext: false,
    });

    const githubWorkflowClient: IGithubWorkflowClient = {
      fetchWorkflows(): Promise<any[]> {
        return Promise.resolve([]);
      },
      fetchWorkflowRunsPage: vi.fn(),
      fetchJobsPage,
    };

    const { repository, pipelineRunRepository } = await createRepository(githubWorkflowClient);

    await createCachedWorkflows(pipelineRunRepository, cachedRuns);

    const jobs = await repository.fetchJobs({
      startDate: '2026-05-10',
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].run_id).toBe('run-new');
    expect(fetchJobsPage).toHaveBeenCalledTimes(1);
  });

  it('should filter workflows by end date', async () => {
    const cachedRuns = [
      new PipelineGitHubRunBuilder()
        .id('run-early')
        .number('1')
        .name('CI')
        .status('completed')
        .createdAt('2026-05-05T00:00:00Z')
        .updatedAt('2026-05-05T00:05:00Z')
        .startedAt('2026-05-05T00:00:00Z')
        .updatedAt('2026-05-05T00:05:00Z')
        .branch('main')
        .path('.github/workflows/ci.yml')
        .build(),
      new PipelineGitHubRunBuilder()
        .id('run-late')
        .number('2')
        .name('CI')
        .status('completed')
        .createdAt('2026-05-20T00:00:00Z')
        .updatedAt('2026-05-20T00:05:00Z')
        .startedAt('2026-05-20T00:00:00Z')
        .updatedAt('2026-05-20T00:05:00Z')
        .branch('main')
        .path('.github/workflows/ci.yml')
        .build(),
    ];

    const fetchJobsPage = vi.fn().mockResolvedValueOnce({
      jobs: [
        new PipelineGitHubJobBuilder()
          .id('job-early')
          .name('build')
          .runId('run-early')
          .startedAt('2026-05-05T00:01:00Z')
          .completedAt('2026-05-05T00:02:00Z')
          .status('completed')
          .conclusion('success')
          .build(),
      ],
      hasNext: false,
    });

    const githubWorkflowClient: IGithubWorkflowClient = {
      fetchWorkflows(): Promise<any[]> {
        return Promise.resolve([]);
      },
      fetchWorkflowRunsPage: vi.fn(),
      fetchJobsPage,
    };

    const { repository, pipelineRunRepository } = await createRepository(githubWorkflowClient);

    await createCachedWorkflows(pipelineRunRepository, cachedRuns);

    const jobs = await repository.fetchJobs({
      endDate: '2026-05-15',
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].run_id).toBe('run-early');
    expect(fetchJobsPage).toHaveBeenCalledTimes(1);
  });

  it('should filter workflows by start and end date', async () => {
    const cachedRuns = [
      new PipelineGitHubRunBuilder()
        .id('run-early')
        .number('1')
        .name('CI')
        .status('completed')
        .createdAt('2026-05-05T00:00:00Z')
        .updatedAt('2026-05-05T00:05:00Z')
        .startedAt('2026-05-05T00:00:00Z')
        .updatedAt('2026-05-05T00:05:00Z')
        .branch('main')
        .path('.github/workflows/ci.yml')
        .build(),
      new PipelineGitHubRunBuilder()
        .id('run-late')
        .number('2')
        .name('CI')
        .status('completed')
        .createdAt('2026-05-20T00:00:00Z')
        .updatedAt('2026-05-20T00:05:00Z')
        .startedAt('2026-05-20T00:00:00Z')
        .updatedAt('2026-05-20T00:05:00Z')
        .branch('main')
        .path('.github/workflows/ci.yml')
        .build(),
    ];

    const fetchJobsPage = vi
      .fn()
      .mockResolvedValueOnce({
        jobs: [
          new PipelineGitHubJobBuilder()
            .id('job-early')
            .runId('run-early')
            .name('build')
            .startedAt('2026-05-05T00:01:00Z')
            .completedAt('2026-05-05T00:02:00Z')
            .status('completed')
            .conclusion('success')
            .build(),
        ],
        hasNext: false,
      })
      .mockResolvedValueOnce({
        jobs: [
          new PipelineGitHubJobBuilder()
            .id('job-late')
            .name('build')
            .runId('run-late')
            .startedAt('2026-05-20T00:01:00Z')
            .completedAt('2026-05-20T00:02:00Z')
            .status('completed')
            .conclusion('success')
            .build(),
        ],
        hasNext: false,
      });

    const githubWorkflowClient: IGithubWorkflowClient = {
      fetchWorkflows(options?: GitHubWorkflowFilters): Promise<PipelineRun[]> {
        return Promise.resolve([]);
      },
      fetchWorkflowRunsPage: vi.fn(),
      fetchJobsPage,
    };

    const { repository, pipelineRunRepository } = await createRepository(githubWorkflowClient);

    await createCachedWorkflows(pipelineRunRepository, cachedRuns);

    const jobs = await repository.fetchJobs({
      startDate: '2026-05-05',
      endDate: '2026-05-20',
    });

    expect(jobs).toHaveLength(2);
    expect(jobs[0].run_id).toBe('run-early');
  });

  it('should handle job pagination', async () => {
    const cachedRuns = [
      new PipelineGitHubRunBuilder()
        .id('run-1')
        .number('1')
        .name('CI')
        .status('completed')
        .createdAt('2026-05-10T00:00:00Z')
        .updatedAt('2026-05-10T00:05:00Z')
        .startedAt('2026-05-10T00:00:00Z')
        .updatedAt('2026-05-10T00:05:00Z')
        .branch('main')
        .path('.github/workflows/ci.yml')
        .build(),
    ];

    const fetchJobsPage = vi
      .fn()
      .mockResolvedValueOnce({
        jobs: [
          new PipelineGitHubJobBuilder()
            .id('job-1')
            .name('build')
            .startedAt('2026-05-10T00:01:00Z')
            .completedAt('2026-05-10T00:02:00Z')
            .status('completed')
            .conclusion('success')
            .build(),
        ],
        hasNext: true,
      })
      .mockResolvedValueOnce({
        jobs: [
          new PipelineGitHubJobBuilder()
            .id('job-2')
            .name('test')
            .startedAt('2026-05-10T00:03:00Z')
            .completedAt('2026-05-10T00:04:00Z')
            .status('completed')
            .conclusion('success')
            .build(),
        ],
        hasNext: false,
      });

    const githubWorkflowClient: IGithubWorkflowClient = {
      fetchWorkflows(): Promise<any[]> {
        return Promise.resolve([]);
      },
      fetchWorkflowRunsPage: vi.fn(),
      fetchJobsPage,
    };

    const { repository, pipelineRunRepository } = await createRepository(githubWorkflowClient);

    await createCachedWorkflows(pipelineRunRepository, cachedRuns);

    const jobs = await repository.fetchJobs({});

    expect(jobs).toHaveLength(2);
    expect(jobs[0].id).toBe('job-1');
    expect(jobs[1].id).toBe('job-2');
    expect(fetchJobsPage).toHaveBeenCalledTimes(2);
  });

  it('should apply raw filters when fetching jobs', async () => {
    const cachedRuns = [
      new PipelineGitHubRunBuilder()
        .id('run-1')
        .number('1')
        .name('CI')
        .status('completed')
        .createdAt('2026-05-10T00:00:00Z')
        .updatedAt('2026-05-10T00:05:00Z')
        .startedAt('2026-05-10T00:00:00Z')
        .updatedAt('2026-05-10T00:05:00Z')
        .branch('main')
        .path('.github/workflows/ci.yml')
        .build(),
    ];

    const fetchJobsPage = vi.fn().mockResolvedValueOnce({
      jobs: [
        new PipelineGitHubJobBuilder()
          .id('job-1')
          .name('build')
          .startedAt('2026-05-10T00:01:00Z')
          .completedAt('2026-05-10T00:02:00Z')
          .status('completed')
          .conclusion('success')
          .build(),
      ],
      hasNext: false,
    });

    const githubWorkflowClient: IGithubWorkflowClient = {
      fetchWorkflows(): Promise<any[]> {
        return Promise.resolve([]);
      },
      fetchWorkflowRunsPage: vi.fn(),
      fetchJobsPage,
    };

    const { repository, pipelineRunRepository } = await createRepository(githubWorkflowClient);

    await createCachedWorkflows(pipelineRunRepository, cachedRuns);

    const jobs = await repository.fetchJobs({
      rawFilters: 'status=success,conclusion=success',
    });

    expect(jobs).toHaveLength(1);
    expect(fetchJobsPage).toHaveBeenCalledWith('run-1', 1, 100, {
      rawFilters: 'status=success,conclusion=success',
    });
  });

  it('should handle empty cached workflows gracefully', async () => {
    const githubWorkflowClient: IGithubWorkflowClient = {
      fetchWorkflows(): Promise<any[]> {
        return Promise.resolve([]);
      },
      fetchWorkflowRunsPage: vi.fn(),
      fetchJobsPage: vi.fn(),
    };

    const { repository, pipelineRunRepository } = await createRepository(githubWorkflowClient);

    await createCachedWorkflows(pipelineRunRepository, []);
    const jobs = await repository.fetchJobs({});

    expect(jobs).toHaveLength(0);
  });
});
