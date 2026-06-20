import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@smmachine/utils';
import {
  Configuration,
  DeploymentFrequencyTarget,
  IConfiguration,
  ISmmConfigFile,
  ISmmProjectConfig,
} from './configuration';

/**
 * Repository interface for accessing project configurations.
 * Provides a single source of truth for configuration data across the application.
 */
export interface IConfigurationRepository {
  /**
   * Returns the active Configuration instance for the current project.
   */
  getActiveConfiguration(): Configuration;

  /**
   * Creates a Configuration directly from a project entry.
   */
  fromProjectConfig(projectConfig: ISmmProjectConfig): Configuration;

  /**
   * Returns all project configurations from smm_config.json.
   */
  getAllProjects(): ISmmProjectConfig[];

  /**
   * Returns just the github_repository identifiers for all projects.
   */
  getAllProjectNames(): string[];

  /**
   * Finds a project configuration by github_repository.
   * @param repository - The github_repository value to find (e.g. "owner/repo")
   * @returns The project config if found, undefined otherwise
   */
  getProjectByRepository(repository: string): ISmmProjectConfig | undefined;

  /**
   * Alias for getProjectByRepository — finds a project by its name (github_repository).
   * @param name - The github_repository value to find
   */
  getProjectByName(name: string): ISmmProjectConfig | undefined;

  /**
   * Finds a project configuration by index.
   * @param index - The zero-based index of the project
   * @returns The project config if the index is valid, undefined otherwise
   */
  getProjectByIndex(index: number): ISmmProjectConfig | undefined;

  /**
   * Returns the root-level default GitHub token from smm_config.json.
   */
  getDefaultGithubToken(): string | undefined;

  /**
   * Persists changes to the active project configuration.
   */
  save(): void;
}

/**
 * Implementation of IConfigurationRepository that reads from smm_config.json.
 *
 * Requires the multi-project format { projects: [...] }.
 */
export class ConfigurationRepository implements IConfigurationRepository {
  private configuration: Configuration;
  private projects: ISmmProjectConfig[];
  private rawConfig: ISmmConfigFile & Record<string, unknown>;
  private activeProjectIndex: number;
  private configPath: string;
  private env: Record<string, string | undefined>;

  constructor(
    env: Record<string, string | undefined> = process.env,
    projectName: string | undefined,
    private logger: Logger
  ) {
    const envObj = env === process.env ? { ...env } : env;
    this.env = envObj;

    if (!envObj.SMM_STORE_DATA_AT) {
      throw new Error('SMM_STORE_DATA_AT is required to load configuration.');
    }

    this.configPath = path.resolve(`${envObj.SMM_STORE_DATA_AT}/smm_config.json`);
    this.rawConfig = this.loadRawConfig();
    this.projects = this.extractProjects();

    if (Array.isArray(this.rawConfig.projects) && this.projects.length === 0) {
      throw new Error('smm_config.json has empty projects array.');
    }

    this.activeProjectIndex =
      this.projects.length > 0 ? this.resolveActiveProjectIndex(projectName) : 0;

    if (this.projects.length > 0) {
      this.configuration = this.fromProjectConfig(this.projects[this.activeProjectIndex]);
    } else {
      this.configuration = this.fromRootConfig(this.rawConfig);
    }
  }

  getActiveConfiguration(): Configuration {
    return this.configuration;
  }

  fromProjectConfig(projectConfig: ISmmProjectConfig): Configuration {
    return this.buildConfiguration(projectConfig as unknown as Record<string, unknown>);
  }

  private fromRootConfig(configData: Record<string, unknown>): Configuration {
    return this.buildConfiguration(configData);
  }

  private buildConfiguration(configData: Record<string, unknown>): Configuration {
    const config = Object.create(Configuration.prototype) as Configuration;

    const c = configData as unknown as Record<string, string | undefined>;
    config.gitProvider = c.git_provider || this.env.GIT_PROVIDER;
    config.githubToken =
      c.github_token || this.getDefaultGithubToken() || this.env.GITHUB_TOKEN;
    config.gitlabToken = c.gitlab_token || this.env.GITLAB_TOKEN;
    config.githubRepository = c.github_repository || this.env.GITHUB_REPO;
    config.storeData = this.env.SMM_STORE_DATA_AT!;
    config.gitRepositoryLocation =
      c.git_repository_location || this.env.GIT_REPOSITORY_PATH || '';
    config.deploymentFrequencyTargets = this.normalizeDeploymentFrequencyTargets(configData);
    config.mainBranch = c.main_branch;
    config.dashboardStartDate = c.dashboard_start_date;
    config.dashboardEndDate = c.dashboard_end_date;
    config.dashboardColor = c.dashboard_color;

    let logLevel: string = 'CRITICAL';
    if (c.log_level) {
      logLevel = c.log_level;
    }
    if (this.env.LOGGING_LEVEL) {
      logLevel = this.env.LOGGING_LEVEL;
    }
    config.loggingLevel = logLevel as IConfiguration['loggingLevel'];

    config.jiraUrl = c.jira_url || this.env.JIRA_URL;
    config.jiraEmail = c.jira_email || this.env.JIRA_EMAIL;
    config.jiraToken = c.jira_token || this.env.JIRA_TOKEN;
    config.jiraProject = c.jira_project || this.env.JIRA_PROJECT;
    config.sonarUrl = c.sonar_url || this.env.SONAR_URL;
    config.sonarToken = c.sonar_token || this.env.SONAR_TOKEN;
    config.sonarProject = c.sonar_project || this.env.SONAR_PROJECT;
    config.sonarLocalRunnerToken = c.sonar_local_runner_token;
    config.storeLogs = configData.store_logs === true || configData.STORE_LOGS === true;
    config.timezone = c.timezone || this.env.SMM_TIMEZONE || 'UTC';
    config.validate();

    return config;
  }

  getAllProjects(): ISmmProjectConfig[] {
    return this.projects;
  }

  getAllProjectNames(): string[] {
    return this.projects.map((p) => p.github_repository || '').filter(Boolean);
  }

  getProjectByRepository(repository: string): ISmmProjectConfig | undefined {
    return this.projects.find((p) => p.github_repository === repository);
  }

  getProjectByName(name: string): ISmmProjectConfig | undefined {
    return this.getProjectByRepository(name);
  }

  getProjectByIndex(index: number): ISmmProjectConfig | undefined {
    if (index < 0 || index >= this.projects.length) {
      return undefined;
    }
    return this.projects[index];
  }

  getDefaultGithubToken(): string | undefined {
    return typeof this.rawConfig.github_token === 'string' ? this.rawConfig.github_token : undefined;
  }

  save(): void {
    const rawConfig = this.loadRawConfig();

    const projectUpdate: Partial<ISmmProjectConfig> = {
      sonar_local_runner_token: this.configuration.sonarLocalRunnerToken,
    };

    if (Array.isArray(rawConfig.projects) && rawConfig.projects[this.activeProjectIndex]) {
      Object.assign(rawConfig.projects[this.activeProjectIndex], projectUpdate);
    }

    fs.writeFileSync(this.configPath, JSON.stringify(rawConfig, null, 2), 'utf-8');
    this.rawConfig = rawConfig;
    this.projects = this.extractProjects();
    this.logger.debug(`Configuration saved to file: ${this.configPath}`);
  }

  private loadRawConfig(): ISmmConfigFile & Record<string, unknown> {
    if (!fs.existsSync(this.configPath)) {
      return {};
    }

    const fileContent = fs.readFileSync(this.configPath, 'utf-8');

    let parsed: unknown;
    try {
      parsed = JSON.parse(fileContent);
    } catch {
      throw new Error(`smm_config.json at ${this.configPath} is not valid JSON.`);
    }

    this.validateConfig(parsed, this.configPath);

    return parsed as ISmmConfigFile & Record<string, unknown>;
  }

  /**
   * Validates the structure of smm_config.json against the expected schema.
   * Throws descriptive errors if the structure does not comply.
   */
  private validateConfig(data: unknown, configPath: string): void {
    if (data === null || data === undefined || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error(
        `smm_config.json at ${configPath} must be a JSON object, got ${Array.isArray(data) ? 'array' : typeof data}.`
      );
    }

    const obj = data as Record<string, unknown>;

    // Validate projects field if present
    if ('projects' in obj) {
      if (!Array.isArray(obj.projects)) {
        throw new Error(
          `smm_config.json at ${configPath}: "projects" must be an array, got ${typeof obj.projects}.`
        );
      }

      for (let i = 0; i < obj.projects.length; i++) {
        const project = obj.projects[i];
        this.validateProject(project, i, configPath);
      }
    }
  }

  /**
   * Validates a single project entry within smm_config.json.
   */
  private validateProject(project: unknown, index: number, configPath: string): void {
    if (
      project === null ||
      project === undefined ||
      typeof project !== 'object' ||
      Array.isArray(project)
    ) {
      throw new Error(
        `smm_config.json at ${configPath}: projects[${index}] must be a JSON object, got ${Array.isArray(project) ? 'array' : typeof project}.`
      );
    }

    const obj = project as Record<string, unknown>;
    const stringFields = [
      'git_provider',
      'github_token',
      'gitlab_token',
      'github_repository',
      'git_repository_location',
      'main_branch',
      'dashboard_start_date',
      'dashboard_end_date',
      'dashboard_color',
      'log_level',
      'jira_url',
      'jira_email',
      'jira_token',
      'jira_project',
      'sonar_url',
      'sonar_token',
      'sonar_project',
      'sonar_local_runner_token',
      'timezone',
    ];

    for (const field of stringFields) {
      if (
        field in obj &&
        obj[field] !== undefined &&
        obj[field] !== null &&
        typeof obj[field] !== 'string'
      ) {
        throw new Error(
          `smm_config.json at ${configPath}: projects[${index}].${field} must be a string, got ${typeof obj[field]}.`
        );
      }
    }

    // Validate store_logs is boolean if present
    if (
      'store_logs' in obj &&
      obj.store_logs !== undefined &&
      typeof obj.store_logs !== 'boolean'
    ) {
      throw new Error(
        `smm_config.json at ${configPath}: projects[${index}].store_logs must be a boolean, got ${typeof obj.store_logs}.`
      );
    }

    // Validate deployment_frequency_targets is array of objects with pipeline/job strings
    if ('deployment_frequency_targets' in obj && obj.deployment_frequency_targets !== undefined) {
      if (!Array.isArray(obj.deployment_frequency_targets)) {
        throw new Error(
          `smm_config.json at ${configPath}: projects[${index}].deployment_frequency_targets must be an array, got ${typeof obj.deployment_frequency_targets}.`
        );
      }

      for (let t = 0; t < obj.deployment_frequency_targets.length; t++) {
        const target = obj.deployment_frequency_targets[t];
        if (
          target === null ||
          target === undefined ||
          typeof target !== 'object' ||
          Array.isArray(target)
        ) {
          throw new Error(
            `smm_config.json at ${configPath}: projects[${index}].deployment_frequency_targets[${t}] must be an object, got ${Array.isArray(target) ? 'array' : typeof target}.`
          );
        }
        const targetObj = target as Record<string, unknown>;
        if (typeof targetObj.pipeline !== 'string') {
          throw new Error(
            `smm_config.json at ${configPath}: projects[${index}].deployment_frequency_targets[${t}].pipeline must be a string.`
          );
        }
        if (typeof targetObj.job !== 'string') {
          throw new Error(
            `smm_config.json at ${configPath}: projects[${index}].deployment_frequency_targets[${t}].job must be a string.`
          );
        }
      }
    }
  }

  private extractProjects(): ISmmProjectConfig[] {
    if (Array.isArray(this.rawConfig.projects)) {
      return this.rawConfig.projects;
    }

    // No config file or missing projects array
    return [];
  }

  private resolveActiveProjectIndex(projectName?: string): number {
    if (!projectName) {
      if (this.projects.length > 1) {
        this.logger.warn(
          `smm_config.json has ${this.projects.length} projects. Please specify one with --project <name>. Available: ${this.projects.map((p) => p.github_repository || '(unnamed)').join(', ')}`
        );
      }

      // No project specified: default to first project.
      return 0;
    }
    const found = this.projects.findIndex((p) => p.github_repository === projectName);
    if (found === -1) {
      throw new Error(
        `Project "${projectName}" not found. Available: ${this.projects.map((p) => p.github_repository || '(unnamed)').join(', ')}`
      );
    }
    return found;
  }

  private normalizeDeploymentFrequencyTargets(
    configData: Record<string, unknown>
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

    return undefined;
  }
}
