import { IsOptional, IsDateString, IsEnum, IsArray, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

function normalizeArrayQueryParam(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Base DTO for common query parameters
 */
export class BaseQueryDto {
  @ApiPropertyOptional({ description: 'Start date in ISO 8601 format (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date in ISO 8601 format (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * Pull Request Metrics Query DTO
 */
export class PRMetricsQueryDto extends BaseQueryDto {}

/**
 * Deployment Metrics Query DTO
 */
export class DeploymentMetricsQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    enum: ['day', 'week', 'month'],
    default: 'week',
    description: 'Frequency for deployment metrics aggregation',
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  frequency?: 'day' | 'week' | 'month' = 'week';
}

/**
 * Code Metrics Query DTO
 */
export class CodeMetricsQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Filter by selected authors',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedAuthors?: string[];
}

/**
 * Issue Metrics Query DTO
 */
export class IssueMetricsQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: 'Filter by issue status' })
  @IsOptional()
  @IsString()
  status?: string;
}

/**
 * Quality Metrics Query DTO
 */
export class QualityMetricsQueryDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'SonarQube measures to retrieve',
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => normalizeArrayQueryParam(value))
  @IsArray()
  @IsString({ each: true })
  measures?: string[];
}

/**
 * SonarQube Component Tree Query DTO
 */
export class ComponentTreeQueryDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Component key to fetch tree for',
  })
  @IsOptional()
  @IsString()
  component?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Depth of tree traversal (-1 for all depths)',
    default: -1,
  })
  @IsOptional()
  depth?: number;

  @ApiPropertyOptional({
    type: [String],
    description: 'SonarQube metrics to include in component tree',
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => normalizeArrayQueryParam(value))
  @IsArray()
  @IsString({ each: true })
  metrics?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'File/component patterns to ignore (supports CSV and glob patterns)',
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => normalizeArrayQueryParam(value))
  @IsArray()
  @IsString({ each: true })
  ignore_files?: string[];
}

/**
 * Full Report Query DTO
 */
export class FullReportQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Filter by selected authors',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedAuthors?: string[];

  @ApiPropertyOptional({ description: 'Filter by issue status' })
  @IsOptional()
  @IsString()
  status?: string;
}
