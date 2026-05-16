import {describe, it, expect, beforeEach, vi} from 'vitest';
import { GithubPrsClient, GithubWorkflowClient } from '../src';
import { GitlabMrClient, GitlabPipelineClient } from '../src';
import axios from 'axios';

vi.mock('axios' , () => ({
  default: {
    create: vi.fn().mockImplementation((options) => {
      console.log('Creating axios instance with options:', options);
      return {
        get: vi.fn().mockResolvedValue({ data: [] }),
        post: vi.fn().mockResolvedValue({ data: [] }),
      };
    })
  }
  })
);

  describe('GithubPrsClient', () => {
    let client: GithubPrsClient;

    beforeEach(() => {
      client = new GithubPrsClient('fake-token', 'owner', 'repo');
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
      client = new GithubWorkflowClient('fake-token', 'owner', 'repo');
    });

    it('should initialize with token, owner, and repo', () => {
      expect(client).toBeDefined();
    });

    it('should fetch workflows', async () => {
      const workflows = await client.fetchWorkflows();

      expect(Array.isArray(workflows)).toBe(true);
    });

    it('should fetch jobs for workflows', async () => {
      const jobs = await client.fetchJobsForWorkflows(['run-1']);

      expect(Array.isArray(jobs)).toBe(true);
    });
  });

  describe('GitlabMrClient', () => {
    let client: GitlabMrClient;

    beforeEach(() => {
      client = new GitlabMrClient('fake-token', 'project-id');
    });

    it('should initialize with token and project ID', () => {
      expect(client).toBeDefined();
    });

    it('should fetch merge requests', async () => {
      const mrs = await client.fetchMergeRequests({
        state: 'merged',
      });

      expect(Array.isArray(mrs)).toBe(true);
    });

    it('should fetch MR comments', async () => {
      const comments = await client.fetchMRComments(1);

      expect(Array.isArray(comments)).toBe(true);
    });
  });

  describe('GitlabPipelineClient', () => {
    let client: GitlabPipelineClient;

    beforeEach(() => {
      client = new GitlabPipelineClient('fake-token', 'project-id');
    });

    it('should initialize with token and project ID', () => {
      expect(client).toBeDefined();
    });

    it('should fetch pipelines', async () => {
      const pipelines = await client.fetchPipelines({
        status: 'success',
      });

      expect(Array.isArray(pipelines)).toBe(true);
    });

    it('should fetch jobs for pipelines', async () => {
      const jobs = await client.fetchJobsForPipelines(['pipeline-1']);

      expect(Array.isArray(jobs)).toBe(true);
    });
  });

