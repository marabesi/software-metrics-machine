import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { Configuration } from '@smmachine/core/infrastructure/configuration';
import { Logger } from '@smmachine/utils';
import { SonarqubeMeasuresClient } from '@smmachine/core/providers/sonarqube/sonarqube-client';
import { SonarqubeFetchMetricsRepository } from '@smmachine/core/providers/sonarqube/sonarqube-fetch-metrics-repository';
import { SonarqubeLocalAnalysis } from '@smmachine/core/providers/sonarqube/sonarqube-local-analysis';

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

  const sonarqubeAnalysisGroup = sonarqubeGroup
    .command('analysis')
    .description('Run local SonarQube analysis through Docker');

  sonarqubeAnalysisGroup
    .command('run')
    .description('Start local SonarQube (if needed) and execute sonar-scanner in Docker')
    .option('--container-server-name <name>', 'SonarQube container name', 'sonarqube')
    .option('--scanner-container-name <name>', 'SonarQube scanner container name', 'sonarqube-scanner')
    .option('--container-server-image <image>', 'SonarQube Docker image', 'sonarqube:community')
    .option('--scanner-image <image>', 'Sonar scanner Docker image', 'sonarsource/sonar-scanner-cli')
    .option('--data-dir <path>', 'Host path mounted to /opt/sonarqube/data', './sonarqube_data')
    .option('--server-port <number>', 'Host port mapped to SonarQube container port 9000', '9000')
    .option('--scanner-host-url <url>', 'SONAR_HOST_URL passed to scanner (overrides container-derived URL)')
    .option('--scanner-token <token>', 'SONAR_TOKEN passed to scanner')
    .option('--properties <value>', 'Raw SONAR_SCANNER_OPTS value passed directly to scanner')
    .option('--admin-user <user>', 'Predefined local SonarQube admin username', 'admin')
    .option('--admin-password <password>', 'Predefined local SonarQube admin password', 'admin')
    .action(async (options) => {
      try {
        const config = new Configuration(process.env);
        const analysis = new SonarqubeLocalAnalysis(config);
        await analysis.run({
          containerName: String(options.containerServerName),
          scannerContainerName: String(options.scannerContainerName),
          containerImage: String(options.containerServerImage),
          scannerImage: String(options.scannerImage),
          dataDirectory: resolve(String(options.dataDir)),
          sourceDirectory: resolve(String(config.gitRepositoryLocation)),
          hostPort: String(options.serverPort),
          scannerOptions: String(options.properties || '').trim(),
          adminUser: String(options.adminUser),
          adminPassword: String(options.adminPassword),
          scannerHostUrl: options.scannerHostUrl ? String(options.scannerHostUrl).trim() : undefined,
          scannerToken: options.scannerToken,
        });
      } catch (error) {
        logger.error('Failed to run SonarQube analysis', error);
        process.exit(1);
      }
    });

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
        logger.info('🔄 Fetching quality measures from SonarQube...');

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

        logger.info('\n✅ Fetch measures has been completed');
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

          if (components.length > 0) {
            const root = components[0];
            console.log(`Root Component: ${root.key || 'N/A'}`);
            console.log(`Root Name: ${root.name || 'N/A'}`);
          }

          if (components.length > 0) {
            console.log('\nComponents:');
            for (const component of components) {
              const measureCount = Array.isArray(component.measures)
                ? component.measures.length
                : 0;
              console.log(`  ${component.key || 'unknown'} - measures: ${measureCount}`);
            }
          }
        }

        console.log('\n✅ Fetch component tree has been completed');
      } catch (error) {
        logger.error('Failed to fetch SonarQube component tree', error);
        process.exit(1);
      }
    });

  /**
   * smm sonarqube fetch-historical-measures [options]
   * Fetch historical measures from SonarQube and optionally store as JSON
   */
  sonarqubeGroup
    .command('fetch-historical-measures')
    .description('Fetch historical measures from SonarQube')
    .option(
      '--metrics <list>',
      'Comma-separated list of metrics to fetch (default: sqale_rating,coverage,duplicated_lines_density)'
    )
    .option('--start-date <date>', 'Start date in YYYY-MM-DD format')
    .option('--end-date <date>', 'End date in YYYY-MM-DD format')
    .option('--update', 'Incrementally update measures — fetch only newer items since last sync and merge with existing cache')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .option('--save <file>', 'Save results to a JSON file at the given path')
    .action(async (options) => {
      try {
        console.log('🔄 Fetching historical measures from SonarQube...');

        const orchestrator = createSonarqubeOrchestrator();

        const fetchOptions = {
          metrics: options.metrics
            ? options.metrics.split(',').map((m: string) => m.trim())
            : undefined,
          startDate: options.startDate,
          endDate: options.endDate,
          incrementalUpdate: options.update,
        };

        const measures = await orchestrator.fetchHistoricalMeasures(fetchOptions);

        if (options.save) {
          writeFileSync(options.save, JSON.stringify(measures, null, 2), 'utf-8');
          console.log(`\n💾 Results saved to ${options.save}`);
        }

        if (options.output === 'json') {
          console.log(JSON.stringify(measures, null, 2));
        } else {
          console.log('\n=== SonarQube Historical Measures ===\n');
          console.log(`Measurements Fetched: ${measures.length}`);
        }

        console.log('\n✅ Fetch historical measures has been completed');
      } catch (error) {
        logger.error('Failed to fetch SonarQube historical measures', error);
        process.exit(1);
      }
    });
}
