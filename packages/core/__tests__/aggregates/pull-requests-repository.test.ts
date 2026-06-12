import { describe, expect, it, vi } from 'vitest';
import { PullRequestsRepository } from '../../src/aggregates/pull-requests-repository';

const createPullRequest = (overrides: Record<string, any> = {}) => ({
  id: '1',
  number: '1',
  title: 'Test PR',
  body: '',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  merged_at: '',
  closed_at: '',
  state: 'open',
  html_url: 'https://example.com/pulls/1',
  labels: [],
  user: {
    login: 'alice',
    id: 1,
  },
  ...overrides,
});

const createComment = (overrides: Record<string, any> = {}) => ({
  url: '',
  body: 'Looks good',
  pull_request_review_id: 1,
  id: 1,
  created_at: '2026-01-01T01:00:00Z',
  pull_request_url: 'https://api.github.com/repos/acme/app/pulls/1',
  user: {
    login: 'reviewer',
    id: 1,
  },
  reactions: {},
  ...overrides,
});

describe('PullRequestsRepository filters', () => {
  it('excludes PR authors from loaded results', async () => {
    const repository = new PullRequestsRepository(
      {
        loadAll: vi.fn().mockResolvedValue([
          createPullRequest({ id: '1', number: '1', user: { login: 'alice', id: 1 } }),
          createPullRequest({ id: '2', number: '2', user: { login: 'bot', id: 2 } }),
        ]),
      } as any,
      { loadAll: vi.fn().mockResolvedValue([]) } as any
    );

    const prs = await repository.loadPrsWithFilters({ excludeAuthors: ['bot'] });

    expect(prs.map((pr) => pr.author.login)).toEqual(['alice']);
  });

  it('excludes commenters from PR comments without removing the PR', async () => {
    const repository = new PullRequestsRepository(
      {
        loadAll: vi.fn().mockResolvedValue([createPullRequest()]),
      } as any,
      {
        loadAll: vi.fn().mockResolvedValue([
          createComment({ id: 1, user: { login: 'reviewer', id: 1 } }),
          createComment({ id: 2, user: { login: 'bot', id: 2 } }),
        ]),
      } as any
    );

    const prs = await repository.loadPrsWithFilters({ excludeCommenters: ['bot'] });

    expect(prs).toHaveLength(1);
    expect(prs[0].totalComments).toBe(1);
    expect(prs[0].comments.map((comment) => comment.author.login)).toEqual(['reviewer']);
  });
});
