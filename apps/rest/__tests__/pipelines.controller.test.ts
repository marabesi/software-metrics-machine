import { describe, expect, it, vi } from 'vitest';
import { PipelinesController } from '../src/controllers/pipelines.controller';
import { PipelinesService } from '@smmachine/core';

describe('PipelinesController', () => {
  it('filters runs by the same completed day used by the runs-by chart', async () => {
    const pipelinesRepo = {
      loadPipelines: vi.fn().mockResolvedValue([
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
        {
          path: 'ci.yml',
          createdAt: '2026-05-10T23:55:00Z',
          completedAt: '2026-05-11T00:05:00Z',
        },
      ]),
    };
    const pipelinesService = new PipelinesService(pipelinesRepo as never);
    const controller = new PipelinesController(
      pipelinesRepo as never,
      {} as never,
      pipelinesService,
      {} as never
    );

    const result = await controller.runsBy('day', {
      start_date: '2026-05-10',
      end_date: '2026-05-10',
    });

    expect(result).toEqual([{ period: '2026-05-10', workflow: 'ci.yml', runs: 2 }]);
  });
});
