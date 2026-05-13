/**
 * Orchestrator Factory
 *
 * Creates and configures MetricsOrchestrator with all required dependencies
 */

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
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
} from '@smmachine/core';
import { Logger } from '@smmachine/utils';

const logger = new Logger('OrchestratorFactory');
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(currentDir, '../../../');

function resolveGitRepositoryPath(configuredPath?: string): string {
  if (!configuredPath) {
    return '.';
  }

  if (fs.existsSync(configuredPath)) {
    return configuredPath;
  }

  const candidates: string[] = [];

  if (!path.isAbsolute(configuredPath)) {
    candidates.push(path.resolve(workspaceRoot, configuredPath));
    candidates.push(path.resolve(workspaceRoot, 'api', configuredPath));
  } else {
    const relativeToWorkspace = path.relative(workspaceRoot, configuredPath);
    if (!relativeToWorkspace.startsWith('..') && !path.isAbsolute(relativeToWorkspace)) {
      candidates.push(path.join(workspaceRoot, 'api', relativeToWorkspace));
    }
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      logger.warn(
        `Configured git_repository_location not found: ${configuredPath}. Using resolved path: ${candidate}`,
      );
      return candidate;
    }
  }

  return configuredPath;
}

/**
 * Create and configure MetricsOrchestrator with dependency injection
 */
export function createOrchestrator(): MetricsOrchestrator {
  try {
    logger.info('Initializing MetricsOrchestrator...');

    // Load configuration from environment (or JSON file via SMM_STORE_DATA_AT)
    const config = new Configuration(process.env);

    // Determine data storage directory following Python's path pattern:
    // {SMM_STORE_DATA_AT}/{git_provider}_{owner}_{repo}/
    const baseDir = config.storeData || './outputs';
    const gitProvider = config.gitProvider || 'github';
    const repoSlug = (config.githubRepository || '').replace('/', '_');
    const targetDir = `${gitProvider}_${repoSlug}`;
    const dataDirectory = path.join(baseDir, targetDir);
    const gitProviderDirectory = path.join(dataDirectory, gitProvider);
    const jiraDirectory = path.join(dataDirectory, 'jira');
    const sonarqubeDirectory = path.join(dataDirectory, 'sonarqube');
    const codemaatDirectory = path.join(dataDirectory, 'codemaat');

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
    const commitTraverser = new CommitTraverser(
      resolveGitRepositoryPath(config.gitRepositoryLocation),
    );

    // Initialize CodeMaat analyzer
    const codemaatAnalyzer = new CodemaatAnalyzer(codemaatDirectory);

    // Initialize repositories
    const prsRepository = new PullRequestsRepository(
      githubPrsClient,
      gitProviderDirectory,
    );

    const pipelinesRepository = new PipelinesRepository(
      githubWorkflowClient,
      gitProviderDirectory,
    );

    const codeRepository = new CodeMetricsRepository(
      commitTraverser,
      codemaatAnalyzer,
      dataDirectory,
    );

    const issuesRepository = new IssuesRepository(
      jiraClient,
      jiraDirectory,
    );

    const qualityRepository = new QualityMetricsRepository(
      sonarqubeClient,
      sonarqubeDirectory,
    );

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

  try {
    // Load configuration (from JSON file or env variables)
    const config = new Configuration(process.env);

    // Check for at least one provider configuration
    const hasGithub = config.githubToken && config.githubRepository;
    const hasJira = config.jiraUrl && config.jiraEmail && config.jiraToken;
    const hasSonarqube = config.sonarUrl && config.sonarToken;
    const hasGit = config.gitRepositoryLocation;

    if (!hasGithub && !hasJira && !hasSonarqube && !hasGit) {
      errors.push(
        'No provider configuration found. Please configure at least one provider in your JSON config file or environment variables.',
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
  } catch (error) {
    errors.push(
      `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
