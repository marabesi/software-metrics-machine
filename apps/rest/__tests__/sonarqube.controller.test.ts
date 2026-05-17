import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createMetricsTestApp, MockedMetricsOrchestrator } from './helpers/metrics-test-app';

describe('Sonarqube', () => {
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
});
