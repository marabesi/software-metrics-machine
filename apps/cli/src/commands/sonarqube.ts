import { Command } from 'commander';
import { Logger } from '@smm/utils';
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
    .option('--metrics <list>', 'Comma-separated list of metrics to fetch (default: coverage,sqale_rating,complexity,duplicated_lines_density)')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('🔄 Fetching quality measures from SonarQube...');

        const orchestrator = createOrchestrator();
        
        const metricsParam = options.metrics
          ? { metrics: options.metrics.split(',').map((m: string) => m.trim()) }
          : undefined;

        const measures = await orchestrator.getQualityMetrics(metricsParam);

        if (options.output === 'json') {
          console.log(JSON.stringify(measures, null, 2));
        } else {
          console.log('\n=== SonarQube Quality Measures ===\n');
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
