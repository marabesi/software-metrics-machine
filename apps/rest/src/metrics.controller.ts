import { Controller, Get, Query, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiOkResponse } from '@nestjs/swagger';
import { MetricsOrchestrator } from '@smmachine/core';
import {
  IssueMetricsQueryDto,
  PRMetricsQueryDto,
  DeploymentMetricsQueryDto,
  CodeMetricsQueryDto,
  QualityMetricsQueryDto,
} from './dtos/index';
import {
  ErrorResponse,
  MetricsIssueResponse,
  MetricsPRResponse,
  MetricsDeploymentResponse,
  MetricsCodeResponse,
  MetricsQualityResponse,
  MetricsFullReportResponse,
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
@Controller('')
export class MetricsController {
  private readonly logger = new Logger('MetricsController');

  constructor(private orchestrator: MetricsOrchestrator) {}

  /**
   * GET /api/metrics/issues
   * Retrieve issue metrics from Jira
   */
  @Get('api/metrics/issues')
  @ApiOperation({ summary: 'Get issue metrics' })
  @ApiQuery({ name: 'status', required: false, type: String, example: 'Done' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2024-12-31' })
  @ApiOkResponse({ description: 'Issue metrics retrieved successfully', type: Object })
  @ApiResponse({ status: 400, description: 'Invalid query parameters', type: ErrorResponse })
  async getIssueMetrics(@Query() query: IssueMetricsQueryDto): Promise<MetricsIssueResponse> {
    try {
      this.logger.debug(`Fetching issue metrics: ${JSON.stringify(query)}`);
      return (await this.orchestrator.getIssueMetrics({
        status: query.status,
        startDate: query.startDate,
        endDate: query.endDate,
      })) as MetricsIssueResponse;
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
   * GET /api/metrics/pr
   * Retrieve pull request metrics
   */
  @Get('api/metrics/pr')
  @ApiOperation({ summary: 'Get pull request metrics' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2024-12-31' })
  @ApiOkResponse({ description: 'Pull request metrics retrieved successfully', type: Object })
  @ApiResponse({ status: 500, description: 'Internal server error', type: ErrorResponse })
  async getPRMetrics(@Query() query: PRMetricsQueryDto): Promise<MetricsPRResponse> {
    try {
      this.logger.debug(`Fetching PR metrics: ${JSON.stringify(query)}`);
      return (await this.orchestrator.getPRMetrics({
        startDate: query.startDate,
        endDate: query.endDate,
      })) as MetricsPRResponse;
    } catch (error) {
      this.logger.error(
        `Failed to fetch PR metrics: ${error}`,
        error instanceof Error ? error.stack : ''
      );
      throw new HttpException(
        {
          error: `Failed to fetch PR metrics: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/metrics/deployment
   * Retrieve deployment/pipeline metrics
   */
  @Get('api/metrics/deployment')
  @ApiOperation({ summary: 'Get deployment metrics' })
  @ApiQuery({ name: 'frequency', required: false, enum: ['day', 'week', 'month'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiOkResponse({ description: 'Deployment metrics retrieved successfully', type: Object })
  @ApiResponse({ status: 500, description: 'Internal server error', type: ErrorResponse })
  async getDeploymentMetrics(
    @Query() query: DeploymentMetricsQueryDto
  ): Promise<MetricsDeploymentResponse> {
    try {
      this.logger.debug(`Fetching deployment metrics: ${JSON.stringify(query)}`);
      return (await this.orchestrator.getDeploymentMetrics({
        frequency: query.frequency,
        startDate: query.startDate,
        endDate: query.endDate,
      })) as MetricsDeploymentResponse;
    } catch (error) {
      this.logger.error(
        `Failed to fetch deployment metrics: ${error}`,
        error instanceof Error ? error.stack : ''
      );
      throw new HttpException(
        `Failed to fetch deployment metrics: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/metrics/code
   * Retrieve code metrics
   */
  @Get('api/metrics/code')
  @ApiOperation({ summary: 'Get code metrics' })
  @ApiQuery({ name: 'selectedAuthors', required: false, type: [String] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiOkResponse({ description: 'Code metrics retrieved successfully', type: Object })
  @ApiResponse({ status: 500, description: 'Internal server error', type: ErrorResponse })
  async getCodeMetrics(@Query() query: CodeMetricsQueryDto): Promise<MetricsCodeResponse> {
    try {
      this.logger.debug(`Fetching code metrics: ${JSON.stringify(query)}`);
      return (await this.orchestrator.getCodeMetrics({
        selectedAuthors: query.selectedAuthors,
        startDate: query.startDate,
        endDate: query.endDate,
      })) as MetricsCodeResponse;
    } catch (error) {
      this.logger.error(
        `Failed to fetch code metrics: ${error}`,
        error instanceof Error ? error.stack : ''
      );
      throw new HttpException(
        `Failed to fetch code metrics: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/metrics/quality
   * Retrieve quality metrics from SonarQube
   */
  @Get('api/metrics/quality')
  @ApiOperation({ summary: 'Get quality metrics' })
  @ApiQuery({ name: 'measures', required: false, type: [String] })
  @ApiOkResponse({ description: 'Quality metrics retrieved successfully', type: Object })
  @ApiResponse({ status: 500, description: 'Internal server error', type: ErrorResponse })
  async getQualityMetrics(@Query() query: QualityMetricsQueryDto): Promise<MetricsQualityResponse> {
    try {
      this.logger.debug(`Fetching quality metrics: ${JSON.stringify(query)}`);
      return (await this.orchestrator.getQualityMetrics(query.measures)) as MetricsQualityResponse;
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

  /**
   * GET /api/metrics/report
   * Retrieve complete metrics report
   */
  @Get('api/metrics/report')
  @ApiOperation({ summary: 'Get complete metrics report' })
  @ApiOkResponse({ description: 'Complete metrics report', type: Object })
  @ApiResponse({ status: 500, description: 'Internal server error', type: ErrorResponse })
  async getFullReport(): Promise<MetricsFullReportResponse> {
    try {
      this.logger.debug('Fetching full metrics report');
      return (await this.orchestrator.getFullReport()) as MetricsFullReportResponse;
    } catch (error) {
      this.logger.error(
        `Failed to fetch full report: ${error}`,
        error instanceof Error ? error.stack : ''
      );
      throw new HttpException(
        `Failed to fetch full report: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
