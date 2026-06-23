import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it, vi } from 'vitest';
import { GitHubPullRequestsFetchRepository, IGithubPrsClient } from '../../../src';
import { PullRequestJsonResponse } from '../../../src/providers/github/github-response-types';
import { MockLoggerBuilder } from '../../mock-logger-builder';

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

describe('GitHubPullRequestsFetchRepository', () => {
  const logger = new MockLoggerBuilder().build();

  it('should perform incremental update fetching PRs created since latest cached update', async () => {
    const providerDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smm-pr-incr-'));
    const cachedPrs = [
      createPullRequest({
        id: '1',
        created_at: '2026-05-01T00:00:00Z',
        updated_at: '2026-05-10T00:00:00Z',
      }),
      createPullRequest({
        id: '2',
        created_at: '2026-05-05T00:00:00Z',
        updated_at: '2026-05-15T00:00:00Z',
      }),
    ];

    // Pre-populate cache
    await fs.writeFile(path.join(providerDir, 'prs.json'), JSON.stringify(cachedPrs));

    const newPrs = [
      createPullRequest({
        id: '3',
        created_at: '2026-05-20T00:00:00Z',
        updated_at: '2026-05-20T00:00:00Z',
      }),
    ];

    const fetchPRs = vi.fn().mockResolvedValue(newPrs);
    const githubPrsClient: IGithubPrsClient = {
      fetchPRs,
      fetchPRComments: vi.fn(),
    };
    const config = {
      getPathFromGitProvider: () => providerDir,
    };

    const repository = new GitHubPullRequestsFetchRepository(
      githubPrsClient,
      config as never,
      logger
    );

    const result = await repository.fetchPRs({ incrementalUpdate: true });

    // startDate is the latest updated_at from cache (2026-05-15)
    expect(fetchPRs).toHaveBeenCalledWith({
      startDate: '2026-05-15T00:00:00.000Z',
      endDate: undefined,
    });

    // Merged result includes cached + new PRs (3 total)
    expect(result).toHaveLength(3);
    const ids = result.map((pr) => pr.id).sort();
    expect(ids).toEqual(['1', '2', '3']);
  });

  it('falls through to a plain fetch when incrementalUpdate is true but the cache is empty', async () => {
    const providerDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smm-pr-incr-empty-'));
    const newPrs = [createPullRequest({ id: '1' })];

    const fetchPRs = vi.fn().mockResolvedValue(newPrs);
    const githubPrsClient: IGithubPrsClient = {
      fetchPRs,
      fetchPRComments: vi.fn(),
    };
    const config = {
      getPathFromGitProvider: () => providerDir,
    };

    const repository = new GitHubPullRequestsFetchRepository(
      githubPrsClient,
      config as never,
      logger
    );

    const result = await repository.fetchPRs({ incrementalUpdate: true });

    expect(fetchPRs).toHaveBeenCalledWith({
      startDate: undefined,
      endDate: undefined,
    });
    expect(result).toEqual(newPrs);
  });

  it('creates pull request filter options after fetching pull requests', async () => {
    const providerDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smm-pr-filters-'));
    const githubPrsClient: IGithubPrsClient = {
      fetchPRs: vi.fn().mockResolvedValue([
        createPullRequest(),
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
          ],
        }),
      ]),
      fetchPRComments: vi.fn(),
    };
    const config = {
      getPathFromGitProvider: () => providerDir,
    };

    const repository = new GitHubPullRequestsFetchRepository(
      githubPrsClient,
      config as never,
      logger
    );

    await repository.fetchPRs({ forceRefresh: true });

    const options = JSON.parse(
      await fs.readFile(path.join(providerDir, 'pull-request-filter-options.json'), 'utf-8')
    );

    expect(options).toEqual({
      authors: ['alice', 'bob'],
      labels: ['bug', 'feature'],
    });
  });
});
