import { describe, expect, it, vi } from 'vitest';
import { PullRequestsController } from '../src/controllers/pull-requests.controller';

const createController = (prs: any[] = [], prsService: any = {}) => {
  const pullRequestFiltersRepository = {
    loadOptions: vi.fn().mockResolvedValue({ authors: [], labels: [] }),
  };

  return new PullRequestsController(prsService as any, pullRequestFiltersRepository as any);
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

  describe('byAuthor', () => {
    it('uses the explicit top value when provided', async () => {
      const mockPrsService = {
        getByAuthor: vi.fn().mockResolvedValue([{ author: 'alice', count: 5 }]),
      };
      const controller = createController([], mockPrsService);

      const response = await controller.byAuthor(undefined, undefined, undefined, '3');

      expect(response.result).toEqual([{ author: 'alice', count: 5 }]);
      expect(mockPrsService.getByAuthor).toHaveBeenCalledWith(expect.anything(), 3);
    });

    it('defaults top to 10 when omitted', async () => {
      const mockPrsService = {
        getByAuthor: vi.fn().mockResolvedValue([]),
      };
      const controller = createController([], mockPrsService);

      await controller.byAuthor(undefined, undefined, undefined, undefined);

      expect(mockPrsService.getByAuthor).toHaveBeenCalledWith(expect.anything(), 10);
    });

    it('falls back to 10 when top is non-numeric', async () => {
      const mockPrsService = {
        getByAuthor: vi.fn().mockResolvedValue([]),
      };
      const controller = createController([], mockPrsService);

      await controller.byAuthor(undefined, undefined, undefined, 'not-a-number');

      expect(mockPrsService.getByAuthor).toHaveBeenCalledWith(expect.anything(), 10);
    });
  });

  describe('averageReviewTime', () => {
    it('uses the explicit top value when provided', async () => {
      const mockPrsService = {
        getAverageReviewTime: vi.fn().mockResolvedValue([{ author: 'bob', avg_days: 1.2 }]),
      };
      const controller = createController([], mockPrsService);

      const response = await controller.averageReviewTime(undefined, undefined, undefined, '4');

      expect(response.result).toEqual([{ author: 'bob', avg_days: 1.2 }]);
      expect(mockPrsService.getAverageReviewTime).toHaveBeenCalledWith(expect.anything(), 4);
    });

    it('defaults top to 10 when omitted', async () => {
      const mockPrsService = {
        getAverageReviewTime: vi.fn().mockResolvedValue([]),
      };
      const controller = createController([], mockPrsService);

      await controller.averageReviewTime(undefined, undefined, undefined, undefined);

      expect(mockPrsService.getAverageReviewTime).toHaveBeenCalledWith(expect.anything(), 10);
    });

    it('falls back to 10 when top is non-numeric', async () => {
      const mockPrsService = {
        getAverageReviewTime: vi.fn().mockResolvedValue([]),
      };
      const controller = createController([], mockPrsService);

      await controller.averageReviewTime(undefined, undefined, undefined, 'nope');

      expect(mockPrsService.getAverageReviewTime).toHaveBeenCalledWith(expect.anything(), 10);
    });
  });

  describe('averageComments', () => {
    it('returns avg_comments from service metrics', async () => {
      const mockPrsService = {
        getMetrics: vi.fn().mockResolvedValue({ averageComments: 3.5 }),
      };
      const controller = createController([], mockPrsService);

      const response = await controller.averageComments();

      expect(response).toEqual({ avg_comments: 3.5 });
      expect(mockPrsService.getMetrics).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('commentsByAuthor', () => {
    it('uses the explicit top value when provided', async () => {
      const mockPrsService = {
        getCommentsByAuthor: vi.fn().mockResolvedValue([{ author: 'carol', count: 7 }]),
      };
      const controller = createController([], mockPrsService);

      const response = await controller.commentsByAuthor(undefined, undefined, undefined, '5');

      expect(response.result).toEqual([{ author: 'carol', count: 7 }]);
      expect(mockPrsService.getCommentsByAuthor).toHaveBeenCalledWith(expect.anything(), 5);
    });

    it('defaults top to 10 when omitted', async () => {
      const mockPrsService = {
        getCommentsByAuthor: vi.fn().mockResolvedValue([]),
      };
      const controller = createController([], mockPrsService);

      await controller.commentsByAuthor(undefined, undefined, undefined, undefined);

      expect(mockPrsService.getCommentsByAuthor).toHaveBeenCalledWith(expect.anything(), 10);
    });

    it('falls back to 10 when top is non-numeric', async () => {
      const mockPrsService = {
        getCommentsByAuthor: vi.fn().mockResolvedValue([]),
      };
      const controller = createController([], mockPrsService);

      await controller.commentsByAuthor(undefined, undefined, undefined, 'bogus');

      expect(mockPrsService.getCommentsByAuthor).toHaveBeenCalledWith(expect.anything(), 10);
    });
  });

  describe('firstCommentTime', () => {
    it('uses the explicit top value when provided', async () => {
      const mockPrsService = {
        getFirstCommentTime: vi
          .fn()
          .mockResolvedValue([{ author: 'dave', avg_hours: 2.5, prs_with_comments: 4 }]),
      };
      const controller = createController([], mockPrsService);

      const response = await controller.firstCommentTime(undefined, undefined, undefined, '6');

      expect(response.result).toEqual([{ author: 'dave', avg_hours: 2.5, prs_with_comments: 4 }]);
      expect(mockPrsService.getFirstCommentTime).toHaveBeenCalledWith(expect.anything(), 6);
    });

    it('defaults top to 10 when omitted', async () => {
      const mockPrsService = {
        getFirstCommentTime: vi.fn().mockResolvedValue([]),
      };
      const controller = createController([], mockPrsService);

      await controller.firstCommentTime(undefined, undefined, undefined, undefined);

      expect(mockPrsService.getFirstCommentTime).toHaveBeenCalledWith(expect.anything(), 10);
    });

    it('falls back to 10 when top is non-numeric', async () => {
      const mockPrsService = {
        getFirstCommentTime: vi.fn().mockResolvedValue([]),
      };
      const controller = createController([], mockPrsService);

      await controller.firstCommentTime(undefined, undefined, undefined, 'NaN-ish');

      expect(mockPrsService.getFirstCommentTime).toHaveBeenCalledWith(expect.anything(), 10);
    });
  });

  describe('filterOptions', () => {
    it('delegates to pullRequestFiltersRepository.loadOptions without wrapping', async () => {
      const controller = createController([], {});

      const response = await controller.filterOptions();

      expect(response).toEqual({ authors: [], labels: [] });
    });
  });

  describe('toFilters mapping', () => {
    it('maps query params to PRFilters, renaming status to state', async () => {
      const mockPrsService = {
        getByAuthor: vi.fn().mockResolvedValue([]),
      };
      const controller = createController([], mockPrsService);

      await controller.byAuthor(
        undefined,
        undefined,
        'feature',
        '10',
        'alice,bob',
        'carol',
        'dave',
        'open'
      );

      expect(mockPrsService.getByAuthor).toHaveBeenCalledWith(
        expect.objectContaining({
          authors: 'alice,bob',
          excludeAuthors: 'carol',
          excludeCommenters: 'dave',
          labels: 'feature',
          state: 'open',
        }),
        10
      );
    });
  });
});
