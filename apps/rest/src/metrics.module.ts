import { Module, MiddlewareConsumer, NestModule, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import * as path from 'path';
import { MetricsController } from './metrics.controller';
import { CodeController } from './controllers/code.controller';
import { PipelinesController } from './controllers/pipelines.controller';
import { PullRequestsController } from './controllers/pull-requests.controller';
import { ConfigurationController } from './controllers/configuration.controller';
import { ProjectsController } from './controllers/projects.controller';
import { SonarqubeController } from './controllers/sonarqube.controller';
import { LoggingMiddleware } from './middleware/logging.middleware';
import {
  MetricsOrchestrator,
  PullRequestsRepository,
  PullRequestFiltersRepository,
  PipelinesRepository,
  PipelineFiltersRepository,
  CodeMetricsRepository,
  IssuesRepository,
  JiraIssuesClient,
  SonarqubeMeasuresClient,
  CommitTraverser,
  ConfigurationRepository,
  Configuration,
  PipelinesService,
  PRsService,
  PullRequestFactory,
  SonarQubeService,
  SonarqubeRepository,
  SonarqubeFactory,
  PairingFactory,
} from '@smmachine/core';
import PipelineFactory from '@smmachine/core/aggregates/pipeline-factory';
import { PairingService } from '@smmachine/core/domain/code/pairing-service';
import { TimeZoneProvider } from '@smmachine/core/infrastructure/timezone-provider';

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
 * - ConfigurationRepository: Loads environment variables and smm_config.json
 * - GitHub Clients: Real API integration
 * - Jira Client: Issue tracking
 * - SonarQube Client: Code quality metrics
 * - Git Traverser: Local repository analysis
 * - CodeMaat Analyzer: Code churn and coupling
 * - Repositories: Data access layer
 * - MetricsOrchestrator: Business logic orchestration
 */
@Module({
  controllers: [
    MetricsController,
    CodeController,
    PipelinesController,
    PullRequestsController,
    ConfigurationController,
    ProjectsController,
    SonarqubeController,
  ],
  providers: [
    // Configuration Repository (singleton — caches project list)
    {
      provide: ConfigurationRepository,
      useFactory: () => new ConfigurationRepository(process.env),
    },

    // Configuration (request-scoped — resolved per request from ?project= query param)
    {
      provide: Configuration,
      scope: Scope.REQUEST,
      useFactory: (configRepo: ConfigurationRepository, req: Record<string, unknown>) => {
        const request = req as { query?: { project?: string }; url?: string };
        const projectName = request.query?.project as string | undefined;
        if (projectName) {
          const projectConfig = configRepo.getProjectByName(projectName);
          if (projectConfig) {
            return configRepo.fromProjectConfig(projectConfig);
          }
        }
        // Fallback: use default active configuration
        return configRepo.getActiveConfiguration();
      },
      inject: [ConfigurationRepository, REQUEST],
    },

    // Jira Client
    {
      provide: JiraIssuesClient,
      useFactory: (config: Configuration) =>
        new JiraIssuesClient(
          config.jiraUrl || '',
          config.jiraEmail || '',
          config.jiraToken || '',
          config.jiraProject || ''
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
          config.sonarProject || ''
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
    // Repositories
    {
      provide: PullRequestsRepository,
      useFactory: (config: Configuration) => {
        return PullRequestFactory.create(config);
      },
      inject: [Configuration],
    },
    {
      provide: PullRequestFiltersRepository,
      useFactory: (config: Configuration) => {
        return PullRequestFactory.createFilters(config);
      },
      inject: [Configuration],
    },
    {
      provide: PipelinesRepository,
      useFactory: (config: Configuration) => {
        return PipelineFactory.create(config).pipelineRepository;
      },
      inject: [Configuration],
    },
    {
      provide: PipelineFiltersRepository,
      useFactory: (config: Configuration) => {
        return PipelineFactory.create(config).pipelineFiltersRepository;
      },
      inject: [Configuration],
    },
    {
      provide: PipelinesService,
      useFactory: (pipelineRepository: PipelinesRepository, configuration: Configuration) => {
        return new PipelinesService(pipelineRepository, configuration);
      },
      inject: [PipelinesRepository, Configuration],
    },
    {
      provide: CodeMetricsRepository,
      useFactory: (config: Configuration) => {
        return new CodeMetricsRepository(config);
      },
      inject: [Configuration],
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
      provide: SonarqubeRepository,
      useFactory: (config: Configuration) => {
        const repo = SonarqubeFactory.create(config);
        return repo;
      },
      inject: [Configuration],
    },
    {
      provide: PRsService,
      useFactory: (pullRequestRepository: PullRequestsRepository, config: Configuration) => {
        const tz = new TimeZoneProvider(config.timezone);
        return new PRsService(pullRequestRepository, tz);
      },
      inject: [PullRequestsRepository, Configuration],
    },
    {
      provide: SonarQubeService,
      useFactory: (sonarqubeRepository: SonarqubeRepository) => {
        return new SonarQubeService(sonarqubeRepository);
      },
      inject: [SonarqubeRepository],
    },
    {
      provide: PairingService,
      useFactory: (config: Configuration) => {
        return PairingFactory.create(config);
      },
      inject: [Configuration],
    },

    // Orchestrator
    {
      provide: MetricsOrchestrator,
      useFactory: (
        prsService: PRsService,
        pipelinesService: PipelinesService,
        pairingService: PairingService,
        codeMetricsRepository: CodeMetricsRepository,
        issuesRepository: IssuesRepository,
        sonarqubeService: SonarQubeService
      ) =>
        new MetricsOrchestrator(
          prsService,
          pipelinesService,
          codeMetricsRepository,
          issuesRepository,
          sonarqubeService,
          pairingService
        ),
      inject: [
        PRsService,
        PipelinesService,
        PairingService,
        CodeMetricsRepository,
        IssuesRepository,
        SonarQubeService,
      ],
    },
  ],
  exports: [MetricsOrchestrator, Configuration, ConfigurationRepository],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Register logging middleware for all routes
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
