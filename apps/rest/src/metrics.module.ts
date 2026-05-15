import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import * as path from 'path';
import { MetricsController } from './metrics.controller';
import { CodeController } from './controllers/code.controller';
import { PipelinesController } from './controllers/pipelines.controller';
import { PullRequestsController } from './controllers/pull-requests.controller';
import { ConfigurationController } from './controllers/configuration.controller';
import { LoggingMiddleware } from './middleware/logging.middleware';
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

function buildDataDirectories(config: Configuration) {
  const baseDir = config.storeData || './outputs';
  const gitProvider = config.gitProvider || 'github';
  const repoSlug = (config.githubRepository || '').replace('/', '_');
  const dataDirectory = path.join(baseDir, `${gitProvider}_${repoSlug}`);

  return {
    gitProviderDirectory: path.join(dataDirectory, gitProvider),
    jiraDirectory: path.join(dataDirectory, 'jira'),
    sonarqubeDirectory: path.join(dataDirectory, 'sonarqube'),
    codemaatDirectory: path.join(dataDirectory, 'codemaat'),
  };
}

/**
 * REST API Module
 *
 * Provides NestJS module configuration for the metrics API.
 * All providers and repositories are initialized here.
 *
 * Dependencies:
 * - Configuration: Loads environment variables
 * - GitHub Clients: Real API integration
 * - Jira Client: Issue tracking
 * - SonarQube Client: Code quality metrics
 * - Git Traverser: Local repository analysis
 * - CodeMaat Analyzer: Code churn and coupling
 * - Repositories: Data access layer
 * - MetricsOrchestrator: Business logic orchestration
 */
@Module({
  controllers: [MetricsController, CodeController, PipelinesController, PullRequestsController, ConfigurationController],
  providers: [
    // Configuration
    {
      provide: Configuration,
      useFactory: () => new Configuration(process.env),
    },

    // GitHub Clients
    {
      provide: GithubPrsClient,
      useFactory: (config: Configuration) => {
        const [githubOwner, githubRepo] = (config.githubRepository || '/').split('/');
        return new GithubPrsClient(
          config.githubToken || '',
          githubOwner || '',
          githubRepo || '',
        );
      },
      inject: [Configuration],
    },
    {
      provide: GithubWorkflowClient,
      useFactory: (config: Configuration) => {
        const [githubOwner, githubRepo] = (config.githubRepository || '/').split('/');
        return new GithubWorkflowClient(
          config.githubToken || '',
          githubOwner || '',
          githubRepo || '',
        );
      },
      inject: [Configuration],
    },

    // Jira Client
    {
      provide: JiraIssuesClient,
      useFactory: (config: Configuration) =>
        new JiraIssuesClient(
          config.jiraUrl || '',
          config.jiraEmail || '',
          config.jiraToken || '',
          config.jiraProject || '',
        ),
      inject: [Configuration],
    },

    // SonarQube Client
    {
      provide: SonarqubeMeasuresClient,
      useFactory: (config: Configuration) =>
        new SonarqubeMeasuresClient(
          config.sonarUrl || '',
          config.sonarToken || '',
          config.sonarProject || '',
        ),
      inject: [Configuration],
    },

    // Git & CodeMaat
    {
      provide: CommitTraverser,
      useFactory: (config: Configuration) =>
        new CommitTraverser(config.gitRepositoryLocation || '.'),
      inject: [Configuration],
    },
    {
      provide: CodemaatAnalyzer,
      useFactory: (config: Configuration) => {
        const paths = buildDataDirectories(config);
        return new CodemaatAnalyzer(paths.codemaatDirectory);
      },
      inject: [Configuration],
    },

    // Repositories
    {
      provide: PullRequestsRepository,
      useFactory: (client: GithubPrsClient, config: Configuration) => {
        const paths = buildDataDirectories(config);
        return new PullRequestsRepository(client, paths.gitProviderDirectory);
      },
      inject: [GithubPrsClient, Configuration],
    },
    {
      provide: PipelinesRepository,
      useFactory: (client: GithubWorkflowClient, config: Configuration) => {
        const paths = buildDataDirectories(config);
        return new PipelinesRepository(client, paths.gitProviderDirectory);
      },
      inject: [GithubWorkflowClient, Configuration],
    },
    {
      provide: CodeMetricsRepository,
      useFactory: (
        traverser: CommitTraverser,
        analyzer: CodemaatAnalyzer,
        config: Configuration,
      ) => {
        const paths = buildDataDirectories(config);
        return new CodeMetricsRepository(traverser, analyzer, paths.codemaatDirectory);
      },
      inject: [CommitTraverser, CodemaatAnalyzer, Configuration],
    },
    {
      provide: IssuesRepository,
      useFactory: (client: JiraIssuesClient, config: Configuration) => {
        const paths = buildDataDirectories(config);
        return new IssuesRepository(client, paths.jiraDirectory);
      },
      inject: [JiraIssuesClient, Configuration],
    },
    {
      provide: QualityMetricsRepository,
      useFactory: (client: SonarqubeMeasuresClient, config: Configuration) => {
        const paths = buildDataDirectories(config);
        return new QualityMetricsRepository(client, paths.sonarqubeDirectory);
      },
      inject: [SonarqubeMeasuresClient, Configuration],
    },

    // Orchestrator
    {
      provide: MetricsOrchestrator,
      useFactory: (
        prsRepo: PullRequestsRepository,
        pipelinesRepo: PipelinesRepository,
        codeRepo: CodeMetricsRepository,
        issuesRepo: IssuesRepository,
        qualityRepo: QualityMetricsRepository,
      ) =>
        new MetricsOrchestrator(
          prsRepo,
          pipelinesRepo,
          codeRepo,
          issuesRepo,
          qualityRepo,
        ),
      inject: [
        PullRequestsRepository,
        PipelinesRepository,
        CodeMetricsRepository,
        IssuesRepository,
        QualityMetricsRepository,
      ],
    },
  ],
  exports: [MetricsOrchestrator, Configuration],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Register logging middleware for all routes
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
