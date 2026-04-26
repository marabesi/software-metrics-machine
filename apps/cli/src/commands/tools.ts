import { Command } from 'commander';
import { Logger } from '@smm/utils';
import * as fs from 'fs';
import * as path from 'path';

const logger = new Logger('ToolsCommand');

/**
 * Tools Command Group
 *
 * Provides CLI utility commands matching Python CLI functionality.
 *
 * Commands:
 *   smm tools json-merge   Merge multiple JSON files
 */
export function createToolsCommands(program: Command): void {
  const toolsGroup = program.command('tools').description('Utility tools');

  /**
   * smm tools json-merge [options]
   * Merge multiple JSON files into one
   */
  toolsGroup
    .command('json-merge')
    .description('Merge multiple JSON files into one')
    .option('--input <pattern>', 'Input file pattern (glob)', '*.json')
    .option('--output <file>', 'Output file path', 'merged.json')
    .option('--pretty', 'Pretty print the output JSON')
    .action(async (options) => {
      try {
        console.log('🔄 Merging JSON files...');

        const inputPattern = options.input;
        const outputFile = options.output;

        // For simplicity, we'll just merge files from current directory
        // In a full implementation, use glob pattern matching
        const files = fs.readdirSync('.')
          .filter(file => file.endsWith('.json') && file !== outputFile);

        if (files.length === 0) {
          console.log('⚠️  No JSON files found matching pattern:', inputPattern);
          return;
        }

        console.log(`📁 Found ${files.length} JSON files to merge`);

        const merged: any = {};
        let isArray = false;
        const arrays: any[] = [];

        for (const file of files) {
          try {
            const content = fs.readFileSync(file, 'utf-8');
            const data = JSON.parse(content);

            if (Array.isArray(data)) {
              isArray = true;
              arrays.push(...data);
            } else {
              Object.assign(merged, data);
            }

            console.log(`  ✅ Merged: ${file}`);
          } catch (error) {
            console.log(`  ❌ Failed to merge: ${file} - ${error}`);
          }
        }

        const result = isArray ? arrays : merged;
        const output = options.pretty
          ? JSON.stringify(result, null, 2)
          : JSON.stringify(result);

        fs.writeFileSync(outputFile, output, 'utf-8');

        console.log(`\n✅ Merged JSON saved to: ${outputFile}`);
        console.log(`   Total items: ${isArray ? arrays.length : Object.keys(merged).length}`);
      } catch (error) {
        logger.error('Failed to merge JSON files', error);
        process.exit(1);
      }
    });
}
