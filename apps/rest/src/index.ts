/**
 * Main entry point for the REST API package
 * Exports all public modules and components
 */

export { MetricsController } from './metrics.controller';
export { MetricsModule } from './metrics.module';
export * from './dtos';
export { HttpExceptionFilter, AllExceptionsFilter } from './filters/http-exception.filter';
export { LoggingMiddleware } from './middleware/logging.middleware';
export { setupSwagger } from './config/swagger.config';
