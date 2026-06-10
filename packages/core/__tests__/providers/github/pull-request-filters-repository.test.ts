import { describe, expect, it } from 'vitest';
import { PullRequestFilterOptions, PullRequestFiltersRepository } from '../../../src';
import { PullRequestJsonResponse } from '../../../src/providers/github/github-response-types';
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

describe('PullRequestFiltersRepository', () => {
  it('loads distinct filter options from cached pull requests', async () => {
    const pullRequestRepository = new InMemoryRepository<PullRequestJsonResponse>();
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

    const repository = new PullRequestFiltersRepository(
      pullRequestRepository,
      filterOptionsRepository
    );

    const options = await repository.loadOptions();

    expect(options).toEqual({
      authors: ['alice', 'bob'],
      labels: ['bug', 'feature'],
    });
    expect(await filterOptionsRepository.load()).toEqual(options);
  });
});
