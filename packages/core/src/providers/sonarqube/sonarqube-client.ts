import axios, { AxiosInstance } from 'axios';
import { Logger } from '@smmachine/utils';

export interface CodeMetric {
  key: string;
  name: string;
  value: string | number;
  formatter: string;
}

export interface SonarqubeComponentMeasure {
  key: string;
  name: string;
  measures: CodeMetric[];
}

export interface ISonarqubeMeasuresClient {
  fetchComponentMeasures(options?: { metrics?: string[] }): Promise<SonarqubeComponentMeasure>;

  fetchHistoricalMeasures(options?: {
    metrics?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<CodeMetric[]>;

  fetchComponentTree(options?: {
    component?: string;
    depth?: number;
    metrics?: string[];
  }): Promise<SonarqubeComponentMeasure[]>;
}

/**
 * SonarQube API client for Code Quality Metrics
 * Real implementation using SonarQube Web API
 * Endpoints utilized:
 *   - GET /api/measures/component - Get current component measures
 *   - GET /api/measures/search_history - Get historical measures over time
 * Auth: Bearer token (query parameter)
 */
export class SonarqubeMeasuresClient implements ISonarqubeMeasuresClient {
  private axiosInstance: AxiosInstance;
  private logger: Logger;

  constructor(
    private url: string,
    private token: string,
    private projectKey: string
  ) {
    this.logger = new Logger('SonarqubeMeasuresClient');

    // Ensure URL ends without slash for consistency
    const baseURL = this.url.endsWith('/') ? this.url.slice(0, -1) : this.url;

    this.axiosInstance = axios.create({
      baseURL,
      params: {
        token: this.token,
      },
      timeout: 30000,
    });
  }

  async fetchComponentMeasures(options?: {
    metrics?: string[];
  }): Promise<SonarqubeComponentMeasure> {
    try {
      // Default metrics if not specified
      const metrics = options?.metrics || [
        'ncloc', // Non-Commented Lines of Code
        'complexity', // Cyclomatic complexity
        'sqale_rating', // Maintainability rating
        'coverage', // Code coverage
        'duplicated_lines_density', // Duplication density
        'vulnerability_rating', // Security rating
      ];

      this.logger.info(
        `Fetching SonarQube metrics for project ${this.projectKey}: ${metrics.join(', ')}`
      );

      const response = await this.axiosInstance.get('/api/measures/component', {
        params: {
          component: this.projectKey,
          metricKeys: metrics.join(','),
        },
      });

      const { component } = response.data;

      if (!component) {
        throw new Error(`Project ${this.projectKey} not found in SonarQube.`);
      }

      this.logger.info(
        `Fetched ${(component.measures || []).length} metrics for project ${this.projectKey}`
      );

      return component;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to fetch SonarQube measures: ${errorMsg}`);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('SonarQube authentication failed. Check token.');
        } else if (error.response?.status === 404) {
          throw new Error(`SonarQube project ${this.projectKey} not found.`);
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('SonarQube API request timeout (30s).');
        }
      }

      throw error;
    }
  }

  async fetchHistoricalMeasures(options?: {
    metrics?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<CodeMetric[]> {
    try {
      // Default metrics if not specified
      const metrics = options?.metrics || ['sqale_rating', 'coverage', 'duplicated_lines_density'];

      this.logger.info(
        `Fetching SonarQube historical metrics for project ${this.projectKey}` +
          (options?.startDate ? ` from ${options.startDate}` : '') +
          (options?.endDate ? ` to ${options.endDate}` : '')
      );

      const response = await this.axiosInstance.get('/api/measures/search_history', {
        params: {
          component: this.projectKey,
          metrics: metrics.join(','),
          ...(options?.startDate && { from: options.startDate }),
          ...(options?.endDate && { to: options.endDate }),
          p: 1, // First page
          ps: 100, // Max 100 results per page
        },
      });

      const { measures } = response.data;

      if (!measures || measures.length === 0) {
        this.logger.warn(`No historical measures found for project ${this.projectKey}`);
        return [];
      }

      // Flatten measurements
      const flatMeasures: CodeMetric[] = [];
      for (const measure of measures) {
        for (const history of measure.history || []) {
          flatMeasures.push({
            key: `${measure.metric}_${history.date}`,
            name: `${measure.metric} on ${history.date}`,
            value: history.value || 0,
            formatter: 'PERCENT', // Default formatter
          });
        }
      }

      this.logger.info(
        `Fetched ${flatMeasures.length} historical measurements for project ${this.projectKey}`
      );

      return flatMeasures;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to fetch SonarQube historical measures: ${errorMsg}`);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('SonarQube authentication failed. Check token.');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('SonarQube API request timeout (30s).');
        }
      }

      throw error;
    }
  }

  async fetchComponentTree(options?: {
    component?: string;
    depth?: number;
    metrics?: string[];
  }): Promise<SonarqubeComponentMeasure[]> {
    try {
      const component = options?.component || this.projectKey;
      const depth = options?.depth ?? -1; // -1 means all depths
      const metrics = options?.metrics || [
        'complexity',
        'cognitive_complexity',
        'ncloc',
        'sqale_rating',
        'coverage',
      ];

      this.logger.info(
        `Fetching SonarQube component tree for component ${component} ` +
          `with depth ${depth}: ${metrics.join(', ')}`
      );

      const response = await this.axiosInstance.get('/api/measures/component_tree', {
        params: {
          component,
          depth,
          metricKeys: metrics.join(','),
          ps: 500, // Max results per page
        },
      });

      const { baseComponent, components } = response.data;

      if (!baseComponent) {
        throw new Error(`Component ${component} not found in SonarQube.`);
      }

      const allComponents = [baseComponent, ...(components || [])];

      this.logger.info(
        `Fetched component tree with ${allComponents.length} components for ${component}`
      );

      return allComponents;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to fetch SonarQube component tree: ${errorMsg}`);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('SonarQube authentication failed. Check token.');
        } else if (error.response?.status === 404) {
          throw new Error(`SonarQube component ${options?.component || this.projectKey} not found.`);
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('SonarQube API request timeout (30s).');
        }
      }

      throw error;
    }
  }
}
