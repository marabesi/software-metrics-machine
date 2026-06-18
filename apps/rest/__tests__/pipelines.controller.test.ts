import { describe, expect, it, vi } from 'vitest';
import { PipelinesController } from '../src/controllers/pipelines.controller';
import { PipelinesService } from '@smmachine/core';

describe('PipelinesController', () => {
  function createController(runs: unknown[]) {
    const pipelinesRepo = {
      loadPipelines: vi.fn().mockResolvedValue(runs),
    };
    const pipelinesService = new PipelinesService(pipelinesRepo as never);
    const controller = new PipelinesController(
      pipelinesRepo as never,
      pipelinesService,
      {} as never
    );

    return { controller, pipelinesRepo };
  }

  it('passes date filters to the repository for the runs-by chart', async () => {
    const { controller, pipelinesRepo } = createController([
      {
        path: 'ci.yml',
        createdAt: '2026-05-09T23:55:00Z',
        completedAt: '2026-05-10T00:05:00Z',
      },
      {
        path: 'ci.yml',
        createdAt: '2026-05-10T10:00:00Z',
        completedAt: '2026-05-10T10:30:00Z',
      },
    ]);

    const result = await controller.runsBy('day', {
      start_date: '2026-05-10',
      end_date: '2026-05-10',
    });

    expect(pipelinesRepo.loadPipelines).toHaveBeenCalledWith(
      expect.objectContaining({
        includeJobs: false,
        startDate: '2026-05-10',
        endDate: '2026-05-10',
      })
    );
    expect(result).toEqual([{ period: '2026-05-10', workflow: 'ci.yml', runs: 2 }]);
  });

  it('calculates run duration from jobs instead of stale workflow updated time', async () => {
    const { controller, pipelinesRepo } = createController([
      {
        path: 'ci.yml',
        createdAt: '2025-01-01T10:00:00Z',
        startedAt: '2025-01-01T10:00:00Z',
        completedAt: '2026-02-05T10:05:00Z',
        jobs: [
          {
            name: 'build',
            startedAt: '2025-01-01T10:01:00Z',
            completedAt: '2025-01-01T10:05:00Z',
          },
        ],
      },
    ]);

    const result = await controller.runsDuration(undefined, {});

    expect(pipelinesRepo.loadPipelines).toHaveBeenCalledWith(
      expect.objectContaining({ includeJobs: true })
    );
    expect(result).toEqual([
      {
        workflow: 'ci.yml',
        avg_duration: 4,
        min_duration: 4,
        max_duration: 4,
        total_runs: 1,
      },
    ]);
  });

});
