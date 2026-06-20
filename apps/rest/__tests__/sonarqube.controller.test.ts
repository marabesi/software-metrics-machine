import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SonarqubeRepository } from '@smmachine/core';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { SonarqubeController } from '../src/controllers/sonarqube.controller';
import { HttpExceptionFilter, AllExceptionsFilter } from '../src/filters/http-exception.filter';
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

describe('Sonarqube controller', () => {
  let app: INestApplication;
  const sonarqubeRepository = {
    loadAllComponentTreeEntries: vi.fn().mockResolvedValue([
      {
        fetchedAt: '2024-01-01T00:00:00.000Z',
        data: [],
      },
    ]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SonarqubeController],
      providers: [
        {
          provide: SonarqubeRepository,
          useValue: sonarqubeRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('should accept project when loading component tree history', async () => {
    await request(app.getHttpServer())
      .get('/sonarqube/component-tree/history?project=vercel%2Fnext.js&remove_folders=true')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual([
          {
            fetchedAt: '2024-01-01T00:00:00.000Z',
            data: [],
          },
        ]);
        expect(sonarqubeRepository.loadAllComponentTreeEntries).toHaveBeenCalledWith({
          component: undefined,
          depth: undefined,
          metrics: undefined,
          ignore_files: undefined,
          include_files: undefined,
          remove_folders: true,
        });
      });
  });
});
