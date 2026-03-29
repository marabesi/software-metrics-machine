import { Controller, Get, Query, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiOkResponse } from '@nestjs/swagger';
import { MetricsOrchestrator } from '@smm/core';
import {
  PRMetricsQueryDto,
  DeploymentMetricsQueryDto,
  CodeMetricsQueryDto,
  IssueMetricsQueryDto,
  QualityMetricsQueryDto,
  FullReportQueryDto,
  PullRequestMetricsResponse,
  DeploymentMetricsResponse,
  CodeMetricsResponse,
  IssueMetricsResponse,
  QualityMetricsResponse,
  FullReportResponse,
  ErrorResponse,
} from './dtos';

/**
 * Metrics API Controller
 *
 * Exposes all metrics through REST endpoints.
 * All endpoints delegate to MetricsOrchestrator for business logic.
 *
 * Each endpoint supports date filtering via query parameters:
 * - startDate: ISO 8601 format (YYYY-MM-DD)
 * - endDate: ISO 8601 format (YYYY-MM-DD)
 */
@ApiTags('Metrics')
@Controller('api/metrics')
export class MetricsController {
  private readonly logger = new Logger('MetricsController');

  constructor(private orchestrator: MetricsOrchestrator) {}

  /**
   * GET /api/metrics/pr
   * Retrieve pull request metrics including lead time, comments, and labels
   *
   * Query Parameters:
   * - startDate: Filter PRs created after this date
   * - endDate: Filter PRs created before this date
   *
   * Example: GET /api/metrics/pr?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('pr')
  @ApiOperation({ summary: 'Get pull request metrics' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2024-12-31' })
  @ApiOkResponse({
    description: 'Pull request metrics retrieved successfully',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
    type: ErrorResponse,
  })
  async getPullRequestMetrics(@Query() query: PRMetricsQueryDto) {
    try {
      this.logger.debug(`Fetching PR metrics: ${JSON.stringify(query)}`);
      return await this.orchestrator.getPRMetrics({
        startDate: query.startDate,
        endDate: query.endDate,
      });
    } catch (error) {
      this.logger.error(`Failed to fetch PR metrics: ${error}`, error instanceof Error ? error.stack : '');
      throw new HttpException(
        `Failed to fetch PR metrics: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/metrics/deployment
   * Retrieve deployment metrics including frequency and job performance
   *
   * Query Parameters:
   * - startDate: Filter deployments after this date
   * - endDate: Filter deployments before this date
   * - frequency: Aggregation frequency (day|week|month), default: week
   *
   * Example: GET /api/metrics/deployment?frequency=day&startDate=2024-01-01
   */
  @Get('deployment')
  @ApiOperation({ summary: 'Get deployment metrics' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2024-12-31' })
  @ApiQuery({ name: 'frequency', required: false, enum: ['day', 'week', 'month'], example: 'week' })
  @ApiOkResponse({
    description: 'Deployment metrics retrieved successfully',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
    type: ErrorResponse,
  })
  async getDeploymentMetrics(@Query() query: DeploymentMetricsQueryDto) {
    try {
      this.logger.debug(`Fetching deployment metrics: ${JSON.stringify(query)}`);
      return await this.orchestrator.getDeploymentMetrics({
        startDate: query.startDate,
        endDate: query.endDate,
        frequency: query.frequency || 'week',
      });
    } catch (error) {
      this.logger.error(`Failed to fetch deployment metrics: ${error}`, error instanceof Error ? error.stack : '');
      throw new HttpException(
        `Failed to fetch deployment metrics: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/metrics/code
   * Retrieve code metrics including pairing index and churn
   *
   * Query Parameters:
   * - selectedAuthors: Filter by specific authors (can be repeated)
   * - startDate: Filter commits after this date
   * - endDate: Filter commits before this date
   *
   * Example: GET /api/metrics/code?selectedAuthors=Alice&selectedAuthors=Bob&startDate=2024-01-01
   */
  @Get('code')
  @ApiOperation({ summary: 'Get code metrics' })
  @ApiQuery({ name: 'selectedAuthors', required: false, type: [String], example: 'Alice' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2024-12-31' })
  @ApiOkResponse({
    description: 'Code metrics retrieved successfully',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
    type: ErrorResponse,
  })
  async getCodeMetrics(@Query() query: CodeMetricsQueryDto) {
    try {
      this.logger.debug(`Fetching code metrics: ${JSON.stringify(query)}`);
      const selectedAuthors = query.selectedAuthors
        ? Array.isArray(query.selectedAuthors)
          ? query.selectedAuthors
          : [query.selectedAuthors]
        : undefined;

      return await this.orchestrator.getCodeMetrics({
        selectedAuthors,
        startDate: query.startDate,
        endDate: query.endDate,
      });
    } catch (error) {
      this.logger.error(`Failed to fetch code metrics: ${error}`, error instanceof Error ? error.stack : '');
      throw new HttpException(
        `Failed to fetch code metrics: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/metrics/issues
   * Retrieve issue metrics from Jira
   *
   * Query Parameters:
   * - status: Filter by issue status (e.g., Done, In Progress)
   * - startDate: Filter issues created after this date
   * - endDate: Filter issues created before this date
   *
   * Example: GET /api/metrics/issues?status=Done&startDate=2024-01-01
   */
  @Get('issues')
  @ApiOperation({ summary: 'Get issue metrics' })
  @ApiQuery({ name: 'status', required: false, type: String, example: 'Done' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2024-12-31' })
  @ApiOkResponse({
    description: 'Issue metrics retrieved successfully',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
    type: ErrorResponse,
  })
  async getIssueMetrics(@Query() query: IssueMetricsQueryDto) {
    try {
      this.logger.debug(`Fetching issue metrics: ${JSON.stringify(query)}`);
      return await this.orchestrator.getIssueMetrics({
        status: query.status,
        startDate: query.startDate,
        endDate: query.endDate,
      });
    } catch (error) {
      this.logger.error(`Failed to fetch issue metrics: ${error}`, error instanceof Error ? error.stack : '');
      throw new HttpException(
        `Failed to fetch issue metrics: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/metrics/quality
   * Retrieve quality metrics from SonarQube
   *
   * Query Parameters:
   * - measures: Specific metrics to retrieve (can be repeated)
   *   Available: coverage, complexity, sqale_rating, duplicated_lines_density, ncloc, vulnerability_rating
   *
   * Example: GET /api/metrics/quality?measures=coverage&measures=complexity
   */
  @Get('quality')
  @ApiOperation({ summary: 'Get code quality metrics' })
  @ApiQuery({ name: 'measures', required: false, type: [String], example: 'coverage' })
  @ApiOkResponse({
    description: 'Quality metrics retrieved successfully',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
    type: ErrorResponse,
  })
  async getQualityMetrics(@Query() query: QualityMetricsQueryDto) {
    try {
      this.logger.debug(`Fetching quality metrics: ${JSON.stringify(query)}`);
      const measures = query.measures
        ? Array.isArray(query.measures)
          ? query.measures
          : [query.measures]
        : undefined;

      return await this.orchestrator.getQualityMetrics(measures);
    } catch (error) {
      this.logger.error(`Failed to fetch quality metrics: ${error}`, error instanceof Error ? error.stack : '');
      throw new HttpException(
        `Failed to fetch quality metrics: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/metrics/report
   * Generate a complete metrics report with all data sources
   *
   * Query Parameters:
   * - startDate: Filter data after this date
   * - endDate: Filter data before this date
   * - selectedAuthors: Filter by specific authors (can be repeated)
   * - status: Filter issues by status
   *
   * Example: GET /api/metrics/report?startDate=2024-01-01&endDate=2024-12-31
   *
   * Returns:
   * - pullRequests: PR metrics
   * - deployment: Deployment metrics
   * - code: Code metrics
   * - issues: Issue metrics
   * - quality: Quality metrics
   * - timestamp: Report generation time
   * - filters: Applied filters
   */
  @Get('report')
  @ApiOperation({ summary: 'Get complete metrics report' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2024-12-31' })
  @ApiQuery({ name: 'selectedAuthors', required: false, type: [String], example: 'Alice' })
  @ApiQuery({ name: 'status', required: false, type: String, example: 'Done' })
  @ApiOkResponse({
    description: 'Complete metrics report retrieved successfully',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
    type: ErrorResponse,
  })
  async getFullReport(@Query() query: FullReportQueryDto) {
    try {
      this.logger.debug(`Fetching full report: ${JSON.stringify(query)}`);
      const selectedAuthors = query.selectedAuthors
        ? Array.isArray(query.selectedAuthors)
          ? query.selectedAuthors
          : [query.selectedAuthors]
        : undefined;

      return await this.orchestrator.getFullReport({
        startDate: query.startDate,
        endDate: query.endDate,
        selectedAuthors,
        status: query.status,
      });
    } catch (error) {
      this.logger.error(`Failed to fetch full report: ${error}`, error instanceof Error ? error.stack : '');
      throw new HttpException(
        `Failed to fetch full report: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
