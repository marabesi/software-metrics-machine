import { describe, expect, it } from 'vitest';
import { PullRequestFilterOptions, PullRequestFiltersRepository } from '../../../src';
import {
  PullRequestCommentJsonResponse,
  PullRequestJsonResponse,
} from '../../../src/providers/github/github-response-types';
import { InMemoryRepository } from '../../../src/test/in-memory-repository';

function createPullRequest(
  overrides: Partial<PullRequestJsonResponse> = {}
): PullRequestJsonResponse {
  return {
    url: '',
    id: '1',
    node_id: '',
    html_url: '',
    diff_url: '',
    patch_url: '',
    issue_url: '',
    number: '1',
    state: 'open',
    locked: false,
    title: 'Test PR',
    body: '',
    created_at: '2026-05-10T00:00:00Z',
    updated_at: '2026-05-10T00:00:00Z',
    closed_at: '',
    merged_at: '',
    labels: [],
    user: {
      login: 'alice',
      id: 1,
      node_id: '',
      avatar_url: '',
      gravatar_id: '',
      url: '',
      html_url: '',
      followers_url: '',
      following_url: '',
      gists_url: '',
      starred_url: '',
      subscriptions_url: '',
      organizations_url: '',
      repos_url: '',
      events_url: '',
      received_events_url: '',
      type: 'User',
      user_view_type: '',
      site_admin: false,
    },
    ...overrides,
  };
}

function createComment(
  overrides: Partial<PullRequestCommentJsonResponse> = {}
): PullRequestCommentJsonResponse {
  return {
    url: '',
    pull_request_review_id: 1,
    id: 1,
    node_id: '',
    diff_hunk: '',
    path: '',
    commit_id: '',
    original_commit_id: '',
    user: {
      login: 'reviewer',
      id: 1,
    },
    body: 'Looks good',
    created_at: '2026-05-10T00:00:00Z',
    updated_at: '2026-05-10T00:00:00Z',
    html_url: '',
    pull_request_url: '',
    reactions: {
      url: '',
      total_count: 0,
      '+1': 0,
      '-1': 0,
      laugh: 0,
      hooray: 0,
      confused: 0,
      heart: 0,
      rocket: 0,
      eyes: 0,
    },
    ...overrides,
  };
}

describe('PullRequestFiltersRepository', () => {
  it('loads distinct filter options from cached pull requests', async () => {
    const pullRequestRepository = new InMemoryRepository<PullRequestJsonResponse>();
    const pullRequestCommentsRepository = new InMemoryRepository<PullRequestCommentJsonResponse>();
    const filterOptionsRepository = new InMemoryRepository<PullRequestFilterOptions>();
    await pullRequestRepository.saveAll([
      createPullRequest({
        id: '1',
        user: { ...createPullRequest().user!, login: 'alice' },
        labels: [
          {
            id: '1',
            node_id: '',
            url: '',
            name: 'bug',
            color: '',
            default: false,
            description: '',
          },
        ],
      }),
      createPullRequest({
        id: '2',
        user: { ...createPullRequest().user!, login: 'bob' },
        labels: [
          {
            id: '2',
            node_id: '',
            url: '',
            name: 'feature',
            color: '',
            default: false,
            description: '',
          },
          {
            id: '3',
            node_id: '',
            url: '',
            name: 'bug',
            color: '',
            default: false,
            description: '',
          },
        ],
      }),
    ]);
    await pullRequestCommentsRepository.saveAll([
      createComment({ id: 1, user: { login: 'reviewer', id: 1 } }),
      createComment({ id: 2, user: { login: 'bot', id: 2 } }),
      createComment({ id: 3, user: { login: 'reviewer', id: 1 } }),
    ]);

    const repository = new PullRequestFiltersRepository(
      pullRequestRepository,
      pullRequestCommentsRepository,
      filterOptionsRepository
    );

    const options = await repository.loadOptions();

    expect(options).toEqual({
      authors: ['alice', 'bob'],
      commenters: ['bot', 'reviewer'],
      labels: ['bug', 'feature'],
    });
    expect(await filterOptionsRepository.load()).toEqual({
      authors: ['alice', 'bob'],
      labels: ['bug', 'feature'],
    });
  });
});
