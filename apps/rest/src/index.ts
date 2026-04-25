/**
 * Main entry point for the REST API package
 * Exports all public modules and components
 */

export { MetricsController } from './metrics.controller.js';
export { MetricsModule } from './metrics.module.js';
export * from './dtos/index.js';
export { HttpExceptionFilter, AllExceptionsFilter } from './filters/http-exception.filter.js';
export { LoggingMiddleware } from './middleware/logging.middleware.js';
export { setupSwagger } from './config/swagger.config.js';
