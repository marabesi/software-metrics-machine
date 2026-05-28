import { Controller, Get, Query, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiOkResponse } from '@nestjs/swagger';
import { SonarqubeMeasuresClient, SonarqubeComponentMeasure, SonarqubeRepository } from '@smmachine/core';
import { ComponentTreeQueryDto, QualityMetricsQueryDto } from '../dtos/index';
import { ErrorResponse } from '../dtos/response.dto';
import path from 'path';

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

  constructor(private sonarqubeRepository: SonarqubeRepository) {}

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
  @ApiQuery({
    name: 'ignore_files',
    required: false,
    type: [String],
    example: '*.test.ts,node_modules/*',
    description: 'Comma-separated file/component ignore patterns (supports glob)',
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
      this.logger.debug(`Loading component tree: ${JSON.stringify(query)}`);

      const components = await this.sonarqubeRepository.loadComponentTree({
        component: query.component,
        depth: query.depth,
        metrics: query.metrics,
      });

      const ignorePatterns = query.ignore_files || [];
      if (ignorePatterns.length === 0) {
        return components;
      }

      return components.filter((component) => {
        const key = component.key || '';
        const name = component.name || '';
        return !this.matchesIgnore(key, ignorePatterns) && !this.matchesIgnore(name, ignorePatterns);
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
      this.logger.debug(`Loading quality metrics: ${JSON.stringify(query)}`);
      const measures = query.measures
        ? Array.isArray(query.measures)
          ? query.measures
          : [query.measures]
        : undefined;

      return await this.sonarqubeRepository.loadAll(measures);
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

  private matchesIgnore(entity: string, ignorePatterns: string[]): boolean {
    if (!entity || ignorePatterns.length === 0) {
      return false;
    }

    return ignorePatterns.some((pattern) => this.matchesPattern(entity, pattern));
  }

  private matchesPattern(entity: string, pattern: string): boolean {
    const normalizedEntity = entity.toLowerCase().replace(/\\/g, '/');
    const normalizedPattern = pattern.toLowerCase();

    if (!this.containsGlobToken(normalizedPattern)) {
      return normalizedEntity.includes(normalizedPattern);
    }

    const regex = this.globToRegExp(normalizedPattern);

    if (!normalizedPattern.includes('/')) {
      const basename = path.posix.basename(normalizedEntity);
      return regex.test(basename);
    }

    return regex.test(normalizedEntity);
  }

  private containsGlobToken(value: string): boolean {
    return /[*?[\]]/.test(value);
  }

  private globToRegExp(globPattern: string): RegExp {
    let regexPattern = '^';

    for (let index = 0; index < globPattern.length; index += 1) {
      const current = globPattern[index];
      const next = globPattern[index + 1];

      if (current === '*' && next === '*') {
        regexPattern += '.*';
        index += 1;
        continue;
      }

      if (current === '*') {
        regexPattern += '[^/]*';
        continue;
      }

      if (current === '?') {
        regexPattern += '[^/]';
        continue;
      }

      regexPattern += current.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
    }

    regexPattern += '$';
    return new RegExp(regexPattern);
  }
}
