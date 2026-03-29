import { IsOptional, IsDateString, IsEnum, IsArray, IsString } from 'class-validator';

/**
 * Base DTO for common query parameters
 */
export class BaseQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

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
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  frequency?: 'day' | 'week' | 'month' = 'week';
}

/**
 * Code Metrics Query DTO
 */
export class CodeMetricsQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedAuthors?: string[];
}

/**
 * Issue Metrics Query DTO
 */
export class IssueMetricsQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  status?: string;
}

/**
 * Quality Metrics Query DTO
 */
export class QualityMetricsQueryDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  measures?: string[];
}

/**
 * Full Report Query DTO
 */
export class FullReportQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedAuthors?: string[];

  @IsOptional()
  @IsString()
  status?: string;
}
