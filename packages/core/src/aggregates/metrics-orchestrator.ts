import { logger } from '@smmachine/utils';
import { CodeMaatMetricsRepository } from './codemaat-metrics-repository';
import { IssuesRepository } from './issues-repository';
import { PairingIndexService, PipelinesService, PRsService, SonarQubeService } from '../domain';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OrchestratorFilters = any;

export interface IMetricsOrchestrator {
  getPRMetrics(filters?: OrchestratorFilters): Promise<unknown>;
  getDeploymentMetrics(filters?: OrchestratorFilters): Promise<unknown>;
  getCodeMetrics(filters?: OrchestratorFilters): Promise<unknown>;
  getIssueMetrics(filters?: OrchestratorFilters): Promise<unknown>;
  getQualityMetrics(filters?: OrchestratorFilters): Promise<unknown>;
  getFullReport(filters?: OrchestratorFilters): Promise<unknown>;
}

/**
 * Orchestrator that coordinates all repositories
 * Provides high-level analytics across all data sources
 */
export class MetricsOrchestrator implements IMetricsOrchestrator {
  constructor(
    private prsRepo: PRsService,
    private pipelinesRepo: PipelinesService,
    private codeRepo: CodeMaatMetricsRepository,
    private issuesRepo: IssuesRepository,
    private sonarqubeService: SonarQubeService,
    private pairingIndexService: PairingIndexService
  ) {}

  /**
   * Get PR metrics (lead time, comments, etc.)
   */
  async getPRMetrics(filters?: OrchestratorFilters): Promise<unknown> {
    logger.debug('Orchestrating PR metrics...');
    return this.prsRepo.getMetrics(filters);
  }

  /**
   * Get deployment metrics (frequency, success rate, job metrics)
   */
  async getDeploymentMetrics(filters?: OrchestratorFilters): Promise<unknown> {
    logger.info('Orchestrating deployment metrics...');

    const metrics = await this.pipelinesRepo.getMetrics(filters);
    const frequency = await this.pipelinesRepo.getDeploymentFrequencyWithAllIntervals(filters);
    const jobMetrics = await this.pipelinesRepo.getJobMetrics(filters);

    return {
      pipelineMetrics: metrics,
      deploymentFrequency: frequency,
      jobMetrics,
    };
  }

  /**
   * Get code metrics (pairing index, churn, coupling)
   */
  async getCodeMetrics(filters?: OrchestratorFilters): Promise<unknown> {
    logger.info('Orchestrating code metrics...');

    const pairing = await this.pairingIndexService.getPairingIndex(filters);
    const churn = await this.codeRepo.getCodeChurn(filters);
    const coupling = await this.codeRepo.getFileCoupling(filters);

    return {
      pairingIndex: pairing,
      codeChurn: churn,
      fileCoupling: coupling,
    };
  }

  /**
   * Get issue metrics from Jira
   */
  async getIssueMetrics(filters?: OrchestratorFilters): Promise<unknown> {
    logger.info('Orchestrating issue metrics...');

    const issues = await this.issuesRepo.getIssues(filters);

    return {
      totalIssues: issues.length,
      issues,
    };
  }

  /**
   * Get quality metrics from SonarQube
   */
  async getQualityMetrics(filters?: OrchestratorFilters): Promise<unknown> {
    logger.info('Orchestrating quality metrics...');

    return this.sonarqubeService.getQualityMetrics(filters);
  }

  /**
   * Get a complete metrics report across all sources
   */
  async getFullReport(filters?: OrchestratorFilters): Promise<unknown> {
    logger.info('Orchestrating full metrics report...');

    const [pullRequests, deployment, code, issues, quality] = await Promise.all([
      this.getPRMetrics(filters),
      this.getDeploymentMetrics(filters),
      this.getCodeMetrics(filters),
      this.getIssueMetrics(filters),
      this.getQualityMetrics(filters),
    ]);

    return {
      timestamp: new Date().toISOString(),
      pullRequests,
      deployment,
      code,
      issues,
      quality,
      filters: filters || {},
    };
  }
}
