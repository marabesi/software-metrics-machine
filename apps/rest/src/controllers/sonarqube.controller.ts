import { Controller, Get, Query, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiOkResponse } from '@nestjs/swagger';
import { SonarqubeMeasuresClient, SonarqubeComponentMeasure, SonarqubeRepository } from '@smmachine/core';
import { ComponentTreeQueryDto, QualityMetricsQueryDto } from '../dtos/index';
import { ErrorResponse } from '../dtos/response.dto';

/**
 * SonarQube API Controller
 *
 * Exposes SonarQube endpoints through REST API.
 * Delegates to SonarqubeMeasuresClient for business logic.
 */
@ApiTags('SonarQube')
@Controller('sonarqube')
export class SonarqubeController {
  private readonly logger = new Logger('SonarqubeController');

  constructor(private sonarqubeClient: SonarqubeMeasuresClient, private sonarqubeRepository: SonarqubeRepository) {}

  /**
   * GET /api/measures/component_tree
   * Retrieve component tree metrics from SonarQube
   *
   * Query Parameters:
   * - component: Component key to fetch tree for (defaults to configured project)
   * - depth: Depth of tree traversal (-1 for all depths, default: -1)
   * - metrics: SonarQube metrics to include (e.g., complexity, cognitive_complexity)
   *
   * Example: GET /api/measures/component_tree?component=my:project&depth=-1&metrics=complexity,cognitive_complexity
   */
  @Get('component-tree')
  @ApiOperation({ summary: 'Get component tree with metrics' })
  @ApiQuery({
    name: 'component',
    required: false,
    type: String,
    example: 'my:project',
    description: 'Component key',
  })
  @ApiQuery({
    name: 'depth',
    required: false,
    type: Number,
    example: -1,
    description: 'Depth of tree (-1 for all depths)',
  })
  @ApiQuery({
    name: 'metrics',
    required: false,
    type: [String],
    example: 'complexity,cognitive_complexity',
    description: 'Comma-separated metrics',
  })
  @ApiOkResponse({
    description: 'Component tree retrieved successfully',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Component not found',
    type: ErrorResponse,
  })
  async getComponentTree(
    @Query() query: ComponentTreeQueryDto
  ): Promise<SonarqubeComponentMeasure[]> {
    try {
      this.logger.debug(`Fetching component tree: ${JSON.stringify(query)}`);

      return await this.sonarqubeClient.fetchComponentTree({
        component: query.component,
        depth: query.depth,
        metrics: query.metrics,
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch component tree: ${error}`,
        error instanceof Error ? error.stack : ''
      );
      throw new HttpException(
        `Failed to fetch component tree: ${error instanceof Error ? error.message : String(error)}`,
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

      return await this.sonarqubeRepository.loadComponentTree(measures);
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
