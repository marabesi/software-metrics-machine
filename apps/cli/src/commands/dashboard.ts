import { Command } from 'commander';
import { Logger } from '@smm/utils';

const logger = new Logger('DashboardCommand');

/**
 * Dashboard Command Group
 *
 * Provides CLI commands for dashboard operations matching Python CLI functionality.
 *
 * Commands:
 *   smm dashboard serve    Start the dashboard server
 */
export function createDashboardCommands(program: Command): void {
  const dashboardGroup = program.command('dashboard').description('Dashboard operations');

  /**
   * smm dashboard serve [options]
   * Start the dashboard server
   */
  dashboardGroup
    .command('serve')
    .description('Start the dashboard server')
    .option('--port <number>', 'Port to run the server on', '3000')
    .option('--host <host>', 'Host to bind the server to', 'localhost')
    .action(async (options) => {
      try {
        console.log('🚀 Starting dashboard server...');
        console.log(`   Host: ${options.host}`);
        console.log(`   Port: ${options.port}`);
        console.log('\n📝 Note: The TypeScript CLI does not include a dashboard server.');
        console.log('   The dashboard is available as a separate Next.js application.');
        console.log('\n   To run the dashboard:');
        console.log('   1. Navigate to apps/webapp');
        console.log('   2. Run: pnpm run dev');
        console.log('   3. Open: http://localhost:3000\n');
        console.log('   Alternatively, use the Python dashboard:');
        console.log('   1. Navigate to api/');
        console.log('   2. Run: python -m software_metrics_machine.apps.cli dashboard serve\n');
      } catch (error) {
        logger.error('Failed to start dashboard', error);
        process.exit(1);
      }
    });
}
