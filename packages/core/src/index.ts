/**
 * Core business logic for Software Metrics Machine
 *
 * Mirrors the structure from api/src/software_metrics_machine/
 * organized into:
 * - infrastructure: Configuration, repos, external service clients
 * - domain: Business logic services, aggregates, calculations
 * - providers: Integrations with GitHub, GitLab, Jira, SonarQube, Git, CodeMaat
 * - aggregates: Repository adapters, orchestrators
 */

export * from './infrastructure/index.js';
export * from './domain/index.js';
export * from './providers/index.js';
export * from './aggregates/index.js';
