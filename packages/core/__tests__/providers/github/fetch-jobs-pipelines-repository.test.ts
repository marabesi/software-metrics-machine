import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PipelineGitHubJobBuilder, PipelineGitHubRunBuilder } from '../../../src';
import { InMemoryRepository } from '../../../src/test/in-memory-repository';
import { IGithubWorkflowJobClient } from '../../../src/providers/github/github-workflow';
import {
  WorkflowJobJsonResponse,
  WorkflowJsonResponse,
} from '../../../src/providers/github/github-response-types';
import { PipelinesJobFetchRepository } from '../../../src/providers/github/pipelines-job-fetch-repository';

describe('Fetch jobs pipeline repository', () => {
  const configuration = {
    getPathFromGitProvider: () => '/tmp',
  } as any;

  const pipelineRunRepository = new InMemoryRepository<WorkflowJsonResponse>();
  const pipelineJobsRepository = new InMemoryRepository<WorkflowJobJsonResponse>();

  beforeEach(async () => {
    await pipelineRunRepository.delete();
    await pipelineJobsRepository.delete();
  });

  const createRepository = async (githubWorkflowClient: IGithubWorkflowJobClient) => {
    const repository = new PipelinesJobFetchRepository(
      configuration,
      githubWorkflowClient,
      pipelineRunRepository,
      pipelineJobsRepository
    );

    return { repository };
  };

  const storeFetchedWorkflows = async (runs: WorkflowJsonResponse[]) => {
    await pipelineRunRepository.saveAll(runs);
  };

  it('should fetch jobs for workflows without date filters', async () => {
    const existingRuns = [
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

    const githubWorkflowClient: IGithubWorkflowJobClient = {
      fetchJobsPage,
    };

    const { repository } = await createRepository(githubWorkflowClient);

    await storeFetchedWorkflows(existingRuns);

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
    const existingRuns = [
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

    const githubWorkflowClient: IGithubWorkflowJobClient = {
      fetchJobsPage,
    };

    const { repository } = await createRepository(githubWorkflowClient);

    await storeFetchedWorkflows(existingRuns);

    const jobs = await repository.fetchJobs({
      startDate: '2026-05-10',
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].run_id).toBe('run-new');
    expect(fetchJobsPage).toHaveBeenCalledTimes(1);
  });

  it('should filter workflows by end date', async () => {
    const existingRuns = [
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

    const githubWorkflowClient: IGithubWorkflowJobClient = {
      fetchJobsPage,
    };

    const { repository } = await createRepository(githubWorkflowClient);

    await storeFetchedWorkflows(existingRuns);

    const jobs = await repository.fetchJobs({
      endDate: '2026-05-15',
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].run_id).toBe('run-early');
    expect(fetchJobsPage).toHaveBeenCalledTimes(1);
  });

  it('should filter workflows by start and end date', async () => {
    const existingRuns = [
      new PipelineGitHubRunBuilder()
        .id('run-early')
        .number('1')
        .name('CI')
        .status('completed')
        .createdAt('2026-05-05T01:00:00Z')
        .updatedAt('2026-05-05T00:05:00Z')
        .startedAt('2026-05-05T00:00:00Z')
        .updatedAt('2026-05-05T00:05:00Z')
        .branch('main')
        .path('.github/workflows/ci.yml')
        .build(),
    ];

    const githubWorkflowClient: IGithubWorkflowJobClient = {
      fetchJobsPage: vi.fn(() => {
        return Promise.resolve({ jobs: [], hasNext: false });
      }),
    };

    const { repository } = await createRepository(githubWorkflowClient);

    await storeFetchedWorkflows(existingRuns);

    await repository.fetchJobs({
      startDate: '2026-05-05',
      endDate: '2026-05-05',
    });

    expect(githubWorkflowClient.fetchJobsPage).toHaveBeenCalledWith('run-early', 1, 100, {
      rawFilters: undefined,
    });
  });

  it('should ignore workflows with empty created_at', async () => {
    const existingRuns = [
      {
        ...new PipelineGitHubRunBuilder()
          .id('invalid-run')
          .number('1')
          .name('CI')
          .status('completed')
          .createdAt('')
          .updatedAt('2026-05-05T00:05:00Z')
          .startedAt('2026-05-05T01:00:00Z')
          .branch('main')
          .path('.github/workflows/ci.yml')
          .build(),
      } as any,
      new PipelineGitHubRunBuilder()
        .id('valid-run')
        .number('2')
        .name('CI')
        .status('completed')
        .createdAt('2026-05-05T01:00:00Z')
        .updatedAt('2026-05-05T00:05:00Z')
        .startedAt('2026-05-05T01:00:00Z')
        .branch('main')
        .path('.github/workflows/ci.yml')
        .build(),
    ];

    const fetchJobsPage = vi.fn().mockResolvedValueOnce({
      jobs: [],
      hasNext: false,
    });

    const githubWorkflowClient: IGithubWorkflowJobClient = {
      fetchJobsPage,
    };

    const { repository } = await createRepository(githubWorkflowClient);

    await storeFetchedWorkflows(existingRuns);

    await repository.fetchJobs({
      startDate: '2026-05-05',
      endDate: '2026-05-05',
    });

    expect(fetchJobsPage).toHaveBeenCalledTimes(1);
    expect(fetchJobsPage).toHaveBeenCalledWith('valid-run', 1, 100, {
      rawFilters: undefined,
    });
  });

  it('should handle job pagination', async () => {
    const existingRuns = [
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

    const githubWorkflowClient: IGithubWorkflowJobClient = {
      fetchJobsPage,
    };

    const { repository } = await createRepository(githubWorkflowClient);

    await storeFetchedWorkflows(existingRuns);

    const jobs = await repository.fetchJobs({});

    expect(jobs).toHaveLength(2);
    expect(jobs[0].id).toBe('job-1');
    expect(jobs[1].id).toBe('job-2');
    expect(fetchJobsPage).toHaveBeenCalledTimes(2);
  });

  it('should apply raw filters when fetching jobs', async () => {
    const existingRuns = [
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

    const githubWorkflowClient: IGithubWorkflowJobClient = {
      fetchJobsPage,
    };

    const { repository } = await createRepository(githubWorkflowClient);

    await storeFetchedWorkflows(existingRuns);

    const jobs = await repository.fetchJobs({
      rawFilters: 'status=success,conclusion=success',
    });

    expect(jobs).toHaveLength(1);
    expect(fetchJobsPage).toHaveBeenCalledWith('run-1', 1, 100, {
      rawFilters: 'status=success,conclusion=success',
    });
  });

  it('should handle empty cached workflows gracefully', async () => {
    const githubWorkflowClient: IGithubWorkflowJobClient = {
      fetchJobsPage: vi.fn(),
    };

    const { repository } = await createRepository(githubWorkflowClient);

    await storeFetchedWorkflows([]);

    const jobs = await repository.fetchJobs({});

    expect(jobs).toHaveLength(0);
  });
});
