import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import { MetricsController } from '../../src/metrics.controller';
import { HttpExceptionFilter, AllExceptionsFilter } from '../../src/filters/http-exception.filter';
import { MetricsOrchestrator } from '@smmachine/core';
import { vi } from 'vitest';

export interface MockedMetricsOrchestrator {
  getPRMetrics: ReturnType<typeof vi.fn>;
  getDeploymentMetrics: ReturnType<typeof vi.fn>;
  getCodeMetrics: ReturnType<typeof vi.fn>;
  getIssueMetrics: ReturnType<typeof vi.fn>;
  getQualityMetrics: ReturnType<typeof vi.fn>;
  getFullReport: ReturnType<typeof vi.fn>;
}

export async function createMetricsTestApp(): Promise<{
  app: INestApplication;
  orchestrator: MockedMetricsOrchestrator;
}> {
  const mockOrchestrator: MockedMetricsOrchestrator = {
    getPRMetrics: vi.fn().mockResolvedValue({
      totalPRs: 42,
      leadTime: { average: 2.5, unit: 'days' },
      commentSummary: { total: 156 },
      labelSummary: { bug: 5, feature: 12 },
      filters: {},
    }),
    getDeploymentMetrics: vi.fn().mockResolvedValue({
      pipelineMetrics: { totalRuns: 100, successRate: 0.95 },
      deploymentFrequency: [
        { date: '2024-01-01', value: 3 },
        { date: '2024-01-02', value: 5 },
      ],
      jobMetrics: [{ jobName: 'build', avgDuration: 120 }],
      filters: {},
    }),
    getCodeMetrics: vi.fn().mockResolvedValue({
      pairingIndex: { pairingIndexPercentage: 45 },
      codeChurn: { data: { additions: 1520, deletions: 890 } },
      fileCoupling: [],
      filters: {},
    }),
    getIssueMetrics: vi.fn().mockResolvedValue({
      totalIssues: 320,
      issues: [],
      filters: {},
    }),
    getQualityMetrics: vi.fn().mockResolvedValue({
      coverage: 78.5,
      complexity: 42,
      filters: {},
    }),
    getFullReport: vi.fn().mockResolvedValue({
      timestamp: '2024-01-15T10:30:00Z',
      pullRequests: {
        totalPRs: 42,
        leadTime: { average: 2.5, unit: 'days' },
      },
      deployment: {
        pipelineMetrics: { totalRuns: 100, successRate: 0.95 },
      },
      code: {
        pairingIndex: { pairingIndexPercentage: 45 },
      },
      issues: {
        totalIssues: 320,
      },
      quality: {
        coverage: 78.5,
      },
      filters: {},
    }),
  };

  const moduleFixture: TestingModule = await Test.createTestingModule({
    controllers: [MetricsController],
    providers: [
      {
        provide: MetricsOrchestrator,
        useValue: mockOrchestrator,
      },
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const message = errors
          .map((error) => {
            const constraints = Object.values(error.constraints || {});
            return `${error.property}: ${constraints.join(', ')}`;
          })
          .join('; ');
        return new BadRequestException(message);
      },
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());
  await app.init();

  return {
    app,
    orchestrator: mockOrchestrator,
  };
}
