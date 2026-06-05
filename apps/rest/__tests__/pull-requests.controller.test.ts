import { describe, expect, it, vi } from 'vitest';
import { PullRequestsController } from '../src/controllers/pull-requests.controller';

describe('PullRequestsController summary labels', () => {
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

    const controller = new PullRequestsController({} as any, mockPrsService as any);

    const response = await controller.summary();

    expect(response.result.labels).toEqual([
      { label: 'dependencies', prs: 2 },
      { label: 'javascript', prs: 2 },
    ]);
  });
});
