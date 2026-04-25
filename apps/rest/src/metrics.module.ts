import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MetricsController } from './metrics.controller.js';
import { LoggingMiddleware } from './middleware/logging.middleware.js';
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
  controllers: [MetricsController],
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
      useFactory: (config: Configuration) =>
        new CodemaatAnalyzer(config.storeData || '/tmp'),
      inject: [Configuration],
    },

    // Repositories
    {
      provide: PullRequestsRepository,
      useFactory: (client: GithubPrsClient, config: Configuration) =>
        new PullRequestsRepository(client, config.storeData || './outputs'),
      inject: [GithubPrsClient, Configuration],
    },
    {
      provide: PipelinesRepository,
      useFactory: (client: GithubWorkflowClient, config: Configuration) =>
        new PipelinesRepository(client, config.storeData || './outputs'),
      inject: [GithubWorkflowClient, Configuration],
    },
    {
      provide: CodeMetricsRepository,
      useFactory: (
        traverser: CommitTraverser,
        analyzer: CodemaatAnalyzer,
        config: Configuration,
      ) => new CodeMetricsRepository(traverser, analyzer, config.storeData || './outputs'),
      inject: [CommitTraverser, CodemaatAnalyzer, Configuration],
    },
    {
      provide: IssuesRepository,
      useFactory: (client: JiraIssuesClient, config: Configuration) =>
        new IssuesRepository(client, config.storeData || './outputs'),
      inject: [JiraIssuesClient, Configuration],
    },
    {
      provide: QualityMetricsRepository,
      useFactory: (client: SonarqubeMeasuresClient) =>
        new QualityMetricsRepository(client),
      inject: [SonarqubeMeasuresClient],
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
