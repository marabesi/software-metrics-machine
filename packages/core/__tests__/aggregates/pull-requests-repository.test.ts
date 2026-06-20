import { describe, expect, it, vi } from 'vitest';
import { PullRequestsRepository } from '../../src/aggregates/pull-requests-repository';
import {
  PullRequestJsonResponseBuilder,
  PullRequestCommentJsonResponseBuilder,
} from '../../src/test/builders';

describe('PullRequestsRepository filters', () => {
  it('excludes PR authors from loaded results', async () => {
    const repository = new PullRequestsRepository(
      {
        loadAll: vi
          .fn()
          .mockResolvedValue([
            new PullRequestJsonResponseBuilder()
              .withId('1')
              .withNumber('1')
              .withAuthor('alice')
              .build(),
            new PullRequestJsonResponseBuilder()
              .withId('2')
              .withNumber('2')
              .withAuthor('bot')
              .build(),
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
        loadAll: vi
          .fn()
          .mockResolvedValue([
            new PullRequestJsonResponseBuilder().withId('1').withAuthor('alice').build(),
          ]),
      } as any,
      {
        loadAll: vi
          .fn()
          .mockResolvedValue([
            new PullRequestCommentJsonResponseBuilder()
              .withId(1)
              .withReviewId(1)
              .withAuthor('reviewer')
              .withPullRequestUrl('https://api.github.com/repos/acme/app/pulls/1')
              .build(),
            new PullRequestCommentJsonResponseBuilder()
              .withId(2)
              .withReviewId(2)
              .withAuthor('bot')
              .withPullRequestUrl('https://api.github.com/repos/acme/app/pulls/1')
              .build(),
          ]),
      } as any
    );

    const prs = await repository.loadPrsWithFilters({ excludeCommenters: ['bot'] });

    expect(prs).toHaveLength(1);
    expect(prs[0].totalComments).toBe(1);
    expect(prs[0].comments.map((comment) => comment.author.login)).toEqual(['reviewer']);
  });

  it('applies raw filters as a final generic filter over loaded pull requests', async () => {
    const repository = new PullRequestsRepository(
      {
        loadAll: vi.fn().mockResolvedValue([
          new PullRequestJsonResponseBuilder()
            .withId('1')
            .withNumber('1')
            .withAuthor('alice')
            .withTitle('Keep this PR')
            .build(),
          new PullRequestJsonResponseBuilder()
            .withId('2')
            .withNumber('2')
            .withAuthor('bob')
            .withTitle('Ignore this PR')
            .build(),
        ]),
      } as any,
      { loadAll: vi.fn().mockResolvedValue([]) } as any
    );

    const prs = await repository.loadPrsWithFilters({
      rawFilters: 'author.login=alice,bob|title=Keep this PR',
    });

    expect(prs.map((pr) => pr.number)).toEqual([1]);
  });
});
