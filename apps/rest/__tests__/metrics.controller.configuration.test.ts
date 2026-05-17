import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createMetricsTestApp, MockedMetricsOrchestrator } from './helpers/metrics-test-app';

describe('MetricsController - Configuration and Cross-Cutting Behavior', () => {
  let app: INestApplication;
  let orchestrator: MockedMetricsOrchestrator;

  beforeAll(async () => {
    const testApp = await createMetricsTestApp();
    app = testApp.app;
    orchestrator = testApp.orchestrator;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return issue metrics', async () => {
    await request(app.getHttpServer())
      .get('/api/metrics/issues')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('totalIssues');
        expect(res.body.totalIssues).toBe(320);
      });
  });

  it('should support issue status filtering', async () => {
    await request(app.getHttpServer())
      .get('/api/metrics/issues?status=Done')
      .expect(200)
      .expect(() => {
        expect(orchestrator.getIssueMetrics).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'Done',
          })
        );
      });
  });

  it('should return quality metrics', async () => {
    await request(app.getHttpServer())
      .get('/api/metrics/quality')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('coverage');
        expect(res.body).toHaveProperty('complexity');
      });
  });

  it('should support quality metric selection', async () => {
    await request(app.getHttpServer())
      .get('/api/metrics/quality?measures=coverage&measures=complexity')
      .expect(200)
      .expect(() => {
        expect(orchestrator.getQualityMetrics).toHaveBeenCalledWith(
          expect.arrayContaining(['coverage', 'complexity'])
        );
      });
  });

  it('should return complete metrics report', async () => {
    await request(app.getHttpServer())
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

  it('should support multiple report filters', async () => {
    await request(app.getHttpServer())
      .get('/api/metrics/report?startDate=2024-01-01&endDate=2024-12-31&selectedAuthors=Alice&selectedAuthors=Bob&status=Done')
      .expect(200)
      .expect(() => {
        expect(orchestrator.getFullReport).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: '2024-01-01',
            endDate: '2024-12-31',
          })
        );
      });
  });

  it('should return report with all metrics sections', async () => {
    await request(app.getHttpServer())
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

  it('should return formatted error response', async () => {
    vi.spyOn(orchestrator, 'getPRMetrics').mockRejectedValueOnce(new Error('Test error'));

    await request(app.getHttpServer())
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

  it('should handle validation errors gracefully', async () => {
    await request(app.getHttpServer())
      .get('/api/metrics/pr?startDate=not-a-date')
      .expect(500)
      .expect((res) => {
        expect(res.body).toHaveProperty('statusCode', 500);
        expect(res.body).toHaveProperty('message');
      });
  });

  it('should respond quickly for simple requests', async () => {
    const start = Date.now();

    await request(app.getHttpServer())
      .get('/api/metrics/pr')
      .expect(200);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });
});
