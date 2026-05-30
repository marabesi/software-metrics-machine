import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@smmachine/utils';
import { Configuration } from '../../infrastructure';

export interface CodemaatFetchOptions {
  repositoryPath?: string;
  outputDirectory?: string;
  startDate: string;
  subfolder?: string;
  force?: boolean;
  scriptPath?: string;
}

export interface CodemaatFetchResult {
  repository: string;
  outputDirectory: string;
  stdout: string;
}

export class CodemaatFetchRepository {
  private logger = new Logger('CodemaatFetchRepository');

  constructor(private configuration: Configuration) {}

  fetch(options: CodemaatFetchOptions): CodemaatFetchResult {
    if (!options.startDate) {
      throw new Error('startDate is required for CodeMaat fetch.');
    }

    const repositoryPath = options.repositoryPath || this.configuration.gitRepositoryLocation;
    if (!repositoryPath) {
      throw new Error('Git repository path is not configured.');
    }

    const outputDirectory = options.outputDirectory || this.configuration.getCodeMaatPath();
    fs.mkdirSync(outputDirectory, { recursive: true });

    const scriptPath = this.resolveScriptPath(options.scriptPath);
    const scriptDirectory = path.dirname(scriptPath);

    this.logger.info(`Running CodeMaat fetch script at ${scriptPath}`);

    const stdout = execFileSync(
      'sh',
      [
        scriptPath,
        repositoryPath,
        outputDirectory,
        options.startDate,
        options.subfolder || '',
        options.force ? 'true' : 'false',
      ],
      {
        cwd: scriptDirectory,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    return {
      repository: repositoryPath,
      outputDirectory,
      stdout,
    };
  }

  private resolveScriptPath(explicitScriptPath?: string): string {
    if (explicitScriptPath && fs.existsSync(explicitScriptPath)) {
      return explicitScriptPath;
    }

    const scriptPath = path.resolve(__dirname, '../apps/cli/fetch-codemaat.sh');
    if (fs.existsSync(scriptPath)) {
      return scriptPath;
    }

    if (explicitScriptPath) {
      throw new Error(`Configured scriptPath does not exist: ${explicitScriptPath}`);
    }

    throw new Error(`Could not locate fetch-codemaat.sh at expected path: ${scriptPath}`);
  }
}
