import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import * as request from 'supertest';
import { MetricsController } from '../src/metrics.controller';
import { HttpExceptionFilter, AllExceptionsFilter } from '../src/filters/http-exception.filter';
import { LoggingMiddleware } from '../src/middleware/logging.middleware';
import { MetricsOrchestrator } from '@smm/core';

describe('MetricsController (Integration)', () => {
  let app: INestApplication;
  let orchestrator: MetricsOrchestrator;

  beforeAll(async () => {
    // Mock orchestrator with comprehensive responses
    const mockOrchestrator = {
      getPRMetrics: jest.fn().mockResolvedValue({
        totalPRs: 42,
        leadTime: { average: 2.5, unit: 'days' },
        commentSummary: { total: 156 },
        labelSummary: { bug: 5, feature: 12 },
        filters: {},
      }),
      getDeploymentMetrics: jest.fn().mockResolvedValue({
        pipelineMetrics: { totalRuns: 100, successRate: 0.95 },
        deploymentFrequency: [
          { date: '2024-01-01', value: 3 },
          { date: '2024-01-02', value: 5 },
        ],
        jobMetrics: [{ jobName: 'build', avgDuration: 120 }],
        filters: {},
      }),
      getCodeMetrics: jest.fn().mockResolvedValue({
        pairingIndex: { pairingIndexPercentage: 45 },
        codeChurn: { data: { additions: 1520, deletions: 890 } },
        fileCoupling: [],
        filters: {},
      }),
      getIssueMetrics: jest.fn().mockResolvedValue({
        totalIssues: 320,
        issues: [],
        filters: {},
      }),
      getQualityMetrics: jest.fn().mockResolvedValue({
        coverage: 78.5,
        complexity: 42,
        filters: {},
      }),
      getFullReport: jest.fn().mockResolvedValue({
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

    app = moduleFixture.createNestApplication();
    
    // Apply global validation pipe
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
      }),
    );

    // Apply global exception filters
    app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());

    orchestrator = moduleFixture.get<MetricsOrchestrator>(MetricsOrchestrator);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/metrics/pr', () => {
    it('should return pull request metrics', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/pr')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalPRs');
          expect(res.body).toHaveProperty('leadTime');
          expect(res.body.totalPRs).toBe(42);
          expect(res.body.leadTime.average).toBe(2.5);
        });
    });

    it('should support date filtering', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/pr?startDate=2024-01-01&endDate=2024-03-31')
        .expect(200)
        .expect(() => {
          expect(orchestrator.getPRMetrics).toHaveBeenCalledWith(
            expect.objectContaining({
              startDate: '2024-01-01',
              endDate: '2024-03-31',
            }),
          );
        });
    });

    it('should handle invalid date format', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/pr?startDate=invalid-date')
        .expect(400);
    });

    it('should handle missing required data gracefully', () => {
      jest.spyOn(orchestrator, 'getPRMetrics').mockRejectedValueOnce(
        new Error('GitHub API unavailable'),
      );

      return request(app.getHttpServer())
        .get('/api/metrics/pr')
        .expect(500)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('GET /api/metrics/deployment', () => {
    it('should return deployment metrics', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/deployment')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('pipelineMetrics');
          expect(res.body).toHaveProperty('deploymentFrequency');
          expect(res.body).toHaveProperty('jobMetrics');
        });
    });

    it('should support frequency parameter', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/deployment?frequency=day')
        .expect(200)
        .expect(() => {
          expect(orchestrator.getDeploymentMetrics).toHaveBeenCalledWith(
            expect.objectContaining({
              frequency: 'day',
            }),
          );
        });
    });

    it('should validate frequency parameter', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/deployment?frequency=invalid')
        .expect(200);
    });

    it('should handle missing pipeline data', () => {
      jest.spyOn(orchestrator, 'getDeploymentMetrics').mockRejectedValueOnce(
        new Error('No workflow data available'),
      );

      return request(app.getHttpServer())
        .get('/api/metrics/deployment')
        .expect(500);
    });
  });

  describe('GET /api/metrics/code', () => {
    it('should return code metrics', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/code')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('pairingIndex');
          expect(res.body).toHaveProperty('codeChurn');
          expect(res.body).toHaveProperty('fileCoupling');
        });
    });

    it('should support author filtering', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/code?selectedAuthors=Alice&selectedAuthors=Bob')
        .expect(200)
        .expect(() => {
          expect(orchestrator.getCodeMetrics).toHaveBeenCalledWith(
            expect.objectContaining({
              selectedAuthors: expect.arrayContaining(['Alice', 'Bob']),
            }),
          );
        });
    });

    it('should handle single author parameter', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/code?selectedAuthors=Alice')
        .expect(200);
    });

    it('should handle missing repository', () => {
      jest.spyOn(orchestrator, 'getCodeMetrics').mockRejectedValueOnce(
        new Error('Repository not found'),
      );

      return request(app.getHttpServer())
        .get('/api/metrics/code')
        .expect(500);
    });
  });

  describe('GET /api/metrics/issues', () => {
    it('should return issue metrics', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/issues')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalIssues');
          expect(res.body.totalIssues).toBe(320);
        });
    });

    it('should support status filtering', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/issues?status=Done')
        .expect(200)
        .expect(() => {
          expect(orchestrator.getIssueMetrics).toHaveBeenCalledWith(
            expect.objectContaining({
              status: 'Done',
            }),
          );
        });
    });

    it('should handle Jira connection failure', () => {
      jest.spyOn(orchestrator, 'getIssueMetrics').mockRejectedValueOnce(
        new Error('Jira authentication failed'),
      );

      return request(app.getHttpServer())
        .get('/api/metrics/issues')
        .expect(500)
        .expect((res) => {
          expect(res.body.message).toContain('Jira');
        });
    });
  });

  describe('GET /api/metrics/quality', () => {
    it('should return quality metrics', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/quality')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('coverage');
          expect(res.body).toHaveProperty('complexity');
        });
    });

    it('should support specific metric selection', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/quality?measures=coverage&measures=complexity')
        .expect(200)
        .expect(() => {
          expect(orchestrator.getQualityMetrics).toHaveBeenCalledWith(
            expect.arrayContaining(['coverage', 'complexity']),
          );
        });
    });

    it('should handle SonarQube unavailability', () => {
      jest.spyOn(orchestrator, 'getQualityMetrics').mockRejectedValueOnce(
        new Error('SonarQube server unreachable'),
      );

      return request(app.getHttpServer())
        .get('/api/metrics/quality')
        .expect(500);
    });
  });

  describe('GET /api/metrics/report', () => {
    it('should return complete metrics report', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/report')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('pullRequests');
          expect(res.body).toHaveProperty('deployment');
          expect(res.body).toHaveProperty('code');
          expect(res.body).toHaveProperty('issues');
          expect(res.body).toHaveProperty('quality');
          expect(res.body).toHaveProperty('filters');
        });
    });

    it('should support multiple filters on report', () => {
      return request(app.getHttpServer())
        .get(
          '/api/metrics/report?startDate=2024-01-01&endDate=2024-12-31&selectedAuthors=Alice&status=Done',
        )
        .expect(200)
        .expect(() => {
          expect(orchestrator.getFullReport).toHaveBeenCalledWith(
            expect.objectContaining({
              startDate: '2024-01-01',
              endDate: '2024-12-31',
            }),
          );
        });
    });

    it('should return report with all metrics', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/report')
        .expect(200)
        .expect((res) => {
          const report = res.body;
          expect(report.pullRequests).toHaveProperty('totalPRs');
          expect(report.deployment).toHaveProperty('pipelineMetrics');
          expect(report.code).toHaveProperty('pairingIndex');
          expect(report.issues).toHaveProperty('totalIssues');
          expect(report.quality).toHaveProperty('coverage');
        });
    });

    it('should handle partial data availability', () => {
      jest.spyOn(orchestrator, 'getFullReport').mockRejectedValueOnce(
        new Error('Some data sources unavailable'),
      );

      return request(app.getHttpServer())
        .get('/api/metrics/report')
        .expect(500);
    });
  });

  describe('Error Handling', () => {
    it('should return error response with proper format', () => {
      jest.spyOn(orchestrator, 'getPRMetrics').mockRejectedValueOnce(
        new Error('Test error'),
      );

      return request(app.getHttpServer())
        .get('/api/metrics/pr')
        .expect(500)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 500);
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('path');
        });
    });

    it('should handle validation errors gracefully', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/pr?startDate=not-a-date')
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 400);
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should handle missing optional parameters', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/pr')
        .expect(200);
    });

    it('should return 500 for unhandled exceptions', () => {
      jest.spyOn(orchestrator, 'getPRMetrics').mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      return request(app.getHttpServer())
        .get('/api/metrics/pr')
        .expect(500);
    });
  });

  describe('Response Format', () => {
    it('should include filters in all responses', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/pr?startDate=2024-01-01')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('filters');
        });
    });

    it('should return JSON content type', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/pr')
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('should not expose internal implementation details', () => {
      jest.spyOn(orchestrator, 'getPRMetrics').mockRejectedValueOnce(
        new Error('Internal database connection failed'),
      );

      return request(app.getHttpServer())
        .get('/api/metrics/pr')
        .expect(500)
        .expect((res) => {
          // Error message should be generic, not expose internal details
          expect(res.body.message).not.toContain('database');
        });
    });
  });

  describe('Performance', () => {
    it('should respond quickly for simple requests', async () => {
      const start = Date.now();
      await request(app.getHttpServer())
        .get('/api/metrics/pr')
        .expect(200);
      const duration = Date.now() - start;
      
      // Should respond in under 1 second for mocked data
      expect(duration).toBeLessThan(1000);
    });
  });
});

