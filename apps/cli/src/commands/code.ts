import { Command } from 'commander';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@smmachine/utils';
import {
  CommitTraverser,
  Configuration,
} from '@smmachine/core';
import { createOrchestrator } from '../orchestrator-factory.js';

const logger = new Logger('CodeCommand');
const currentDir = __dirname;
const workspaceRoot = path.resolve(currentDir, '../../../../');
const cliRoot = path.join(workspaceRoot, 'apps/cli');

function loadConfiguration(): Configuration {
  return new Configuration(process.env);
}

function resolveDataDirectory(config: Configuration): string {
  const baseDir = config.storeData || './outputs';
  const gitProvider = config.gitProvider || 'github';
  const repoSlug = (config.githubRepository || '').replace('/', '_');
  return path.join(baseDir, `${gitProvider}_${repoSlug}`);
}

function resolveRepositoryFromConfig(config: Configuration): string {
  if (!config.gitRepositoryLocation) {
    throw new Error('git_repository_location is required in smm_config.json');
  }

  const configuredPath = config.gitRepositoryLocation;

  if (fs.existsSync(configuredPath)) {
    return configuredPath;
  }

  // Try common workspace-relative variants while keeping config as source of truth.
  const candidates: string[] = [];

  if (!path.isAbsolute(configuredPath)) {
    candidates.push(path.resolve(workspaceRoot, configuredPath));
    candidates.push(path.resolve(workspaceRoot, 'api', configuredPath));
  } else {
    const relativeToWorkspace = path.relative(workspaceRoot, configuredPath);
    if (!relativeToWorkspace.startsWith('..') && !path.isAbsolute(relativeToWorkspace)) {
      candidates.push(path.join(workspaceRoot, 'api', relativeToWorkspace));
    }
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `git_repository_location from smm_config.json was not found: ${configuredPath}`,
  );
}

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
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--authors <list>', 'Comma-separated list of authors to filter')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('🔍 Analyzing change sets...');

        const config = loadConfiguration();
        const repoPath = resolveRepositoryFromConfig(config);

        const traverser = new CommitTraverser(repoPath);
        const result = await traverser.traverseCommits({
          startDate: options.startDate,
          endDate: options.endDate,
          selectedAuthors: options.authors ? options.authors.split(',').map((a: string) => a.trim()) : undefined,
        });
        const commits = result.commits;

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
    .description('Fetch CodeMaat CSV data from the git repository')
    .requiredOption('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--subfolder <path>', 'Subfolder within the repository to analyze', '')
    .option('--force', 'Force regeneration of CodeMaat CSV files')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('🔍 Running CodeMaat analysis...');

        const config = loadConfiguration();
        const repoPath = resolveRepositoryFromConfig(config);
        const codemaatDir = path.join(resolveDataDirectory(config), 'codemaat');
        const scriptPath = path.join(cliRoot, 'fetch-codemaat.sh');

        fs.mkdirSync(codemaatDir, { recursive: true });

        const stdout = execFileSync(
          '/bin/sh',
          [
            scriptPath,
            repoPath,
            codemaatDir,
            options.startDate,
            options.subfolder,
            options.force ? 'true' : 'false',
          ],
          {
            cwd: cliRoot,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        );

        if (options.output === 'json') {
          console.log(
            JSON.stringify(
              {
                repository: repoPath,
                outputDirectory: codemaatDir,
                stdout,
              },
              null,
              2,
            ),
          );
        } else {
          console.log('\n=== CodeMaat Fetch ===\n');
          console.log(`Repository: ${repoPath}`);
          console.log(`Output Directory: ${codemaatDir}`);
          process.stdout.write(stdout);
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
        const churnRows = Array.isArray(metrics.codeChurn?.data) ? metrics.codeChurn.data : [];
        const totalCommits = churnRows.reduce((sum: number, row: any) => sum + (row.commits || 0), 0);
        const linesAdded = churnRows.reduce((sum: number, row: any) => sum + (row.added || 0), 0);
        const linesRemoved = churnRows.reduce((sum: number, row: any) => sum + (row.deleted || 0), 0);

        if (options.output === 'json') {
          console.log(JSON.stringify({ codeChurn: churnRows }, null, 2));
        } else {
          console.log('\n=== Code Churn Metrics ===\n');
          console.log(`Data Points: ${churnRows.length}`);
          console.log(`Total Commits: ${totalCommits}`);
          console.log(`Lines Added: ${linesAdded}`);
          console.log(`Lines Removed: ${linesRemoved}`);
          console.log(`Churn: ${linesAdded + linesRemoved}`);
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
        const coupling = Array.isArray(metrics.fileCoupling) ? metrics.fileCoupling : [];

        if (options.output === 'json') {
          console.log(JSON.stringify({ coupling }, null, 2));
        } else {
          console.log('\n=== Code Coupling Analysis ===\n');
          console.log(`Min Coupling Threshold: ${options.minCoupling}`);
          console.log(`Relationships: ${coupling.length}`);
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
        const churnRows = Array.isArray(metrics.codeChurn?.data) ? metrics.codeChurn.data : [];
        const totalChurn = churnRows.reduce(
          (sum: number, row: any) => sum + (row.added || 0) + (row.deleted || 0),
          0,
        );

        if (options.output === 'json') {
          console.log(JSON.stringify({ codeChurn: churnRows }, null, 2));
        } else {
          console.log('\n=== Entity Churn Metrics ===\n');
          console.log(`Top Entities: ${options.top}`);
          console.log(`Total Churn: ${totalChurn}`);
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
        const pairing = metrics.pairingIndex || {};

        if (options.output === 'json') {
          console.log(JSON.stringify({ pairingIndex: pairing }, null, 2));
        } else {
          console.log('\n=== Developer Pairing Index ===\n');
          console.log(`Min Shared Commits: ${options.minShared}`);
          console.log(`Pairing Index: ${pairing.pairingIndexPercentage ?? 0}%`);
          console.log(`Total Commits: ${pairing.totalAnalyzedCommits ?? 0}`);
          console.log(`Paired Commits: ${pairing.pairedCommits ?? 0}`);
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
        const pairing = metrics.pairingIndex || {};
        const churnRows = Array.isArray(metrics.codeChurn?.data) ? metrics.codeChurn.data : [];
        const linesAdded = churnRows.reduce((sum: number, row: any) => sum + (row.added || 0), 0);
        const linesRemoved = churnRows.reduce((sum: number, row: any) => sum + (row.deleted || 0), 0);

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== Code Metadata ===\n');
          console.log(`Total Commits: ${pairing.totalAnalyzedCommits ?? 0}`);
          console.log(`Paired Commits: ${pairing.pairedCommits ?? 0}`);
          console.log(`Code Churn Data Points: ${churnRows.length}`);
          console.log(`Lines Added: ${linesAdded}`);
          console.log(`Lines Removed: ${linesRemoved}`);
          console.log(`Coupling Relationships: ${Array.isArray(metrics.fileCoupling) ? metrics.fileCoupling.length : 0}`);
        }
      } catch (error) {
        logger.error('Failed to retrieve code metadata', error);
        process.exit(1);
      }
    });
}
