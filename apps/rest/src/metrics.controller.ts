import { Controller, Get, Query, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiOkResponse } from '@nestjs/swagger';
import { MetricsOrchestrator } from '@smmachine/core';
import {
  PRMetricsQueryDto,
  DeploymentMetricsQueryDto,
  CodeMetricsQueryDto,
  IssueMetricsQueryDto,
  QualityMetricsQueryDto,
  FullReportQueryDto,
} from './dtos/index';
import {
  PullRequestMetricsResponse,
  DeploymentMetricsResponse,
  CodeMetricsResponse,
  IssueMetricsResponse,
  QualityMetricsResponse,
  FullReportResponse,
  ErrorResponse,
} from './dtos/response.dto';

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
      this.logger.error(
        `Failed to fetch issue metrics: ${error}`,
        error instanceof Error ? error.stack : ''
      );
      throw new HttpException(
        `Failed to fetch issue metrics: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
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
      this.logger.error(
        `Failed to fetch quality metrics: ${error}`,
        error instanceof Error ? error.stack : ''
      );
      throw new HttpException(
        `Failed to fetch quality metrics: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
