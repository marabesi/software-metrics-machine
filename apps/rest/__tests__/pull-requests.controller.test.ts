import { describe, expect, it, vi } from 'vitest';
import { PullRequestsController } from '../src/controllers/pull-requests.controller';

const createController = (prs: any[] = [], prsService: any = {}) => {
  const pullRequestFiltersRepository = {
    loadOptions: vi.fn().mockResolvedValue({ authors: [], labels: [] }),
  };

  return new PullRequestsController(
    prsService as any,
    pullRequestFiltersRepository as any
  );
};

describe('PullRequestsController', () => {
  it('should return labels with number of PRs associated', async () => {
    const mockPrsService = {
      getSummary: vi.fn().mockResolvedValue({
        result: {
          labels: [
            { label: 'dependencies', prs: 2 },
            { label: 'javascript', prs: 2 },
          ],
        },
      }),
    };

    const controller = createController([], mockPrsService);

    const response = await controller.summary();

    expect(response.result.labels).toEqual([
      { label: 'dependencies', prs: 2 },
      { label: 'javascript', prs: 2 },
    ]);
  });

  it('aggregates PRs through time by day', async () => {
    const mockPrsService = {
      getThroughTime: vi.fn().mockResolvedValue([
        { date: '2026-01-05', kind: 'Opened', count: 2 },
        { date: '2026-01-05', kind: 'Closed', count: 0 },
        { date: '2026-01-06', kind: 'Opened', count: 0 },
        { date: '2026-01-06', kind: 'Closed', count: 1 },
        { date: '2026-01-12', kind: 'Opened', count: 0 },
        { date: '2026-01-12', kind: 'Closed', count: 1 },
      ]),
    };

    const controller = createController([], mockPrsService);

    const response = await controller.throughTime(undefined, undefined, 'day');

    expect(response.result).toEqual([
      { date: '2026-01-05', kind: 'Opened', count: 2 },
      { date: '2026-01-05', kind: 'Closed', count: 0 },
      { date: '2026-01-06', kind: 'Opened', count: 0 },
      { date: '2026-01-06', kind: 'Closed', count: 1 },
      { date: '2026-01-12', kind: 'Opened', count: 0 },
      { date: '2026-01-12', kind: 'Closed', count: 1 },
    ]);
  });

  it('aggregates PRs through time by month', async () => {
    const mockPrsService = {
      getThroughTime: vi.fn().mockResolvedValue([
        { date: '2026-01', kind: 'Opened', count: 2 },
        { date: '2026-01', kind: 'Closed', count: 1 },
        { date: '2026-02', kind: 'Opened', count: 0 },
        { date: '2026-02', kind: 'Closed', count: 1 },
      ]),
    };

    const controller = createController([], mockPrsService);

    const response = await controller.throughTime(undefined, undefined, 'month');

    expect(response.result).toEqual([
      { date: '2026-01', kind: 'Opened', count: 2 },
      { date: '2026-01', kind: 'Closed', count: 1 },
      { date: '2026-02', kind: 'Opened', count: 0 },
      { date: '2026-02', kind: 'Closed', count: 1 },
    ]);
  });

  it('aggregates average open days by day', async () => {
    const mockPrsService = {
      getAverageOpenBy: vi.fn().mockResolvedValue([{ period: '2026-01-05', avg_days: 1.5 }]),
    };
    const controller = createController([], mockPrsService);

    const response = await controller.averageOpenBy(undefined, undefined, 'day');

    expect(response).toEqual([{ period: '2026-01-05', avg_days: 1.5 }]);
    expect(mockPrsService.getAverageOpenBy).toHaveBeenCalledWith(
      expect.objectContaining({ startDate: undefined, endDate: undefined }),
      'day'
    );
  });
});
