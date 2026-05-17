import { describe, expect, it, vi } from 'vitest';
import { PullRequestsController } from '../src/controllers/pull-requests.controller';

describe('PullRequestsController summary labels', () => {
  it('should return labels with number of PRs associated', async () => {
    const mockRepo = {
      refreshPRs: vi.fn().mockResolvedValue([
        {
          createdAt: '2026-01-01T10:00:00Z',
          labels: [{ name: 'dependencies' }, { name: 'javascript' }],
        },
        {
          createdAt: '2026-01-02T10:00:00Z',
          labels: [{ name: 'dependencies' }, { name: 'dependencies' }],
        },
        {
          createdAt: '2026-01-03T10:00:00Z',
          labels: [{ name: 'javascript' }],
        },
      ]),
    };

    const controller = new PullRequestsController(mockRepo as any, {} as any);

    const response = await controller.summary();

    expect(response.result.labels).toEqual([
      { label: 'dependencies', prs: 2 },
      { label: 'javascript', prs: 2 },
    ]);
  });
});
