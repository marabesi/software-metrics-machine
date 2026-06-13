import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GithubPrsClient, GithubWorkflowClient, GitHubRateLimitManager } from '../src';
import { GitlabMrClient, GitlabPipelineClient } from '../src';
vi.mock('axios', () => ({
  default: {
    create: vi.fn().mockImplementation((options) => {
      console.log('Creating axios instance with options:', options);
      return {
        get: vi.fn().mockResolvedValue({ data: [] }),
        post: vi.fn().mockResolvedValue({ data: [] }),
      };
    }),
  },
}));

describe('GithubPrsClient', () => {
  let client: GithubPrsClient;

  beforeEach(() => {
    client = new GithubPrsClient('fake-token', 'owner', 'repo', new GitHubRateLimitManager());
  });

  it('should fetch PRs', async () => {
    const prs = await client.fetchPRs({
      state: 'closed',
    });

    expect(Array.isArray(prs)).toBe(true);
  });

  it('should fetch PR comments', async () => {
    const comments = await client.fetchPRComments(1);

    expect(Array.isArray(comments)).toBe(true);
  });
});

describe('GithubWorkflowClient', () => {
  let client: GithubWorkflowClient;

  beforeEach(() => {
    client = new GithubWorkflowClient('fake-token', 'owner', 'repo', new GitHubRateLimitManager());
  });

  it('should initialize with token, owner, and repo', () => {
    expect(client).toBeDefined();
  });

  it('should fetch workflows', async () => {
    const workflows = await client.fetchWorkflows();

    expect(Array.isArray(workflows)).toBe(true);
  });
});

describe('GitlabMrClient', () => {
  let client: GitlabMrClient;
  const runner = vi.fn(async (args: string[]) => {
    const endpoint = args[1] || '';
    if (endpoint.includes('/notes')) {
      return JSON.stringify([
        {
          id: 20,
          body: 'Looks good',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          author: { id: 2, username: 'reviewer' },
        },
      ]);
    }

    return JSON.stringify([
      {
        id: 10,
        iid: 1,
        title: 'Add feature',
        description: 'Feature description',
        state: 'merged',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        merged_at: '2024-01-02T00:00:00Z',
        web_url: 'https://gitlab.com/group/project/-/merge_requests/1',
        author: { id: 1, username: 'author' },
        labels: ['feature'],
      },
    ]);
  });

  beforeEach(() => {
    runner.mockClear();
    client = new GitlabMrClient('fake-token', 'project-id', runner);
  });

  it('should initialize with token and project ID', () => {
    expect(client).toBeDefined();
  });

  it('should fetch merge requests', async () => {
    const mrs = await client.fetchMergeRequests({
      state: 'merged',
    });

    expect(Array.isArray(mrs)).toBe(true);
    expect(mrs[0]).toMatchObject({
      number: '1',
      state: 'merged',
      user: { login: 'author' },
    });
  });

  it('should fetch MR comments', async () => {
    const comments = await client.fetchMRComments(1);

    expect(Array.isArray(comments)).toBe(true);
    expect(comments[0]).toMatchObject({
      body: 'Looks good',
      pull_request_url: 'https://gitlab.local/project-id/pulls/1',
    });
  });
});

describe('GitlabPipelineClient', () => {
  let client: GitlabPipelineClient;
  const runner = vi.fn(async (args: string[]) => {
    const endpoint = args[1] || '';
    if (endpoint.includes('/jobs')) {
      return JSON.stringify([
        {
          id: 100,
          name: 'test',
          status: 'success',
          ref: 'main',
          created_at: '2024-01-01T00:01:00Z',
          started_at: '2024-01-01T00:02:00Z',
          finished_at: '2024-01-01T00:03:00Z',
          pipeline: { id: 50, web_url: 'https://gitlab.com/group/project/-/pipelines/50' },
        },
      ]);
    }

    if (/\/pipelines\/\d+$/.test(endpoint)) {
      return JSON.stringify({
        id: 50,
        iid: 5,
        ref: 'main',
        sha: 'abc123',
        status: 'success',
        source: 'push',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:05:00Z',
        started_at: '2024-01-01T00:01:00Z',
        finished_at: '2024-01-01T00:05:00Z',
        web_url: 'https://gitlab.com/group/project/-/pipelines/50',
      });
    }

    return JSON.stringify([
      {
        id: 50,
        iid: 5,
        ref: 'main',
        sha: 'abc123',
        status: 'success',
        source: 'push',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:05:00Z',
      },
    ]);
  });

  beforeEach(() => {
    runner.mockClear();
    client = new GitlabPipelineClient('fake-token', 'project-id', runner);
  });

  it('should initialize with token and project ID', () => {
    expect(client).toBeDefined();
  });

  it('should fetch pipelines', async () => {
    const pipelines = await client.fetchPipelines({
      status: 'success',
    });

    expect(Array.isArray(pipelines)).toBe(true);
    expect(pipelines[0]).toMatchObject({
      id: '50',
      head_branch: 'main',
      status: 'completed',
      conclusion: 'success',
    });
  });

  it('should fetch jobs for pipelines', async () => {
    const jobs = await client.fetchJobsForPipelines(['pipeline-1']);

    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs[0]).toMatchObject({
      run_id: '50',
      name: 'test',
      status: 'completed',
      conclusion: 'success',
    });
  });
});
