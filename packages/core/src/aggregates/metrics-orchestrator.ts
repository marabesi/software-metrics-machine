import { logger } from '@smmachine/utils';
import { PullRequestsRepository } from './pull-requests-repository';
import { CodeMetricsRepository } from './code-metrics-repository';
import { IssuesRepository } from './issues-repository';
import { SonarqubeMetricsRepository } from './sonarqube-metrics-repository';
import { PipelinesService } from '../domain';

export interface IMetricsOrchestrator {
  getPRMetrics(filters?: any): Promise<any>;
  getDeploymentMetrics(filters?: any): Promise<any>;
  getCodeMetrics(filters?: any): Promise<any>;
  getIssueMetrics(filters?: any): Promise<any>;
  getQualityMetrics(filters?: any): Promise<any>;
}

/**
 * Orchestrator that coordinates all repositories
 * Provides high-level analytics across all data sources
 */
export class MetricsOrchestrator implements IMetricsOrchestrator {
  constructor(
    private prsRepo: PullRequestsRepository,
    private pipelinesRepo: PipelinesService,
    private codeRepo: CodeMetricsRepository,
    private issuesRepo: IssuesRepository,
    private qualityRepo: SonarqubeMetricsRepository
  ) {}

  /**
   * Get PR metrics (lead time, comments, etc.)
   */
  async getPRMetrics(filters?: any): Promise<any> {
    logger.debug('Orchestrating PR metrics...');
    return this.prsRepo.getPRMetrics(filters);
  }

  /**
   * Get deployment metrics (frequency, success rate, job metrics)
   */
  async getDeploymentMetrics(filters?: any): Promise<any> {
    logger.info('Orchestrating deployment metrics...');

    const metrics = await this.pipelinesRepo.getMetrics(filters);
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
}
