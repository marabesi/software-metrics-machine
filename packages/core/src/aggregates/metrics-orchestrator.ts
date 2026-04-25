import { logger } from '@smm/utils';
import { PullRequestsRepository } from './pull-requests-repository';
import { PipelinesRepository } from './pipelines-repository';
import { CodeMetricsRepository } from './code-metrics-repository';
import { IssuesRepository } from './issues-repository';
import { QualityMetricsRepository } from './quality-metrics-repository';

export interface IMetricsOrchestrator {
  getPRMetrics(filters?: any): Promise<any>;
  getDeploymentMetrics(filters?: any): Promise<any>;
  getCodeMetrics(filters?: any): Promise<any>;
  getIssueMetrics(filters?: any): Promise<any>;
  getQualityMetrics(filters?: any): Promise<any>;
  getFullReport(filters?: any): Promise<any>;
}

/**
 * Orchestrator that coordinates all repositories
 * Provides high-level analytics across all data sources
 */
export class MetricsOrchestrator implements IMetricsOrchestrator {
  constructor(
    private prsRepo: PullRequestsRepository,
    private pipelinesRepo: PipelinesRepository,
    private codeRepo: CodeMetricsRepository,
    private issuesRepo: IssuesRepository,
    private qualityRepo: QualityMetricsRepository
  ) {}

  /**
   * Get PR metrics (lead time, comments, etc.)
   */
  async getPRMetrics(filters?: any): Promise<any> {
    logger.info('Orchestrating PR metrics...');
    return this.prsRepo.getPRMetrics(filters);
  }

  /**
   * Get deployment metrics (frequency, success rate, job metrics)
   */
  async getDeploymentMetrics(filters?: any): Promise<any> {
    logger.info('Orchestrating deployment metrics...');

    const metrics = await this.pipelinesRepo.getPipelineMetrics(filters);
    const frequency = await this.pipelinesRepo.getDeploymentFrequency('month', filters);
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
  async getCodeMetrics(filters?: any): Promise<any> {
    logger.info('Orchestrating code metrics...');

    const pairing = await this.codeRepo.getPairingIndex(filters);
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
  async getIssueMetrics(filters?: any): Promise<any> {
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
  async getQualityMetrics(filters?: any): Promise<any> {
    logger.info('Orchestrating quality metrics...');

    return this.qualityRepo.getQualityMetrics(filters);
  }

  /**
   * Get full report across all sources
   */
  async getFullReport(filters?: any): Promise<any> {
    logger.info('Generating full report...');

    const [pr, deployment, code, issues, quality] = await Promise.all([
      this.getPRMetrics(filters),
      this.getDeploymentMetrics(filters),
      this.getCodeMetrics(filters),
      this.getIssueMetrics(filters),
      this.getQualityMetrics(filters),
    ]);

    return {
      timestamp: new Date().toISOString(),
      filters,
      pullRequests: pr,
      deployment,
      code,
      issues,
      quality,
    };
  }
}
