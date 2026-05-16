import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GithubPrsClient, GithubWorkflowClient } from '../src';
import { JiraIssuesClient } from '../src';
import { SonarqubeMeasuresClient } from '../src';
import { CommitTraverser } from '../src';
import { CodemaatAnalyzer } from '../src';
import {
  PullRequestsRepository,
  PipelinesRepository,
  CodeMetricsRepository,
  IssuesRepository,
  QualityMetricsRepository,
  MetricsOrchestrator,
} from '../src';

describe('Full Business Logic Integration', () => {
  let prsRepo: PullRequestsRepository;
  let pipelinesRepo: PipelinesRepository;
  let codeRepo: CodeMetricsRepository;
  let issuesRepo: IssuesRepository;
  let qualityRepo: QualityMetricsRepository;
  let orchestrator: MetricsOrchestrator;

  beforeEach(() => {
    // Initialize providers
    const githubPrsClient = new GithubPrsClient('token', 'owner', 'repo');
    const githubWorkflowClient = new GithubWorkflowClient('token', 'owner', 'repo');
    const jiraClient = new JiraIssuesClient('https://jira.example.com', 'user@example.com', 'token', 'PROJECT');
    const sonarqubeClient = new SonarqubeMeasuresClient('https://sonar.example.com', 'token', 'project-key');
    const commitTraverser = new CommitTraverser('/path/to/repo');
    const codemaatAnalyzer = new CodemaatAnalyzer('/path/to/data');

    // Initialize repositories
    const cacheDir = '/tmp/smm-cache';
    prsRepo = new PullRequestsRepository(githubPrsClient, cacheDir);
    pipelinesRepo = new PipelinesRepository(githubWorkflowClient, cacheDir);
    codeRepo = new CodeMetricsRepository(commitTraverser, codemaatAnalyzer, cacheDir);
    issuesRepo = new IssuesRepository(jiraClient, cacheDir);
    qualityRepo = new QualityMetricsRepository(sonarqubeClient);

    // Initialize orchestrator
    orchestrator = new MetricsOrchestrator(
      prsRepo,
      pipelinesRepo,
      codeRepo,
      issuesRepo,
      qualityRepo
    );
  });

  describe('PullRequestsRepository', () => {
    it('should initialize with GitHub client', () => {
      expect(prsRepo).toBeDefined();
    });

    it('should get PR metrics', async () => {
      const metrics = await prsRepo.getPRMetrics();
      expect(metrics).toBeDefined();
    });

    it('should get PRs by month', async () => {
      const byMonth = await prsRepo.getPRsByMonth();
      expect(Array.isArray(byMonth) || byMonth).toBeDefined();
    });

    it('should get PRs by week', async () => {
      const byWeek = await prsRepo.getPRsByWeek();
      expect(Array.isArray(byWeek) || byWeek).toBeDefined();
    });

    it('should support date filtering', async () => {
      const metrics = await prsRepo.getPRMetrics({
        startDate: '2024-01-01',
        endDate: '2024-02-01',
      });
      expect(metrics).toBeDefined();
    });
  });

  describe('PipelinesRepository', () => {
    it('should initialize with GitHub workflow client', () => {
      expect(pipelinesRepo).toBeDefined();
    });

    it('should get pipeline metrics', async () => {
      const metrics = await pipelinesRepo.getPipelineMetrics();
      expect(metrics).toBeDefined();
    });

    it('should get deployment frequency by day', async () => {
      const freq = await pipelinesRepo.getDeploymentFrequency('day');
      expect(Array.isArray(freq)).toBe(true);
    });

    it('should get deployment frequency by week', async () => {
      const freq = await pipelinesRepo.getDeploymentFrequency('week');
      expect(Array.isArray(freq)).toBe(true);
    });

    it('should get deployment frequency by month', async () => {
      const freq = await pipelinesRepo.getDeploymentFrequency('month');
      expect(Array.isArray(freq)).toBe(true);
    });

    it('should get job metrics', async () => {
      const jobs = await pipelinesRepo.getJobMetrics();
      expect(Array.isArray(jobs)).toBe(true);
    });
  });

  describe('CodeMetricsRepository', () => {
    it('should initialize with Git and CodeMaat providers', () => {
      expect(codeRepo).toBeDefined();
    });

    it('should get pairing index', async () => {
      const pairing = await codeRepo.getPairingIndex();
      expect(pairing).toBeDefined();
      expect(pairing.pairingIndexPercentage).toBeGreaterThanOrEqual(0);
    });

    it('should get code churn', async () => {
      const churn = await codeRepo.getCodeChurn();
      expect(churn).toBeDefined();
      expect(churn.data).toBeDefined();
    });

    it('should get file coupling', async () => {
      const coupling = await codeRepo.getFileCoupling();
      expect(Array.isArray(coupling)).toBe(true);
    });

    it('should support author filtering in pairing index', async () => {
      const pairing = await codeRepo.getPairingIndex({
        selectedAuthors: ['Alice'],
      });
      expect(pairing).toBeDefined();
    });
  });

  describe('IssuesRepository', () => {
    it('should initialize with Jira client', () => {
      expect(issuesRepo).toBeDefined();
    });

    it('should get issues', async () => {
      const issues = await issuesRepo.getIssues();
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should get issue changes', async () => {
      const changes = await issuesRepo.getIssueChanges('PROJ-1');
      expect(Array.isArray(changes)).toBe(true);
    });

    it('should get issue comments', async () => {
      const comments = await issuesRepo.getIssueComments('PROJ-1');
      expect(Array.isArray(comments)).toBe(true);
    });

    it('should support status filtering', async () => {
      const issues = await issuesRepo.getIssues({
        status: 'Done',
      });
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('QualityMetricsRepository', () => {
    it('should initialize with SonarQube client', () => {
      expect(qualityRepo).toBeDefined();
    });

    it('should get quality metrics', async () => {
      const metrics = await qualityRepo.getQualityMetrics();
      expect(metrics).toBeDefined();
    });

    it('should get specific measures', async () => {
      const measures = await qualityRepo.getMeasures(['coverage', 'complexity']);
      expect(measures).toBeDefined();
    });

    it('should cache quality metrics', async () => {
      await qualityRepo.getQualityMetrics();
      const metrics2 = await qualityRepo.getQualityMetrics();
      expect(metrics2).toBeDefined();
    });
  });

  describe('MetricsOrchestrator', () => {
    it('should initialize with all repositories', () => {
      expect(orchestrator).toBeDefined();
    });

    it('should get PR metrics', async () => {
      const metrics = await orchestrator.getPRMetrics();
      expect(metrics).toBeDefined();
    });

    it('should get deployment metrics', async () => {
      const metrics = await orchestrator.getDeploymentMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.pipelineMetrics).toBeDefined();
      expect(metrics.deploymentFrequency).toBeDefined();
      expect(metrics.jobMetrics).toBeDefined();
    });

    it('should get code metrics', async () => {
      const metrics = await orchestrator.getCodeMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.pairingIndex).toBeDefined();
      expect(metrics.codeChurn).toBeDefined();
      expect(metrics.fileCoupling).toBeDefined();
    });

    it('should get issue metrics', async () => {
      const metrics = await orchestrator.getIssueMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalIssues).toBeGreaterThanOrEqual(0);
    });

    it('should get quality metrics', async () => {
      const metrics = await orchestrator.getQualityMetrics();
      expect(metrics).toBeDefined();
    });

    it('should generate full report', async () => {
      const report = await orchestrator.getFullReport();
      expect(report).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.pullRequests).toBeDefined();
      expect(report.deployment).toBeDefined();
      expect(report.code).toBeDefined();
      expect(report.issues).toBeDefined();
      expect(report.quality).toBeDefined();
    });

    it('should support filtering on full report', async () => {
      const report = await orchestrator.getFullReport({
        startDate: '2024-01-01',
        endDate: '2024-02-01',
      });
      expect(report.filters).toBeDefined();
      expect(report.filters.startDate).toBe('2024-01-01');
      expect(report.filters.endDate).toBe('2024-02-01');
    });

    it('should handle concurrent requests', async () => {
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
  });

  describe('End-to-End Workflow', () => {
    it('should generate complete metrics report', async () => {
      const report = await orchestrator.getFullReport({
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      });

      // Verify report structure
      expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
      expect(report.pullRequests).toBeDefined();
      expect(report.deployment).toBeDefined();
      expect(report.code).toBeDefined();
      expect(report.issues).toBeDefined();
      expect(report.quality).toBeDefined();

      // Verify each section
      expect(report.pullRequests.totalPRs).toBeGreaterThanOrEqual(0);
      expect(report.deployment.pipelineMetrics).toBeDefined();
      expect(report.code.pairingIndex).toBeDefined();
      expect(report.issues.totalIssues).toBeGreaterThanOrEqual(0);
    });

    it('should support filtering across all metrics', async () => {
      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const report = await orchestrator.getFullReport(filters);

      expect(report.filters.startDate).toBe(filters.startDate);
      expect(report.filters.endDate).toBe(filters.endDate);
    });
  });
});
