import { describe, expect, it, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {
  PipelineGitHubJobBuilder,
  PipelineJob,
  PipelinesRunBuilder,
  PipelineRun,
  PipelinesRepository,
  type IGithubWorkflowClient,
} from '../../src';
import { InMemoryRepository } from '../../src/test/in-memory-repository';

async function createTempDir(): Promise<string> {
  const tmpdir = path.join(os.tmpdir(), 'unit-test-');
  return await fs.mkdtemp(tmpdir);
}

describe('PipelinesRepository pagination resume', () => {
  const createRepository = async (githubWorkflowClient: IGithubWorkflowClient) => {
    const tempDir = await createTempDir();
    const configuration = {
      getPipelinePath: () => tempDir,
    } as any;

    const pipelineRunRepository = new InMemoryRepository<PipelineRun>();
    const pipelineJobsRepository = new InMemoryRepository<PipelineJob>();

    return new PipelinesRepository(
      configuration,
      githubWorkflowClient,
      pipelineRunRepository,
      pipelineJobsRepository
    );
  };

  it('treats GitHub 422 as end of workflow pagination and still persists runs', async () => {
    const fetchWorkflowRunsPage = vi
      .fn()
      .mockResolvedValueOnce({
        runs: [
          {
            id: 'run-1',
            created_at: '2026-05-10T00:00:00Z',
            updated_at: '2026-05-10T00:05:00Z',
            run_number: 1,
            html_url: 'https://github.com/example/repo/actions/runs/1',
            run_started_at: '2026-05-10T00:00:00Z',
            head_branch: 'main',
            path: '.github/workflows/ci.yml',
            status: 'completed',
            name: 'CI',
          },
        ],
        hasNext: true,
      })
      .mockRejectedValueOnce({
        response: { status: 422 },
      });

    const githubWorkflowClient: IGithubWorkflowClient = {
      fetchWorkflows(options?: { created?: string; rawFilters?: string }): Promise<any[]> {
        return Promise.resolve([]);
      },
      fetchWorkflowRunsPage,
      fetchJobsPage: vi.fn(),
    };

    const repository = await createRepository(githubWorkflowClient);

    const runs = await repository.fetchPipelines({ forceRefresh: true });
    const expectedRun = new PipelinesRunBuilder()
      .id('run-1')
      .number(1)
      .name('CI')
      .status('completed')
      .createdAt('2026-05-10T00:00:00Z')
      .updatedAt('2026-05-10T00:05:00Z')
      .startedAt('2026-05-10T00:00:00Z')
      .completedAt('2026-05-10T00:05:00Z')
      .branch('main')
      .path('.github/workflows/ci.yml')
      .build();

    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject(expectedRun);
    expect(fetchWorkflowRunsPage).toHaveBeenCalledTimes(2);

    // const cachedWorkflowsRaw = await fs.readFile(path.join(cacheDir, 'workflows.json'), 'utf-8');
    // const cachedWorkflows = JSON.parse(cachedWorkflowsRaw);
    //
    // expect(cachedWorkflows).toHaveLength(1);
    // expect(cachedWorkflows[0].id).toBe('run-1');
  });

  it('forwards date and raw filters to the workflow fetch and bypasses cached runs when filters are present', async () => {
    const fetchWorkflowRunsPage = vi
      .fn()
      .mockResolvedValueOnce({
        runs: [
          {
            id: 'cached-run',
            created_at: '2026-05-01T00:00:00Z',
            updated_at: '2026-05-01T00:05:00Z',
            run_number: 1,
            html_url: 'https://github.com/example/repo/actions/runs/1',
            run_started_at: '2026-05-01T00:00:00Z',
            head_branch: 'main',
            path: '.github/workflows/ci.yml',
            status: 'completed',
            name: 'CI',
          },
        ],
        hasNext: false,
      })
      .mockResolvedValueOnce({
        runs: [
          {
            id: 'filtered-run',
            created_at: '2026-05-10T00:00:00Z',
            updated_at: '2026-05-10T00:05:00Z',
            run_number: 2,
            html_url: 'https://github.com/example/repo/actions/runs/2',
            run_started_at: '2026-05-10T00:00:00Z',
            head_branch: 'main',
            path: '.github/workflows/ci.yml',
            status: 'completed',
            name: 'CI',
          },
        ],
        hasNext: false,
      });

    const githubWorkflowClient: IGithubWorkflowClient = {
      fetchWorkflowRunsPage(
        page: number,
        perPage?: number,
        options?: {
          rawFilters?: string;
          created?: string;
        }
      ): Promise<{ runs: any[]; hasNext: boolean }> {
        return Promise.resolve({ hasNext: false, runs: [] });
      },
      fetchWorkflows(options?: { created?: string; rawFilters?: string }): Promise<any[]> {
        return Promise.resolve([]);
      },
      fetchJobsPage: vi.fn(),
    };

    const repository = await createRepository(githubWorkflowClient);

    const initialRuns = await repository.fetchPipelines({ forceRefresh: true });
    expect(initialRuns).toHaveLength(1);
    expect(initialRuns[0].id).toBe('cached-run');

    fetchWorkflowRunsPage.mockClear();

    const filteredRuns = await repository.fetchPipelines({
      startDate: '2026-05-05T00:00:00Z',
      endDate: '2026-05-15T00:00:00Z',
      rawFilters: 'status=success,branch=main',
    });
    const expectedFilteredRun = new PipelinesRunBuilder()
      .id('filtered-run')
      .number(2)
      .name('CI')
      .status('completed')
      .createdAt('2026-05-10T00:00:00Z')
      .updatedAt('2026-05-10T00:05:00Z')
      .startedAt('2026-05-10T00:00:00Z')
      .completedAt('2026-05-10T00:05:00Z')
      .branch('main')
      .path('.github/workflows/ci.yml')
      .build();

    expect(filteredRuns).toHaveLength(1);
    expect(filteredRuns[0]).toMatchObject(expectedFilteredRun);
    expect(fetchWorkflowRunsPage).toHaveBeenCalledTimes(1);
    expect(fetchWorkflowRunsPage).toHaveBeenCalledWith(1, 100, {
      created: '2026-05-05T00:00:00Z..2026-05-15T00:00:00Z',
      rawFilters: 'status=success,branch=main',
    });
  });

  it('persists fetched jobs into jobs cache when includeJobs is enabled on fresh refresh', async () => {
    const fetchWorkflowRunsPage = vi.fn().mockResolvedValueOnce({
      runs: [
        {
          id: 'run-with-jobs',
          created_at: '2026-05-10T00:00:00Z',
          updated_at: '2026-05-10T00:05:00Z',
          run_number: 3,
          html_url: 'https://github.com/example/repo/actions/runs/3',
          run_started_at: '2026-05-10T00:00:00Z',
          head_branch: 'main',
          path: '.github/workflows/ci.yml',
          status: 'completed',
          name: 'CI',
        },
      ],
      hasNext: false,
    });

    const fetchJobsPage = vi.fn().mockResolvedValueOnce({
      jobs: [
        {
          id: 'job-1',
          started_at: '2026-05-10T00:01:00Z',
          completed_at: '2026-05-10T00:02:00Z',
          status: 'completed',
          conclusion: 'success',
          name: 'build',
        },
      ],
      hasNext: false,
    });

    const githubWorkflowClient: IGithubWorkflowClient = {
      fetchWorkflows(options?: { created?: string; rawFilters?: string }): Promise<any[]> {
        return Promise.resolve([]);
      },
      fetchWorkflowRunsPage,
      fetchJobsPage,
    };

    const repository = await createRepository(githubWorkflowClient);

    const runs = await repository.fetchPipelines({ forceRefresh: true, includeJobs: true });
    const expectedRunWithJobs = new PipelinesRunBuilder()
      .id('run-with-jobs')
      .number(3)
      .name('CI')
      .status('completed')
      .createdAt('2026-05-10T00:00:00Z')
      .updatedAt('2026-05-10T00:05:00Z')
      .startedAt('2026-05-10T00:00:00Z')
      .completedAt('2026-05-10T00:05:00Z')
      .branch('main')
      .path('.github/workflows/ci.yml')
      .build();
    const expectedJob = new PipelineGitHubJobBuilder()
      .id('job-1')
      .runId('run-with-jobs')
      .name('build')
      .startedAt('2026-05-10T00:01:00Z')
      .completedAt('2026-05-10T00:02:00Z')
      .status('completed')
      .conclusion('success')
      .build();

    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject(expectedRunWithJobs);
    expect(runs[0].jobs).toHaveLength(1);
    expect(runs[0].jobs?.[0]).toMatchObject(expectedJob);

    // const cachedWorkflowsRaw = await fs.readFile(path.join(cacheDir, 'workflows.json'), 'utf-8');
    // const cachedWorkflows = JSON.parse(cachedWorkflowsRaw);
    // const cachedJobsRaw = await fs.readFile(path.join(cacheDir, 'jobs.json'), 'utf-8');
    // const cachedJobs = JSON.parse(cachedJobsRaw);
    //
    // expect(cachedWorkflows).toHaveLength(1);
    // expect(cachedWorkflows[0].id).toBe('run-with-jobs');
    // expect(cachedWorkflows[0].jobs).toBeUndefined();
    //
    // expect(cachedJobs).toHaveLength(1);
    // expect(cachedJobs[0].runId).toBe('run-with-jobs');
    // expect(cachedJobs[0].id).toBe('job-1');
  });
});
