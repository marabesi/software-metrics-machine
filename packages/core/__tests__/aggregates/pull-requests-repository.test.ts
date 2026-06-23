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

  it('excludes PRs created before the startDate', async () => {
    const repository = new PullRequestsRepository(
      {
        loadAll: vi.fn().mockResolvedValue([
          new PullRequestJsonResponseBuilder()
            .withId('1')
            .withNumber('1')
            .withCreatedAt('2026-01-01T00:00:00Z')
            .build(),
          new PullRequestJsonResponseBuilder()
            .withId('2')
            .withNumber('2')
            .withCreatedAt('2026-02-01T00:00:00Z')
            .build(),
        ]),
      } as any,
      { loadAll: vi.fn().mockResolvedValue([]) } as any
    );

    const prs = await repository.loadPrsWithFilters({ startDate: '2026-01-15' });

    expect(prs.map((pr) => pr.number)).toEqual([2]);
  });

  it('excludes PRs created after the endDate', async () => {
    const repository = new PullRequestsRepository(
      {
        loadAll: vi.fn().mockResolvedValue([
          new PullRequestJsonResponseBuilder()
            .withId('1')
            .withNumber('1')
            .withCreatedAt('2026-01-01T00:00:00Z')
            .build(),
          new PullRequestJsonResponseBuilder()
            .withId('2')
            .withNumber('2')
            .withCreatedAt('2026-02-01T00:00:00Z')
            .build(),
        ]),
      } as any,
      { loadAll: vi.fn().mockResolvedValue([]) } as any
    );

    const prs = await repository.loadPrsWithFilters({ endDate: '2026-01-15' });

    expect(prs.map((pr) => pr.number)).toEqual([1]);
  });

  it('includes PRs created within both the startDate and endDate bounds', async () => {
    const repository = new PullRequestsRepository(
      {
        loadAll: vi.fn().mockResolvedValue([
          new PullRequestJsonResponseBuilder()
            .withId('1')
            .withNumber('1')
            .withCreatedAt('2026-01-01T00:00:00Z')
            .build(),
          new PullRequestJsonResponseBuilder()
            .withId('2')
            .withNumber('2')
            .withCreatedAt('2026-01-15T00:00:00Z')
            .build(),
          new PullRequestJsonResponseBuilder()
            .withId('3')
            .withNumber('3')
            .withCreatedAt('2026-02-01T00:00:00Z')
            .build(),
        ]),
      } as any,
      { loadAll: vi.fn().mockResolvedValue([]) } as any
    );

    const prs = await repository.loadPrsWithFilters({
      startDate: '2026-01-10',
      endDate: '2026-01-20',
    });

    expect(prs.map((pr) => pr.number)).toEqual([2]);
  });

  it('keeps only PRs whose author matches the authors filter, case-insensitively', async () => {
    const repository = new PullRequestsRepository(
      {
        loadAll: vi.fn().mockResolvedValue([
          new PullRequestJsonResponseBuilder()
            .withId('1')
            .withNumber('1')
            .withAuthor('Alice')
            .build(),
          new PullRequestJsonResponseBuilder()
            .withId('2')
            .withNumber('2')
            .withAuthor('bob')
            .build(),
        ]),
      } as any,
      { loadAll: vi.fn().mockResolvedValue([]) } as any
    );

    const prs = await repository.loadPrsWithFilters({ authors: ['alice'] });

    expect(prs.map((pr) => pr.number)).toEqual([1]);
  });

  it('keeps only PRs with a label matching the labels filter, case-insensitively, excluding label-less PRs', async () => {
    const labelFixture = {
      id: 'l1',
      node_id: '',
      url: '',
      color: '',
      default: false,
      description: '',
    };

    const repository = new PullRequestsRepository(
      {
        loadAll: vi.fn().mockResolvedValue([
          new PullRequestJsonResponseBuilder()
            .withId('1')
            .withNumber('1')
            .withLabels([{ ...labelFixture, name: 'Bug' }])
            .build(),
          new PullRequestJsonResponseBuilder()
            .withId('2')
            .withNumber('2')
            .withLabels([{ ...labelFixture, name: 'enhancement' }])
            .build(),
          new PullRequestJsonResponseBuilder().withId('3').withNumber('3').withLabels([]).build(),
        ]),
      } as any,
      { loadAll: vi.fn().mockResolvedValue([]) } as any
    );

    const prs = await repository.loadPrsWithFilters({ labels: ['bug'] });

    expect(prs.map((pr) => pr.number)).toEqual([1]);
  });

  it('keeps only merged PRs when filters.state is "merged"', async () => {
    const repository = new PullRequestsRepository(
      {
        loadAll: vi.fn().mockResolvedValue([
          new PullRequestJsonResponseBuilder()
            .withId('1')
            .withNumber('1')
            .withMergedAt('2026-01-02T00:00:00Z')
            .build(),
          new PullRequestJsonResponseBuilder().withId('2').withNumber('2').build(),
        ]),
      } as any,
      { loadAll: vi.fn().mockResolvedValue([]) } as any
    );

    const prs = await repository.loadPrsWithFilters({ state: 'merged' });

    expect(prs.map((pr) => pr.number)).toEqual([1]);
  });

  it('excludes a PR that is both merged and closed when filters.state is "closed"', async () => {
    const repository = new PullRequestsRepository(
      {
        loadAll: vi.fn().mockResolvedValue([
          new PullRequestJsonResponseBuilder()
            .withId('1')
            .withNumber('1')
            .withClosedAt('2026-01-02T00:00:00Z')
            .build(),
          new PullRequestJsonResponseBuilder()
            .withId('2')
            .withNumber('2')
            .withClosedAt('2026-01-03T00:00:00Z')
            .withMergedAt('2026-01-03T00:00:00Z')
            .build(),
        ]),
      } as any,
      { loadAll: vi.fn().mockResolvedValue([]) } as any
    );

    const prs = await repository.loadPrsWithFilters({ state: 'closed' });

    expect(prs.map((pr) => pr.number)).toEqual([1]);
  });

  it('keeps only PRs with neither closedAt nor mergedAt when filters.state is "open"', async () => {
    const repository = new PullRequestsRepository(
      {
        loadAll: vi.fn().mockResolvedValue([
          new PullRequestJsonResponseBuilder().withId('1').withNumber('1').build(),
          new PullRequestJsonResponseBuilder()
            .withId('2')
            .withNumber('2')
            .withClosedAt('2026-01-03T00:00:00Z')
            .build(),
        ]),
      } as any,
      { loadAll: vi.fn().mockResolvedValue([]) } as any
    );

    const prs = await repository.loadPrsWithFilters({ state: 'open' });

    expect(prs.map((pr) => pr.number)).toEqual([1]);
  });

  it('keeps only PRs with a truthy draft field when filters.state is "draft"', async () => {
    const repository = new PullRequestsRepository(
      {
        loadAll: vi.fn().mockResolvedValue([
          { ...new PullRequestJsonResponseBuilder().withId('1').withNumber('1').build(), draft: true },
          new PullRequestJsonResponseBuilder().withId('2').withNumber('2').build(),
        ]),
      } as any,
      { loadAll: vi.fn().mockResolvedValue([]) } as any
    );

    const prs = await repository.loadPrsWithFilters({ state: 'draft' });

    expect(prs.map((pr) => pr.number)).toEqual([1]);
  });

  it('returns all cached PRs mapped, unfiltered, when no filters argument is passed', async () => {
    const repository = new PullRequestsRepository(
      {
        loadAll: vi.fn().mockResolvedValue([
          new PullRequestJsonResponseBuilder().withId('1').withNumber('1').build(),
          new PullRequestJsonResponseBuilder().withId('2').withNumber('2').build(),
        ]),
      } as any,
      { loadAll: vi.fn().mockResolvedValue([]) } as any
    );

    const prs = await repository.loadPrsWithFilters();

    expect(prs.map((pr) => pr.number)).toEqual([1, 2]);
  });
});
