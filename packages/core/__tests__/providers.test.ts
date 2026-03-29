import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GithubPrsClient, GithubWorkflowClient } from '../providers/github';
import { GitlabMrClient, GitlabPipelineClient } from '../providers/gitlab';
import { JiraIssuesClient } from '../providers/jira';
import { SonarqubeMeasuresClient } from '../providers/sonarqube';
import { CommitTraverser } from '../providers/git';
import { CodemaatAnalyzer } from '../providers/codemaat';

describe('Provider Clients', () => {
  describe('GithubPrsClient', () => {
    let client: GithubPrsClient;

    beforeEach(() => {
      client = new GithubPrsClient('fake-token', 'owner', 'repo');
    });

    it('should initialize with token, owner, and repo', () => {
      expect(client).toBeDefined();
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

  describe('JiraIssuesClient', () => {
    let client: JiraIssuesClient;

    beforeEach(() => {
      client = new JiraIssuesClient(
        'https://jira.example.com',
        'user@example.com',
        'api-token',
        'PROJECT'
      );
    });

    it('should initialize with URL, email, token, and project', () => {
      expect(client).toBeDefined();
    });

    it('should fetch issues', async () => {
      const issues = await client.fetchIssues({
        status: 'Done',
      });

      expect(Array.isArray(issues)).toBe(true);
    });

    it('should fetch issue changes', async () => {
      const changes = await client.fetchIssueChanges('PROJ-1');

      expect(Array.isArray(changes)).toBe(true);
    });

    it('should fetch issue comments', async () => {
      const comments = await client.fetchIssueComments('PROJ-1');

      expect(Array.isArray(comments)).toBe(true);
    });
  });

  describe('SonarqubeMeasuresClient', () => {
    let client: SonarqubeMeasuresClient;

    beforeEach(() => {
      client = new SonarqubeMeasuresClient(
        'https://sonarqube.example.com',
        'sonar-token',
        'project-key'
      );
    });

    it('should initialize with URL, token, and project key', () => {
      expect(client).toBeDefined();
    });

    it('should fetch component measures', async () => {
      const measures = await client.fetchComponentMeasures({
        metrics: ['coverage', 'complexity'],
      });

      expect(measures).toBeDefined();
      expect(measures.key).toBe('project-key');
      expect(Array.isArray(measures.measures)).toBe(true);
    });
  });

  describe('CommitTraverser', () => {
    let traverser: CommitTraverser;

    beforeEach(() => {
      traverser = new CommitTraverser('/path/to/repo');
    });

    it('should initialize with repository path', () => {
      expect(traverser).toBeDefined();
    });

    it('should traverse commits', async () => {
      const result = await traverser.traverseCommits({
        selectedAuthors: ['Alice'],
      });

      expect(result).toBeDefined();
      expect(result.totalAnalyzedCommits).toBeGreaterThanOrEqual(0);
      expect(result.pairedCommits).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.commits)).toBe(true);
    });

    it('should filter commits by date range', async () => {
      const result = await traverser.traverseCommits({
        startDate: '2024-01-01',
        endDate: '2024-02-01',
      });

      expect(result).toBeDefined();
    });

    it('should filter commits by authors', async () => {
      const result = await traverser.traverseCommits({
        selectedAuthors: ['Alice', 'Bob'],
      });

      expect(result).toBeDefined();
    });

    it('should exclude authors from results', async () => {
      const result = await traverser.traverseCommits({
        excludedAuthors: ['Bot', 'CI'],
      });

      expect(result).toBeDefined();
    });
  });

  describe('CodemaatAnalyzer', () => {
    let analyzer: CodemaatAnalyzer;

    beforeEach(() => {
      analyzer = new CodemaatAnalyzer('/path/to/data');
    });

    it('should initialize with data directory', () => {
      expect(analyzer).toBeDefined();
    });

    it('should get code churn', async () => {
      const churn = await analyzer.getCodeChurn({
        startDate: '2024-01-01',
        endDate: '2024-02-01',
      });

      expect(churn).toBeDefined();
      expect(Array.isArray(churn.data)).toBe(true);
      expect(churn.startDate).toBe('2024-01-01');
      expect(churn.endDate).toBe('2024-02-01');
    });

    it('should get file coupling', async () => {
      const coupling = await analyzer.getFileCoupling({
        ignorePatterns: ['*.test.ts', 'node_modules/'],
      });

      expect(Array.isArray(coupling)).toBe(true);
    });

    it('should run full analysis', async () => {
      const result = await analyzer.analyze({
        startDate: '2024-01-01',
        endDate: '2024-02-01',
        ignorePatterns: ['*.test.ts'],
      });

      expect(result).toBeDefined();
      expect(result.churn).toBeDefined();
      expect(result.coupling).toBeDefined();
    });
  });
});
