/**
 * Core Infrastructure Configuration
 * Migrated from: api/src/software_metrics_machine/core/infrastructure/configuration/
 */

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

    // Check if configuration file path is provided
    let configData: Record<string, any> = {};
    if (envObj.SMM_STORE_DATA_AT) {
      try {
        const configPath = path.resolve(`${envObj.SMM_STORE_DATA_AT}/smm_config.json`);
        if (fs.existsSync(configPath)) {
          const fileContent = fs.readFileSync(configPath, 'utf-8');
          configData = JSON.parse(fileContent);
        }
      } catch (error) {
        // If JSON parsing or file reading fails, fall back to env variables
        console.warn(`Warning: Failed to load configuration from ${configData}:`, error);
      }
    }

    // Load configuration from JSON file (if available) or environment variables
    this.gitProvider = configData.git_provider || envObj.GIT_PROVIDER || 'github';
    this.githubToken = configData.github_token || envObj.GITHUB_TOKEN;
    this.gitlabToken = configData.gitlab_token || envObj.GITLAB_TOKEN;
    this.githubRepository = configData.github_repository || envObj.GITHUB_REPOSITORY;
    this.storeData = envObj.SMM_STORE_DATA_AT; // Keep as the path to the config file
    this.gitRepositoryLocation =
      configData.git_repository_location || envObj.GIT_REPOSITORY_LOCATION;
    this.deploymentFrequencyTargetPipeline =
      configData.deployment_frequency_target_pipeline ||
      envObj.DEPLOYMENT_FREQUENCY_TARGET_PIPELINE;
    this.deploymentFrequencyTargetJob =
      configData.deployment_frequency_target_job || envObj.DEPLOYMENT_FREQUENCY_TARGET_JOB;
    this.mainBranch = configData.main_branch || envObj.MAIN_BRANCH || 'main';
    this.dashboardStartDate = configData.dashboard_start_date || envObj.DASHBOARD_START_DATE;
    this.dashboardEndDate = configData.dashboard_end_date || envObj.DASHBOARD_END_DATE;
    this.dashboardColor = configData.dashboard_color || envObj.DASHBOARD_COLOR || '#6b77e3';

    // Map log_level to loggingLevel with proper type
    const logLevel = configData.log_level || envObj.LOGGING_LEVEL || 'CRITICAL';
    this.loggingLevel = logLevel.toUpperCase() as IConfiguration['loggingLevel'];

    this.jiraUrl = configData.jira_url || envObj.JIRA_URL;
    this.jiraEmail = configData.jira_email || envObj.JIRA_EMAIL;
    this.jiraToken = configData.jira_token || envObj.JIRA_TOKEN;
    this.jiraProject = configData.jira_project || envObj.JIRA_PROJECT;
    this.sonarUrl = configData.sonar_url || envObj.SONAR_URL;
    this.sonarToken = configData.sonar_token || envObj.SONAR_TOKEN;
    this.sonarProject = configData.sonar_project || envObj.SONAR_PROJECT;
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
