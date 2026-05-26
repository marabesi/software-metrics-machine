import { Command } from 'commander';
import { Configuration } from '@smmachine/core/infrastructure/configuration';
import { Logger } from '@smmachine/utils';
import { SonarqubeMeasuresClient } from '@smmachine/core/providers/sonarqube/sonarqube-client';
import { SonarqubeFetchMetricsRepository } from '@smmachine/core/providers/sonarqube/sonarqube-fetch-metrics-repository';

const logger = new Logger('SonarQubeCommand');

function createSonarqubeOrchestrator() {
  const config = new Configuration(process.env);
  const sonarqubeClient = new SonarqubeMeasuresClient(
    config.sonarUrl || '',
    config.sonarToken || '',
    config.sonarProject || ''
  );

  return new SonarqubeFetchMetricsRepository(sonarqubeClient, config);
}

/**
 * SonarQube Command Group
 *
 * Provides CLI commands for SonarQube integration matching Python CLI functionality.
 *
 * Commands:
 *   smm sonarqube fetch-measures   Fetch quality measures from SonarQube
 *   smm sonarqube fetch-component-tree   Fetch component tree from SonarQube
 */
export function createSonarQubeCommands(program: Command): void {
  const sonarqubeGroup = program
    .command('sonarqube')
    .description('SonarQube integration operations');

  /**
   * smm sonarqube fetch-measures [options]
   * Fetch quality measures from SonarQube
   */
  sonarqubeGroup
    .command('fetch-measures')
    .description('Fetch quality measures from SonarQube')
    .option(
      '--metrics <list>',
      'Comma-separated list of metrics to fetch (default: coverage,sqale_rating,complexity,duplicated_lines_density)'
    )
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('🔄 Fetching quality measures from SonarQube...');

        const orchestrator = createSonarqubeOrchestrator();

        const metricsParam = options.metrics
          ? { metrics: options.metrics.split(',').map((m: string) => m.trim()) }
          : undefined;

        const measures = await orchestrator.fetchQualityMetrics(metricsParam);

        if (options.output === 'json') {
          console.log(JSON.stringify(measures, null, 2));
        } else {
          console.log('\n=== SonarQube Quality Measures ===\n');
          const measureList = Array.isArray(measures.measures) ? measures.measures : [];
          console.log(`Measures Fetched: ${measureList.length}`);
          console.log(`Project Key: ${measures.key || 'N/A'}`);
          console.log(`Project Name: ${measures.name || 'N/A'}`);

          if (measureList.length > 0) {
            console.log('\nMeasures:');
            for (const measure of measureList) {
              console.log(`  ${measure.metric || measure.key}: ${measure.value ?? 'N/A'}`);
            }
          }
        }

        console.log('\n✅ Fetch measures has been completed');
      } catch (error) {
        logger.error('Failed to fetch SonarQube measures', error);
        process.exit(1);
      }
    });

  /**
   * smm sonarqube fetch-component-tree [options]
   * Fetch component tree with metrics from SonarQube
   */
  sonarqubeGroup
    .command('fetch-component-tree')
    .description('Fetch component tree with metrics from SonarQube')
    .option('--component <key>', 'Component key (default: configured SONAR_PROJECT)')
    .option('--depth <number>', 'Depth of tree traversal (-1 for all depths)', '-1')
    .option(
      '--metrics <list>',
      'Comma-separated list of metrics to fetch (default: complexity,cognitive_complexity,ncloc,sqale_rating,coverage)'
    )
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('🔄 Fetching component tree from SonarQube...');

        const orchestrator = createSonarqubeOrchestrator();

        const parsedDepth = Number.parseInt(options.depth, 10);
        if (Number.isNaN(parsedDepth)) {
          throw new Error('--depth must be a valid integer');
        }

        const treeOptions = {
          component: options.component,
          depth: parsedDepth,
          metrics: options.metrics
            ? options.metrics.split(',').map((m: string) => m.trim())
            : undefined,
        };

        const components = await orchestrator.fetchComponentTree(treeOptions);

        if (options.output === 'json') {
          console.log(JSON.stringify(components, null, 2));
        } else {
          console.log('\n=== SonarQube Component Tree ===\n');
          console.log(`Components Fetched: ${components.length}`);

          // if (components.length > 0) {
          //   const root = components[0];
          //   console.log(`Root Component: ${root.key || 'N/A'}`);
          //   console.log(`Root Name: ${root.name || 'N/A'}`);
          // }

          // if (components.length > 0) {
          //   console.log('\nComponents:');
          //   for (const component of components) {
          //     const measureCount = Array.isArray(component.measures)
          //       ? component.measures.length
          //       : 0;
          //     console.log(`  ${component.key || 'unknown'} - measures: ${measureCount}`);
          //   }
          // }
        }

        console.log('\n✅ Fetch component tree has been completed');
      } catch (error) {
        logger.error('Failed to fetch SonarQube component tree', error);
        process.exit(1);
      }
    });
}
