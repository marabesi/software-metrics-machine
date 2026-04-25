/**
 * Provider Integrations
 * 
 * Clients for integrating with external services:
 * - GitHub: PRs, workflows, jobs
 * - GitLab: Merge requests, pipelines, jobs
 * - Jira: Issues, changelogs, comments
 * - SonarQube: Code quality metrics
 * - Git (local): Commit analysis with co-author detection
 * - CodeMaat: Code metrics from analysis
 */

export * from './github/index.js';
export * from './gitlab/index.js';
export * from './jira/index.js';
export * from './sonarqube/index.js';
export * from './git/index.js';
export * from './codemaat/index.js';
