import { afterEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { PipelinesRepository, type IGithubWorkflowClient } from '../../src';

describe('PipelinesRepository pagination resume', () => {
  let cacheDir: string;

  afterEach(async () => {
    if (cacheDir) {
      await fs.rm(cacheDir, { recursive: true, force: true });
    }
  });

  it('treats GitHub 422 as end of workflow pagination and still persists runs', async () => {
    cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smm-workflows-'));

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
      fetchWorkflowRuns: vi.fn(),
      fetchWorkflowRunsPage,
      fetchJobs: vi.fn(),
      fetchJobsPage: vi.fn(),
    };

    const repository = new PipelinesRepository(githubWorkflowClient, cacheDir);

    const runs = await repository.refreshPipelines({ forceRefresh: true });

    expect(runs).toHaveLength(1);
    expect(runs[0].id).toBe('run-1');
    expect(fetchWorkflowRunsPage).toHaveBeenCalledTimes(2);

    const cachedWorkflowsRaw = await fs.readFile(path.join(cacheDir, 'workflows.json'), 'utf-8');
    const cachedWorkflows = JSON.parse(cachedWorkflowsRaw);

    expect(cachedWorkflows).toHaveLength(1);
    expect(cachedWorkflows[0].id).toBe('run-1');
  });
});
