import { Logger, logger } from '@smmachine/utils';
import * as fs from 'fs';
import * as path from 'path';

export interface IConfiguration {
  /**
   * Git provider (github, gitlab)
   */
  gitProvider?: string;

  /**
   * GitHub API token for authentication
   */
  githubToken?: string;

  /**
   * GitLab API token for authentication
   */
  gitlabToken?: string;

  /**
   * GitHub repository in format owner/repo
   */
  githubRepository?: string;

  /**
   * Path to store data
   */
  storeData: string;

  /**
   * Git repository location (local path)
   */
  gitRepositoryLocation?: string;

  /**
   * Target workflows and jobs for deployment frequency
   */
  deploymentFrequencyTargets?: DeploymentFrequencyTarget[];

  /**
   * Main branch name
   */
  mainBranch?: string;

  /**
   * Dashboard start date
   */
  dashboardStartDate?: string;

  /**
   * Dashboard end date
   */
  dashboardEndDate?: string;

  /**
   * Dashboard color (hex)
   */
  dashboardColor?: string;

  /**
   * Log level (DEBUG, INFO, WARN, ERROR, CRITICAL)
   */
  loggingLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

  /**
   * Jira URL
   */
  jiraUrl?: string;

  /**
   * Jira email
   */
  jiraEmail?: string;

  /**
   * Jira API token for authentication
   */
  jiraToken?: string;

  /**
   * Jira project key
   */
  jiraProject?: string;

  /**
   * SonarQube server URL
   */
  sonarUrl?: string;

  /**
   * SonarQube authentication token
   */
  sonarToken?: string;

  /**
   * SonarQube project key
   */
  sonarProject?: string;

  /**
   * SonarQube local analysis runner token (generated and persisted by local analysis)
   */
  sonarLocalRunnerToken?: string;

  storeLogs?: boolean;
}

export interface DeploymentFrequencyTarget {
  pipeline: string;
  job: string;
}

/**
 * Configuration loader from environment variables
 */
export class Configuration implements IConfiguration {
  gitProvider?: string;
  githubToken?: string;
  gitlabToken?: string;
  githubRepository?: string;
  storeData: string;
  gitRepositoryLocation: string;
  deploymentFrequencyTargets?: DeploymentFrequencyTarget[];
  mainBranch?: string;
  dashboardStartDate?: string;
  dashboardEndDate?: string;
  dashboardColor?: string;
  loggingLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  jiraUrl?: string;
  jiraEmail?: string;
  jiraToken?: string;
  jiraProject?: string;
  sonarUrl?: string;
  sonarToken?: string;
  sonarProject?: string;
  sonarLocalRunnerToken?: string;
  storeLogs?: boolean;

  constructor(env: Record<string, string | undefined> = process.env) {
    // Convert env to plain object if it's process.env (has null prototype in some Node versions)
    const envObj = env === process.env ? { ...env } : env;

    // Check if configuration file path is provided
    let configData: Record<string, any> = {};
    if (!envObj.SMM_STORE_DATA_AT) {
      throw new Error(`Failed to load configuration from ${configData.toString()}:`);
    }

    const configPath = path.resolve(`${envObj.SMM_STORE_DATA_AT}/smm_config.json`);
    logger.debug(`Configuration loaded from file: ${configPath}`);
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      configData = JSON.parse(fileContent);
      logger.debug(`Configuration loaded: ${JSON.stringify(configData)}`);
    }

    // Load configuration from JSON file (if available) or environment variables
    this.gitProvider = configData.git_provider || envObj.GIT_PROVIDER;
    this.githubToken = configData.github_token || envObj.GITHUB_TOKEN;
    this.gitlabToken = configData.gitlab_token || envObj.GITLAB_TOKEN;
    this.githubRepository = configData.github_repository || envObj.GITHUB_REPO;
    this.storeData = envObj.SMM_STORE_DATA_AT; // Keep as the path to the config file
    this.gitRepositoryLocation = configData.git_repository_location || envObj.GIT_REPOSITORY_PATH;
    this.deploymentFrequencyTargets = this.normalizeDeploymentFrequencyTargets(configData);
    this.mainBranch = configData.main_branch;
    this.dashboardStartDate = configData.dashboard_start_date;
    this.dashboardEndDate = configData.dashboard_end_date;
    this.dashboardColor = configData.dashboard_color;

    let logLevel: string = 'CRITICAL';
    if (configData.log_level) {
      logLevel = configData.log_level;
    }
    if (envObj.LOGGING_LEVEL) {
      logLevel = envObj.LOGGING_LEVEL;
    }
    this.loggingLevel = logLevel as IConfiguration['loggingLevel'];

    this.jiraUrl = configData.jira_url || envObj.JIRA_URL;
    this.jiraEmail = configData.jira_email || envObj.JIRA_EMAIL;
    this.jiraToken = configData.jira_token || envObj.JIRA_TOKEN;
    this.jiraProject = configData.jira_project || envObj.JIRA_PROJECT;
    this.sonarUrl = configData.sonar_url || envObj.SONAR_URL;
    this.sonarToken = configData.sonar_token || envObj.SONAR_TOKEN;
    this.sonarProject = configData.sonar_project || envObj.SONAR_PROJECT;
    this.sonarLocalRunnerToken = configData.sonar_local_runner_token;
    this.storeLogs = configData.store_logs === true || configData.STORE_LOGS === true;
    Logger.configureDefaults({
      level: this.loggingLevel,
      filePath: this.getLogPath(),
      storeLogs: this.storeLogs,
    });
    this.validate();
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.gitRepositoryLocation) {
      errors.push('GIT_REPOSITORY_LOCATION is required');
    }

    if (this.gitProvider && ['github', 'gitlab'].includes(this.gitProvider.toLowerCase())) {
      if (!this.githubRepository) {
        errors.push('GITHUB_REPOSITORY is required (format: owner/repo)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getBaseDirectory(): string {
    const baseDir = this.storeData || './outputs';
    const gitProvider = this.gitProvider || 'github';
    const repoSlug = (this.githubRepository || '').replace('/', '_');
    return path.join(baseDir, `${gitProvider}_${repoSlug}`);
  }

  getLogPath(): string {
    return path.join(this.getBaseDirectory(), 'smm.log');
  }

  getDeploymentFrequencyTargets(): DeploymentFrequencyTarget[] {
    return this.deploymentFrequencyTargets || [];
  }

  getCodeMaatPath(): string {
    return path.join(this.getBaseDirectory(), 'codemaat');
  }

  getSonarqubePath(): string {
    return path.join(this.getBaseDirectory(), 'sonarqube');
  }

  getJiraPath(): string {
    return path.join(this.getBaseDirectory(), 'jira');
  }

  getPathFromGitProvider(): string {
    return path.join(this.getBaseDirectory(), this.gitProvider!);
  }

  getGitPath(): string {
    return path.join(this.getBaseDirectory(), 'git');
  }

  save(): void {
    const configPath = path.resolve(`${this.storeData}/smm_config.json`);
    let configData: Record<string, any> = {};

    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      configData = JSON.parse(fileContent);
    }

    configData.sonar_local_runner_token = this.sonarLocalRunnerToken;

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf-8');
    logger.debug(`Configuration saved to file: ${configPath}`);
  }

  private normalizeDeploymentFrequencyTargets(
    configData: Record<string, any>
  ): DeploymentFrequencyTarget[] | undefined {
    const configuredTargets = configData.deployment_frequency_targets;

    if (Array.isArray(configuredTargets)) {
      const targets = configuredTargets
        .map((target): DeploymentFrequencyTarget | null => {
          if (!target || typeof target !== 'object') {
            return null;
          }

          const pipeline = typeof target.pipeline === 'string' ? target.pipeline.trim() : '';
          const job = typeof target.job === 'string' ? target.job.trim() : '';

          return pipeline && job ? { pipeline, job } : null;
        })
        .filter((target): target is DeploymentFrequencyTarget => target !== null);

      return targets.length > 0 ? targets : undefined;
    }

    const legacyPipeline =
      typeof configData.deployment_frequency_target_pipeline === 'string'
        ? configData.deployment_frequency_target_pipeline.trim()
        : '';
    const legacyJob =
      typeof configData.deployment_frequency_target_job === 'string'
        ? configData.deployment_frequency_target_job.trim()
        : '';

    if (legacyPipeline && legacyJob) {
      return [{ pipeline: legacyPipeline, job: legacyJob }];
    }

    return undefined;
  }
}
