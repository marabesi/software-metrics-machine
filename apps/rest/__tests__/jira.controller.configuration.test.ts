import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createMetricsTestApp, MockedMetricsOrchestrator } from './helpers/metrics-test-app';

describe('Jira', () => {
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
});
