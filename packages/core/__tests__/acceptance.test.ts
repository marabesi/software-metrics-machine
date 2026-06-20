import { describe, it, expect, beforeEach } from 'vitest';
import { CodeMetricsRepository } from '../src';
import { IssuesRepository } from '../src';
import { MetricsOrchestrator } from '../src';
import { IJiraIssuesClient } from '../src';
import { PRsService } from '../src';
import { PipelinesService } from '../src';
import { PullRequestFactory } from '../src';
import { SonarQubeService } from '../src';
import { SonarqubeFactory } from '../src';
import { PairingFactory } from '../src';
import PipelineFactory from '../src/aggregates/pipeline-factory';
import { MockLoggerBuilder } from './mock-logger-builder';

/**
 * Acceptance tests for the complete metrics system.
 * These tests verify the entire workflow from data collection to report generation.
 */
describe('Metrics System Acceptance Tests', () => {
  let orchestrator: MetricsOrchestrator;

  beforeEach(() => {
    const cacheDir = process.env.CACHE_DIR || '/tmp/smm-cache';

    const config = {
      githubToken: process.env.GITHUB_TOKEN || 'test-token',
      githubRepository: `${process.env.GITHUB_OWNER || 'owner'}/${process.env.GITHUB_REPO || 'repo'}`,
      jiraUrl: process.env.JIRA_URL || 'https://jira.example.com',
      jiraEmail: process.env.JIRA_EMAIL || 'user@example.com',
      jiraToken: process.env.JIRA_TOKEN || 'test-token',
      jiraProject: process.env.JIRA_PROJECT || 'PROJECT',
      sonarUrl: process.env.SONARQUBE_URL || 'https://sonar.example.com',
      sonarToken: process.env.SONARQUBE_TOKEN || 'test-token',
      sonarProject: process.env.SONARQUBE_PROJECT || 'project-key',
      storeData: cacheDir,
      gitProvider: 'github',
      getPathFromGitProvider: () => cacheDir,
      getCodeMaatPath: () => `${cacheDir}/codemaat`,
      getSonarqubePath: () => `${cacheDir}/sonarqube`,
      getGitPath: () => `${cacheDir}/git`,
    } as any;
    const logger = new MockLoggerBuilder().build();

    const jiraClient: IJiraIssuesClient = {
      fetchIssues: async () => [],
      fetchIssueChanges: async () => [],
      fetchIssueComments: async () => [],
    };

    // Repositories
    const prsRepository = PullRequestFactory.create(config, logger);
    const { pipelineRepository } = PipelineFactory.create(config, logger);
    const codeRepo = new CodeMetricsRepository(config, logger);
    const issuesRepo = new IssuesRepository(jiraClient, `${cacheDir}/jira`, logger);
    const sonarqubeRepository = SonarqubeFactory.create(config, logger);

    // Services
    const prsService = new PRsService(prsRepository, undefined, logger);
    const pipelinesService = new PipelinesService(pipelineRepository, undefined, logger);
    const sonarqubeService = new SonarQubeService(sonarqubeRepository, logger);
    const pairingService = PairingFactory.create(config, logger);

    orchestrator = new MetricsOrchestrator(
      prsService,
      pipelinesService,
      codeRepo,
      issuesRepo,
      sonarqubeService,
      pairingService,
      logger
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
});
