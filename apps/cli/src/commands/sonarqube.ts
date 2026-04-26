import { Command } from 'commander';
import { Logger } from '@smm/utils';
import {
  SonarqubeMeasuresClient,
  QualityMetricsRepository,
  Configuration,
} from '@smm/core';
import { createOrchestrator } from '../orchestrator-factory.js';

const logger = new Logger('SonarQubeCommand');

/**
 * SonarQube Command Group
 *
 * Provides CLI commands for SonarQube integration matching Python CLI functionality.
 *
 * Commands:
 *   smm sonarqube fetch-measures   Fetch quality measures from SonarQube
 */
export function createSonarQubeCommands(program: Command): void {
  const sonarqubeGroup = program.command('sonarqube').description('SonarQube integration operations');

  /**
   * smm sonarqube fetch-measures [options]
   * Fetch quality measures from SonarQube
   */
  sonarqubeGroup
    .command('fetch-measures')
    .description('Fetch quality measures from SonarQube')
    .option('--project <key>', 'SonarQube project key')
    .option('--metrics <list>', 'Comma-separated list of metrics to fetch')
    .option('--force', 'Force re-fetching measures even if already fetched')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('🔄 Fetching quality measures from SonarQube...');

        const orchestrator = createOrchestrator();
        const config = orchestrator.getConfiguration();
        const repository = new QualityMetricsRepository(config.storeData || './outputs');
        const client = new SonarqubeMeasuresClient(
          config.sonarUrl || '',
          config.sonarToken || '',
          config.sonarProject || options.project || '',
          repository
        );

        const metrics = options.metrics
          ? options.metrics.split(',').map((m: string) => m.trim())
          : undefined;

        const measures = await client.fetchMeasures({
          metrics,
          force: options.force,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(measures, null, 2));
        } else {
          console.log('\n=== SonarQube Quality Measures ===\n');
          console.log(`Project: ${config.sonarProject || options.project}`);
          console.log(`Measures Fetched: ${Object.keys(measures).length}`);
          console.log('\nMeasures:');
          for (const [key, value] of Object.entries(measures)) {
            console.log(`  ${key}: ${value}`);
          }
        }

        console.log('\n✅ Fetch measures has been completed');
      } catch (error) {
        logger.error('Failed to fetch SonarQube measures', error);
        process.exit(1);
      }
    });
}
