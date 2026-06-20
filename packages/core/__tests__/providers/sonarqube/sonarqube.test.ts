import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SonarqubeMeasuresClient } from '../../../src/providers/sonarqube/sonarqube-client';
import { MockLoggerBuilder } from '../../mock-logger-builder';

vi.mock('axios');

const mockGet = vi.fn();
const logger = new MockLoggerBuilder().build();

describe('SonarqubeMeasuresClient', () => {
  let client: SonarqubeMeasuresClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axios.create).mockReturnValue({
      get: mockGet,
    } as any);

    mockGet.mockResolvedValue({
      data: {
        component: {
          key: 'project-key',
          measures: [],
        },
      },
    });

    client = new SonarqubeMeasuresClient(
      'https://sonarqube.example.com',
      'sonar-token',
      'project-key',
      logger
    );
  });

  it('should initialize self-hosted with Basic auth', () => {
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://sonarqube.example.com',
        timeout: 30000,
        auth: { username: 'sonar-token', password: '' },
      })
    );
  });

  it('should initialize sonarcloud.io with query token', () => {
    new SonarqubeMeasuresClient('https://sonarcloud.io', 'sonar-token', 'project-key', logger);
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://sonarcloud.io',
        timeout: 30000,
        params: { token: 'sonar-token' },
      })
    );
  });

  it('should fetch component measures', async () => {
    const measures = await client.fetchComponentMeasures({
      metrics: ['coverage', 'complexity'],
    });

    expect(measures).toBeDefined();
    expect(measures.key).toBe('project-key');
    expect(Array.isArray(measures.measures)).toBe(true);
    expect(mockGet).toHaveBeenCalledWith('/api/measures/component', {
      params: {
        component: 'project-key',
        metricKeys: 'coverage,complexity',
      },
    });
  });

  it('should fetch historical coverage measures with metric and timestamp fields', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        measures: [
          {
            metric: 'coverage',
            history: [
              { date: '2024-01-01T00:00:00+0000', value: '81.3' },
              { date: '2024-02-01T00:00:00+0000', value: '82.1' },
            ],
          },
        ],
      },
    });

    const measures = await client.fetchHistoricalMeasures({
      metrics: ['coverage'],
      startDate: '2024-01-01',
      endDate: '2024-02-29',
    });

    expect(measures).toEqual([
      {
        key: 'coverage_2024-01-01T00:00:00+0000',
        name: 'coverage on 2024-01-01T00:00:00+0000',
        metric: 'coverage',
        value: '81.3',
        formatter: 'PERCENT',
        timestamp: '2024-01-01T00:00:00+0000',
      },
      {
        key: 'coverage_2024-02-01T00:00:00+0000',
        name: 'coverage on 2024-02-01T00:00:00+0000',
        metric: 'coverage',
        value: '82.1',
        formatter: 'PERCENT',
        timestamp: '2024-02-01T00:00:00+0000',
      },
    ]);
    expect(mockGet).toHaveBeenCalledWith('/api/measures/search_history', {
      params: {
        component: 'project-key',
        metrics: 'coverage',
        from: '2024-01-01',
        to: '2024-02-29',
        p: 1,
        ps: 100,
      },
    });
  });

  it('should map 401 errors to auth error message', async () => {
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 401 },
      code: undefined,
    });
    mockGet.mockRejectedValueOnce(axiosError);
    vi.mocked(axios.isAxiosError).mockReturnValueOnce(true);

    await expect(client.fetchComponentMeasures()).rejects.toThrow(
      'SonarQube authentication failed. Check token.'
    );
  });

  it('should use strategy=all for self-hosted component tree', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        baseComponent: { key: 'project-key', measures: [] },
        components: [],
      },
    });

    await client.fetchComponentTree();

    expect(mockGet).toHaveBeenCalledWith('/api/measures/component_tree', {
      params: expect.objectContaining({ strategy: 'all' }),
    });
  });

  it('should use depth param for sonarcloud.io component tree', async () => {
    const sonarCloudClient = new SonarqubeMeasuresClient(
      'https://sonarcloud.io',
      'sonar-token',
      'project-key',
      logger
    );
    mockGet.mockResolvedValueOnce({
      data: {
        baseComponent: { key: 'project-key', measures: [] },
        components: [],
      },
    });

    await sonarCloudClient.fetchComponentTree();

    const callParams = mockGet.mock.calls[0][1].params;
    expect(callParams).toHaveProperty('depth', -1);
    expect(callParams).not.toHaveProperty('strategy');
  });
});
