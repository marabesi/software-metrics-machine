/**
 * Dashboard controllers are split by domain to keep files focused and maintainable.
 *
 * - Code metrics: ./controllers/code.controller
 * - Pipeline metrics: ./controllers/pipelines.controller
 * - Pull request metrics: ./controllers/pull-requests.controller
 * - Configuration: ./controllers/configuration.controller
 */
export { CodeController } from './controllers/code.controller';
export { PipelinesController } from './controllers/pipelines.controller';
export { PullRequestsController } from './controllers/pull-requests.controller';
export { ConfigurationController } from './controllers/configuration.controller';
