/**
 * Core Infrastructure Configuration
 * Migrated from: api/src/software_metrics_machine/core/infrastructure/configuration/
 */

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
  storeData?: string;

  /**
   * Git repository location (local path)
   */
  gitRepositoryLocation?: string;

  /**
   * Target pipeline for deployment frequency
   */
  deploymentFrequencyTargetPipeline?: string;

  /**
   * Target job for deployment frequency
   */
  deploymentFrequencyTargetJob?: string;

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
  loggingLevel?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

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
}

/**
 * Configuration loader from environment variables
 */
export class Configuration implements IConfiguration {
  gitProvider?: string;
  githubToken?: string;
  gitlabToken?: string;
  githubRepository?: string;
  storeData?: string;
  gitRepositoryLocation?: string;
  deploymentFrequencyTargetPipeline?: string;
  deploymentFrequencyTargetJob?: string;
  mainBranch?: string;
  dashboardStartDate?: string;
  dashboardEndDate?: string;
  dashboardColor?: string;
  loggingLevel?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  jiraUrl?: string;
  jiraEmail?: string;
  jiraToken?: string;
  jiraProject?: string;
  sonarUrl?: string;
  sonarToken?: string;
  sonarProject?: string;

  constructor(env: Record<string, string | undefined> = process.env) {
    // Convert env to plain object if it's process.env (has null prototype in some Node versions)
    const envObj = env === process.env ? { ...env } : env;
    
    this.gitProvider = envObj.GIT_PROVIDER || 'github';
    this.githubToken = envObj.GITHUB_TOKEN;
    this.gitlabToken = envObj.GITLAB_TOKEN;
    this.githubRepository = envObj.GITHUB_REPOSITORY;
    this.storeData = envObj.SMM_STORE_DATA_AT;
    this.gitRepositoryLocation = envObj.GIT_REPOSITORY_LOCATION;
    this.deploymentFrequencyTargetPipeline = envObj.DEPLOYMENT_FREQUENCY_TARGET_PIPELINE;
    this.deploymentFrequencyTargetJob = envObj.DEPLOYMENT_FREQUENCY_TARGET_JOB;
    this.mainBranch = envObj.MAIN_BRANCH || 'main';
    this.dashboardStartDate = envObj.DASHBOARD_START_DATE;
    this.dashboardEndDate = envObj.DASHBOARD_END_DATE;
    this.dashboardColor = envObj.DASHBOARD_COLOR || '#6b77e3';
    this.loggingLevel = (envObj.LOGGING_LEVEL as IConfiguration['loggingLevel']) || 'CRITICAL';
    this.jiraUrl = envObj.JIRA_URL;
    this.jiraEmail = envObj.JIRA_EMAIL;
    this.jiraToken = envObj.JIRA_TOKEN;
    this.jiraProject = envObj.JIRA_PROJECT;
    this.sonarUrl = envObj.SONAR_URL;
    this.sonarToken = envObj.SONAR_TOKEN;
    this.sonarProject = envObj.SONAR_PROJECT;
  }

  /**
   * Validate that required configuration is present
   */
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
}
