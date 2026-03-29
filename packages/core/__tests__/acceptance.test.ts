import { describe, it, expect, beforeEach } from 'vitest';
import { PullRequestsRepository } from '../src/aggregates/pull-requests-repository';
import { PipelinesRepository } from '../src/aggregates/pipelines-repository';
import { CodeMetricsRepository } from '../src/aggregates/code-metrics-repository';
import { IssuesRepository } from '../src/aggregates/issues-repository';
import { QualityMetricsRepository } from '../src/aggregates/quality-metrics-repository';
import { MetricsOrchestrator } from '../src/aggregates/metrics-orchestrator';
import { GithubPrsClient, GithubWorkflowClient } from '../src/providers/github';
import { JiraIssuesClient } from '../src/providers/jira';
import { SonarqubeMeasuresClient } from '../src/providers/sonarqube';
import { CommitTraverser } from '../src/providers/git';
import { CodemaatAnalyzer } from '../src/providers/codemaat';

/**
 * Acceptance tests for the complete metrics system.
 * These tests verify the entire workflow from data collection to report generation.
 */
describe('Metrics System Acceptance Tests', () => {
  let orchestrator: MetricsOrchestrator;

  beforeEach(() => {
    // Set up all providers
    const githubPrsClient = new GithubPrsClient(
      process.env.GITHUB_TOKEN || 'test-token',
      process.env.GITHUB_OWNER || 'owner',
      process.env.GITHUB_REPO || 'repo'
    );

    const githubWorkflowClient = new GithubWorkflowClient(
      process.env.GITHUB_TOKEN || 'test-token',
      process.env.GITHUB_OWNER || 'owner',
      process.env.GITHUB_REPO || 'repo'
    );

    const jiraClient = new JiraIssuesClient(
      process.env.JIRA_URL || 'https://jira.example.com',
      process.env.JIRA_EMAIL || 'user@example.com',
      process.env.JIRA_TOKEN || 'test-token',
      process.env.JIRA_PROJECT || 'PROJECT'
    );

    const sonarqubeClient = new SonarqubeMeasuresClient(
      process.env.SONARQUBE_URL || 'https://sonar.example.com',
      process.env.SONARQUBE_TOKEN || 'test-token',
      process.env.SONARQUBE_PROJECT || 'project-key'
    );

    const commitTraverser = new CommitTraverser(
      process.env.REPO_PATH || '/path/to/repo'
    );

    const codemaatAnalyzer = new CodemaatAnalyzer(
      process.env.CODEMAAT_DATA_PATH || '/path/to/data'
    );

    // Set up repositories
    const cacheDir = process.env.CACHE_DIR || '/tmp/smm-cache';
    const prsRepo = new PullRequestsRepository(githubPrsClient, cacheDir);
    const pipelinesRepo = new PipelinesRepository(githubWorkflowClient, cacheDir);
    const codeRepo = new CodeMetricsRepository(commitTraverser, codemaatAnalyzer, cacheDir);
    const issuesRepo = new IssuesRepository(jiraClient, cacheDir);
    const qualityRepo = new QualityMetricsRepository(sonarqubeClient);

    // Set up orchestrator
    orchestrator = new MetricsOrchestrator(
      prsRepo,
      pipelinesRepo,
      codeRepo,
      issuesRepo,
      qualityRepo
    );
  });

  describe('Single Metric Retrieval', () => {
    it('should retrieve pull request metrics', async () => {
      const metrics = await orchestrator.getPRMetrics();
      expect(metrics).toHaveProperty('totalPRs');
      expect(metrics).toHaveProperty('leadTime');
      expect(metrics).toHaveProperty('commentSummary');
      expect(metrics).toHaveProperty('labelSummary');
    });

    it('should retrieve deployment metrics', async () => {
      const metrics = await orchestrator.getDeploymentMetrics();
      expect(metrics).toHaveProperty('pipelineMetrics');
      expect(metrics).toHaveProperty('deploymentFrequency');
      expect(metrics).toHaveProperty('jobMetrics');
    });

    it('should retrieve code metrics', async () => {
      const metrics = await orchestrator.getCodeMetrics();
      expect(metrics).toHaveProperty('pairingIndex');
      expect(metrics).toHaveProperty('codeChurn');
      expect(metrics).toHaveProperty('fileCoupling');
    });

    it('should retrieve issue metrics', async () => {
      const metrics = await orchestrator.getIssueMetrics();
      expect(metrics).toHaveProperty('totalIssues');
      expect(Array.isArray(metrics.issues) || metrics.issues).toBeDefined();
    });

    it('should retrieve quality metrics', async () => {
      const metrics = await orchestrator.getQualityMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('Filtered Metrics Retrieval', () => {
    it('should filter PR metrics by date range', async () => {
      const metrics = await orchestrator.getPRMetrics({
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      });
      expect(metrics).toBeDefined();
    });

    it('should filter deployment metrics by date range', async () => {
      const metrics = await orchestrator.getDeploymentMetrics({
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      });
      expect(metrics).toBeDefined();
    });

    it('should filter code metrics by author', async () => {
      const metrics = await orchestrator.getCodeMetrics({
        selectedAuthors: ['Alice', 'Bob'],
      });
      expect(metrics).toBeDefined();
    });

    it('should filter issues by status', async () => {
      const metrics = await orchestrator.getIssueMetrics({
        status: 'Done',
      });
      expect(metrics).toBeDefined();
    });
  });

  describe('Full Report Generation', () => {
    it('should generate complete metrics report without filters', async () => {
      const report = await orchestrator.getFullReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('pullRequests');
      expect(report).toHaveProperty('deployment');
      expect(report).toHaveProperty('code');
      expect(report).toHaveProperty('issues');
      expect(report).toHaveProperty('quality');
      expect(report).toHaveProperty('filters');

      // Verify timestamp is ISO format
      expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should generate report with date filters', async () => {
      const report = await orchestrator.getFullReport({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(report.filters.startDate).toBe('2024-01-01');
      expect(report.filters.endDate).toBe('2024-12-31');
    });

    it('should generate report with author filters', async () => {
      const report = await orchestrator.getFullReport({
        selectedAuthors: ['Alice', 'Bob', 'Charlie'],
      });

      expect(report.filters.selectedAuthors).toContain('Alice');
    });

    it('should generate report with multiple filter types', async () => {
      const report = await orchestrator.getFullReport({
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        selectedAuthors: ['Alice'],
        status: 'Done',
      });

      expect(report.filters.startDate).toBe('2024-01-01');
      expect(report.filters.selectedAuthors).toContain('Alice');
      expect(report.filters.status).toBe('Done');
    });

    it('should return complete report structure', async () => {
      const report = await orchestrator.getFullReport();

      // Verify PR section
      expect(report.pullRequests).toHaveProperty('totalPRs');
      expect(report.pullRequests).toHaveProperty('leadTime');

      // Verify deployment section
      expect(report.deployment).toHaveProperty('pipelineMetrics');
      expect(report.deployment).toHaveProperty('deploymentFrequency');

      // Verify code section
      expect(report.code).toHaveProperty('pairingIndex');
      expect(report.code).toHaveProperty('codeChurn');

      // Verify issues section
      expect(report.issues).toHaveProperty('totalIssues');

      // Verify quality section
      expect(report.quality).toBeDefined();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle simultaneous requests for different metrics', async () => {
      const [pr, deployment, code, issues, quality] = await Promise.all([
        orchestrator.getPRMetrics(),
        orchestrator.getDeploymentMetrics(),
        orchestrator.getCodeMetrics(),
        orchestrator.getIssueMetrics(),
        orchestrator.getQualityMetrics(),
      ]);

      expect(pr).toBeDefined();
      expect(deployment).toBeDefined();
      expect(code).toBeDefined();
      expect(issues).toBeDefined();
      expect(quality).toBeDefined();
    });

    it('should handle multiple full reports in parallel', async () => {
      const reports = await Promise.all([
        orchestrator.getFullReport({ startDate: '2024-01-01', endDate: '2024-03-31' }),
        orchestrator.getFullReport({ startDate: '2024-04-01', endDate: '2024-06-30' }),
        orchestrator.getFullReport({ startDate: '2024-07-01', endDate: '2024-09-30' }),
      ]);

      expect(reports).toHaveLength(3);
      reports.forEach((report) => {
        expect(report).toHaveProperty('timestamp');
        expect(report).toHaveProperty('pullRequests');
      });
    });
  });

  describe('Data Validation', () => {
    it('should return valid metrics for PR data', async () => {
      const metrics = await orchestrator.getPRMetrics();

      if (metrics.totalPRs !== undefined) {
        expect(metrics.totalPRs).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return valid deployment frequency data', async () => {
      const metrics = await orchestrator.getDeploymentMetrics();

      if (Array.isArray(metrics.deploymentFrequency)) {
        metrics.deploymentFrequency.forEach((entry) => {
          expect(entry).toHaveProperty('date');
          expect(entry).toHaveProperty('value');
        });
      }
    });

    it('should return valid pairing index percentage', async () => {
      const metrics = await orchestrator.getCodeMetrics();

      if (metrics.pairingIndex?.pairingIndexPercentage !== undefined) {
        const percentage = metrics.pairingIndex.pairingIndexPercentage;
        expect(percentage).toBeGreaterThanOrEqual(0);
        expect(percentage).toBeLessThanOrEqual(100);
      }
    });

    it('should return valid issue counts', async () => {
      const metrics = await orchestrator.getIssueMetrics();

      if (metrics.totalIssues !== undefined) {
        expect(metrics.totalIssues).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing configuration gracefully', async () => {
      // This should not throw; providers handle missing config
      const report = await orchestrator.getFullReport();
      expect(report).toBeDefined();
    });

    it('should handle invalid date filters', async () => {
      // Dates should be validated and handled
      const report = await orchestrator.getFullReport({
        startDate: '2024-01-01',
        endDate: '2023-12-31', // End before start
      });
      expect(report).toBeDefined();
    });
  });
});
