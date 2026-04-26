import { Command } from 'commander';
import { Logger } from '@smm/utils';
import {
  CommitTraverser,
  CodemaatAnalyzer,
  CodeMetricsRepository,
  Configuration,
} from '@smm/core';
import { createOrchestrator } from '../orchestrator-factory.js';

const logger = new Logger('CodeCommand');

/**
 * Code Command Group
 *
 * Provides CLI commands for code analysis operations matching Python CLI functionality.
 *
 * Commands:
 *   smm code change-set         Analyze change sets using PyDriller
 *   smm code codemaat-fetch     Fetch code metrics using CodeMaat
 *   smm code churn              Calculate code churn
 *   smm code coupling           Analyze code coupling
 *   smm code entity-churn       Calculate entity churn
 *   smm code entity-effort      Calculate entity effort
 *   smm code entity-ownership   Analyze entity ownership
 *   smm code pairing-index      Calculate developer pairing index
 *   smm code metadata           View code metadata
 */
export function createCodeCommands(program: Command): void {
  const codeGroup = program.command('code').description('Code analysis operations');

  /**
   * smm code change-set [options]
   * Analyze change sets using PyDriller/Git traversal
   */
  codeGroup
    .command('change-set')
    .description('Analyze change sets from git repository')
    .option('--repo <path>', 'Path to git repository')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--authors <list>', 'Comma-separated list of authors to filter')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('🔍 Analyzing change sets...');

        const orchestrator = createOrchestrator();
        const config = orchestrator.getConfiguration();
        const repoPath = options.repo || config.gitRepositoryLocation || '.';

        const traverser = new CommitTraverser(repoPath);
        const commits = await traverser.traverse({
          startDate: options.startDate,
          endDate: options.endDate,
          authors: options.authors ? options.authors.split(',').map((a: string) => a.trim()) : undefined,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify({ commits: commits.length }, null, 2));
        } else {
          console.log('\n=== Change Set Analysis ===\n');
          console.log(`Repository: ${repoPath}`);
          console.log(`Total Commits: ${commits.length}`);
          if (options.startDate) console.log(`Start Date: ${options.startDate}`);
          if (options.endDate) console.log(`End Date: ${options.endDate}`);
        }
      } catch (error) {
        logger.error('Failed to analyze change sets', error);
        process.exit(1);
      }
    });

  /**
   * smm code codemaat-fetch [options]
   * Fetch code metrics using CodeMaat analyzer
   */
  codeGroup
    .command('codemaat-fetch')
    .description('Fetch code metrics using CodeMaat')
    .option('--repo <path>', 'Path to git repository')
    .option('--analysis <type>', 'Analysis type (summary|coupling|churn)', 'summary')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('🔍 Running CodeMaat analysis...');

        const orchestrator = createOrchestrator();
        const config = orchestrator.getConfiguration();
        const repoPath = options.repo || config.gitRepositoryLocation || '.';

        const analyzer = new CodemaatAnalyzer(repoPath);
        const results = await analyzer.analyze({
          analysisType: options.analysis,
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(results, null, 2));
        } else {
          console.log('\n=== CodeMaat Analysis ===\n');
          console.log(`Repository: ${repoPath}`);
          console.log(`Analysis Type: ${options.analysis}`);
          console.log(`Results: ${JSON.stringify(results, null, 2)}`);
        }
      } catch (error) {
        logger.error('Failed to run CodeMaat analysis', error);
        process.exit(1);
      }
    });

  /**
   * smm code churn [options]
   * Calculate code churn metrics
   */
  codeGroup
    .command('churn')
    .description('Calculate code churn metrics')
    .option('--repo <path>', 'Path to git repository')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--authors <list>', 'Comma-separated list of authors to filter')
    .option('--output <format>', 'Output format (text|json|csv)', 'text')
    .action(async (options) => {
      try {
        console.log('📊 Calculating code churn...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getCodeMetrics({
          selectedAuthors: options.authors ? options.authors.split(',').map((a: string) => a.trim()) : undefined,
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== Code Churn Metrics ===\n');
          console.log(`Total Commits: ${metrics.totalCommits}`);
          console.log(`Files Changed: ${metrics.filesChanged}`);
          console.log(`Lines Added: ${metrics.linesAdded}`);
          console.log(`Lines Removed: ${metrics.linesRemoved}`);
          console.log(`Churn: ${metrics.churn}`);
        }
      } catch (error) {
        logger.error('Failed to calculate code churn', error);
        process.exit(1);
      }
    });

  /**
   * smm code coupling [options]
   * Analyze code coupling between modules
   */
  codeGroup
    .command('coupling')
    .description('Analyze code coupling between modules')
    .option('--repo <path>', 'Path to git repository')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--min-coupling <number>', 'Minimum coupling threshold', '0.3')
    .option('--output <format>', 'Output format (text|json|csv)', 'text')
    .action(async (options) => {
      try {
        console.log('🔗 Analyzing code coupling...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getCodeMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify({ coupling: metrics.coupling || [] }, null, 2));
        } else {
          console.log('\n=== Code Coupling Analysis ===\n');
          console.log(`Min Coupling Threshold: ${options.minCoupling}`);
          console.log('\nNote: Detailed coupling analysis requires enhanced implementation');
        }
      } catch (error) {
        logger.error('Failed to analyze code coupling', error);
        process.exit(1);
      }
    });

  /**
   * smm code entity-churn [options]
   * Calculate entity-level churn metrics
   */
  codeGroup
    .command('entity-churn')
    .description('Calculate entity-level churn metrics')
    .option('--repo <path>', 'Path to git repository')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--top <number>', 'Show top N entities', '20')
    .option('--output <format>', 'Output format (text|json|csv)', 'text')
    .action(async (options) => {
      try {
        console.log('📊 Calculating entity churn...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getCodeMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify({ entityChurn: metrics.entityChurn || [] }, null, 2));
        } else {
          console.log('\n=== Entity Churn Metrics ===\n');
          console.log(`Top Entities: ${options.top}`);
          console.log(`Total Churn: ${metrics.churn}`);
        }
      } catch (error) {
        logger.error('Failed to calculate entity churn', error);
        process.exit(1);
      }
    });

  /**
   * smm code entity-effort [options]
   * Calculate entity effort metrics
   */
  codeGroup
    .command('entity-effort')
    .description('Calculate entity effort metrics')
    .option('--repo <path>', 'Path to git repository')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--top <number>', 'Show top N entities', '20')
    .option('--output <format>', 'Output format (text|json|csv)', 'text')
    .action(async (options) => {
      try {
        console.log('⏱️  Calculating entity effort...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getCodeMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify({ entityEffort: metrics.entityEffort || [] }, null, 2));
        } else {
          console.log('\n=== Entity Effort Metrics ===\n');
          console.log(`Top Entities: ${options.top}`);
          console.log('\nNote: Detailed effort calculation requires enhanced implementation');
        }
      } catch (error) {
        logger.error('Failed to calculate entity effort', error);
        process.exit(1);
      }
    });

  /**
   * smm code entity-ownership [options]
   * Analyze entity ownership by developers
   */
  codeGroup
    .command('entity-ownership')
    .description('Analyze entity ownership by developers')
    .option('--repo <path>', 'Path to git repository')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--entity <path>', 'Specific entity/file to analyze')
    .option('--output <format>', 'Output format (text|json|csv)', 'text')
    .action(async (options) => {
      try {
        console.log('👥 Analyzing entity ownership...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getCodeMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify({ ownership: metrics.ownership || {} }, null, 2));
        } else {
          console.log('\n=== Entity Ownership Analysis ===\n');
          if (options.entity) {
            console.log(`Entity: ${options.entity}`);
          }
          console.log('\nNote: Detailed ownership analysis requires enhanced implementation');
        }
      } catch (error) {
        logger.error('Failed to analyze entity ownership', error);
        process.exit(1);
      }
    });

  /**
   * smm code pairing-index [options]
   * Calculate developer pairing index
   */
  codeGroup
    .command('pairing-index')
    .description('Calculate developer pairing index')
    .option('--repo <path>', 'Path to git repository')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--min-shared <number>', 'Minimum shared commits', '2')
    .option('--output <format>', 'Output format (text|json|csv)', 'text')
    .action(async (options) => {
      try {
        console.log('👥 Calculating developer pairing index...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getCodeMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify({ pairingIndex: metrics.pairingIndex || [] }, null, 2));
        } else {
          console.log('\n=== Developer Pairing Index ===\n');
          console.log(`Min Shared Commits: ${options.minShared}`);
          console.log('\nNote: Pairing analysis requires enhanced implementation');
        }
      } catch (error) {
        logger.error('Failed to calculate pairing index', error);
        process.exit(1);
      }
    });

  /**
   * smm code metadata [options]
   * View code metadata and statistics
   */
  codeGroup
    .command('metadata')
    .description('View code metadata and statistics')
    .option('--repo <path>', 'Path to git repository')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('📋 Retrieving code metadata...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getCodeMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== Code Metadata ===\n');
          console.log(`Total Commits: ${metrics.totalCommits}`);
          console.log(`Files Changed: ${metrics.filesChanged}`);
          console.log(`Lines Added: ${metrics.linesAdded}`);
          console.log(`Lines Removed: ${metrics.linesRemoved}`);
          console.log(`Contributors: ${metrics.contributors || 0}`);
        }
      } catch (error) {
        logger.error('Failed to retrieve code metadata', error);
        process.exit(1);
      }
    });
}
