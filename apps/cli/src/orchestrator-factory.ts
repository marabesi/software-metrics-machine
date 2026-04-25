/**
 * Orchestrator Factory
 *
 * Creates and configures MetricsOrchestrator with all required dependencies
 */

import {
  MetricsOrchestrator,
  PullRequestsRepository,
  PipelinesRepository,
  CodeMetricsRepository,
  IssuesRepository,
  QualityMetricsRepository,
  GithubPrsClient,
  GithubWorkflowClient,
  JiraIssuesClient,
  SonarqubeMeasuresClient,
  CommitTraverser,
  CodemaatAnalyzer,
  Configuration,
} from '@smm/core';
import { Logger } from '@smm/utils';

const logger = new Logger('OrchestratorFactory');

/**
 * Create and configure MetricsOrchestrator with dependency injection
 */
export function createOrchestrator(): MetricsOrchestrator {
  try {
    logger.info('Initializing MetricsOrchestrator...');

    // Load configuration from environment
    const config = new Configuration(process.env);

    // Parse GitHub repository (format: owner/repo)
    const [githubOwner, githubRepo] = (config.githubRepository || '/').split('/');

    // Initialize GitHub clients
    const githubPrsClient = new GithubPrsClient(
      config.githubToken || '',
      githubOwner || '',
      githubRepo || '',
    );

    const githubWorkflowClient = new GithubWorkflowClient(
      config.githubToken || '',
      githubOwner || '',
      githubRepo || '',
    );

    // Initialize Jira client
    const jiraClient = new JiraIssuesClient(
      config.jiraUrl || '',
      config.jiraEmail || '',
      config.jiraToken || '',
      config.jiraProject || '',
    );

    // Initialize SonarQube client
    const sonarqubeClient = new SonarqubeMeasuresClient(
      config.sonarUrl || '',
      config.sonarToken || '',
      config.sonarProject || '',
    );

    // Initialize Git traverser
    const commitTraverser = new CommitTraverser(config.gitRepositoryLocation || '.');

    // Initialize CodeMaat analyzer
    const codemaatAnalyzer = new CodemaatAnalyzer(config.storeData || '/tmp');

    // Initialize repositories
    const prsRepository = new PullRequestsRepository(
      githubPrsClient,
      config.storeData || './outputs',
    );

    const pipelinesRepository = new PipelinesRepository(
      githubWorkflowClient,
      config.storeData || './outputs',
    );

    const codeRepository = new CodeMetricsRepository(
      commitTraverser,
      codemaatAnalyzer,
      config.storeData || './outputs',
    );

    const issuesRepository = new IssuesRepository(
      jiraClient,
      config.storeData || './outputs',
    );

    const qualityRepository = new QualityMetricsRepository(sonarqubeClient);

    // Create orchestrator
    const orchestrator = new MetricsOrchestrator(
      prsRepository,
      pipelinesRepository,
      codeRepository,
      issuesRepository,
      qualityRepository,
    );

    logger.info('✓ MetricsOrchestrator initialized successfully');

    return orchestrator;
  } catch (error) {
    logger.error(
      `Failed to initialize orchestrator: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

/**
 * Validate required environment variables before creating orchestrator
 */
export function validateConfiguration(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for at least one provider configuration
  const hasGithub = process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY;
  const hasJira = process.env.JIRA_URL && process.env.JIRA_EMAIL && process.env.JIRA_TOKEN;
  const hasSonarqube = process.env.SONAR_URL && process.env.SONAR_TOKEN;
  const hasGit = process.env.GIT_REPOSITORY_LOCATION;

  if (!hasGithub && !hasJira && !hasSonarqube && !hasGit) {
    errors.push(
      'No provider configuration found. Please set at least one of: GITHUB_TOKEN, JIRA_URL, SONAR_URL, GIT_REPOSITORY_LOCATION',
    );
  }

  if (!hasGithub) {
    logger.warn('GitHub provider not configured - PR and deployment metrics will not be available');
  }

  if (!hasJira) {
    logger.warn('Jira provider not configured - issue metrics will not be available');
  }

  if (!hasSonarqube) {
    logger.warn('SonarQube provider not configured - quality metrics will not be available');
  }

  if (!hasGit) {
    logger.warn('Git provider not configured - code metrics will not be available');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
