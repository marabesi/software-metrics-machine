/**
 * Core Infrastructure Configuration
 * Migrated from: api/src/software_metrics_machine/core/infrastructure/configuration/
 */

export interface IConfiguration {
  /**
   * GitHub API token for authentication
   */
  githubToken?: string;

  /**
   * GitLab API token for authentication
   */
  gitlabToken?: string;

  /**
   * Jira API token for authentication
   */
  jiraToken?: string;

  /**
   * SonarQube server URL
   */
  sonarqubeUrl?: string;

  /**
   * SonarQube authentication token
   */
  sonarqubeToken?: string;

  /**
   * Log level (DEBUG, INFO, WARN, ERROR)
   */
  loggingLevel?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

  /**
   * Output directory for results
   */
  outputDir?: string;

  /**
   * Input directory for reading files
   */
  inputDir?: string;
}

/**
 * Configuration loader from environment variables
 */
export class Configuration implements IConfiguration {
  githubToken?: string;
  gitlabToken?: string;
  jiraToken?: string;
  sonarqubeUrl?: string;
  sonarqubeToken?: string;
  loggingLevel?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  outputDir?: string;
  inputDir?: string;

  constructor(env: Record<string, string | undefined> = process.env) {
    this.githubToken = env.GITHUB_TOKEN;
    this.gitlabToken = env.GITLAB_TOKEN;
    this.jiraToken = env.JIRA_TOKEN;
    this.sonarqubeUrl = env.SONARQUBE_URL;
    this.sonarqubeToken = env.SONARQUBE_TOKEN;
    this.loggingLevel = (env.LOG_LEVEL as IConfiguration['loggingLevel']) || 'INFO';
    this.outputDir = env.OUTPUT_DIR || './outputs';
    this.inputDir = env.INPUT_DIR || './inputs';
  }

  /**
   * Validate that required configuration is present
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.outputDir) {
      errors.push('OUTPUT_DIR is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
