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

export * from './github';
export * from './gitlab';
export * from './jira';
export * from './sonarqube';
export * from './git';
export * from './codemaat';
