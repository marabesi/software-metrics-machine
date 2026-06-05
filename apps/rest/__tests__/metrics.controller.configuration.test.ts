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
});
