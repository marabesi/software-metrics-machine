import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@smmachine/utils';

export interface CodeChurn {
  date: string;
  added: number;
  deleted: number;
  commits: number;
}

export interface CodeChurnResult {
  data: CodeChurn[];
  startDate?: string;
  endDate?: string;
}

export interface FileCoupling {
  entity: string;
  coupled: string;
  degree: number;
  averageRevs: number;
}

export interface CodemaatAnalysisResult {
  churn?: CodeChurnResult;
  coupling?: FileCoupling[];
  entityChurn?: any[];
  entityEffort?: any[];
  entityOwnership?: any[];
}

export interface ICodemaatAnalyzer {
  getCodeChurn(options?: { startDate?: string; endDate?: string }): Promise<CodeChurnResult>;

  getFileCoupling(options?: { ignorePatterns?: string[] }): Promise<FileCoupling[]>;

  analyze(options?: {
    startDate?: string;
    endDate?: string;
    ignorePatterns?: string[];
  }): Promise<CodemaatAnalysisResult>;
}

/**
 * CodeMaat analyzer for code metrics
 * Reads pre-generated CSV analysis files:
 * - abs-churn.csv: Lines added/deleted per commit
 * - coupling.csv: File coupling analysis
 * - entity-churn.csv: Per-entity (file/class) churn
 * - entity-effort.csv: Effort metrics
 * - entity-ownership.csv: Author ownership
 *
 * Mirrors: api/src/software_metrics_machine/providers/codemaat/codemaat_repository.py
 */
export class CodemaatAnalyzer implements ICodemaatAnalyzer {
  private logger: Logger;

  constructor(private dataDir: string) {
    this.logger = new Logger('CodemaatAnalyzer');
  }

  async getCodeChurn(options?: { startDate?: string; endDate?: string }): Promise<CodeChurnResult> {
    try {
      const csvPath = path.join(this.dataDir, 'abs-churn.csv');

      this.logger.info(
        `Reading code churn from ${csvPath}` +
          (options?.startDate ? ` from ${options.startDate}` : '') +
          (options?.endDate ? ` to ${options.endDate}` : '')
      );

      // Check if file exists
      if (!fs.existsSync(csvPath)) {
        this.logger.warn(`Code churn file not found: ${csvPath}`);
        return {
          data: [],
          startDate: options?.startDate,
          endDate: options?.endDate,
        };
      }

      const content = fs.readFileSync(csvPath, 'utf-8');
      const lines = content.trim().split('\n');

      if (lines.length < 2) {
        return {
          data: [],
          startDate: options?.startDate,
          endDate: options?.endDate,
        };
      }

      // Parse header
      const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

      // Find column indices
      const dateIdx = header.indexOf('date') >= 0 ? header.indexOf('date') : header.indexOf('Date');
      const addedIdx = header.findIndex(
        (h) => h.toLowerCase().includes('added') || h.toLowerCase().includes('insertions')
      );
      const deletedIdx = header.findIndex(
        (h) => h.toLowerCase().includes('deleted') || h.toLowerCase().includes('deletions')
      );
      const commitsIdx = header.findIndex((h) => h.toLowerCase().includes('commit'));

      if (dateIdx < 0 || addedIdx < 0 || deletedIdx < 0) {
        this.logger.warn('Invalid code churn CSV format. Missing required columns.');
        return {
          data: [],
          startDate: options?.startDate,
          endDate: options?.endDate,
        };
      }

      // Parse data rows
      const data: CodeChurn[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));

        if (row.length <= Math.max(dateIdx, addedIdx, deletedIdx)) {
          continue; // Skip malformed rows
        }

        const date = row[dateIdx];
        const added = parseInt(row[addedIdx], 10) || 0;
        const deleted = parseInt(row[deletedIdx], 10) || 0;
        const commits = commitsIdx >= 0 ? parseInt(row[commitsIdx], 10) || 0 : 1;

        // Filter by date range if provided
        if (options?.startDate && date < options.startDate) {
          continue;
        }
        if (options?.endDate && date > options.endDate) {
          continue;
        }

        data.push({ date, added, deleted, commits });
      }

      this.logger.info(`Parsed ${data.length} code churn records`);

      return {
        data,
        startDate: options?.startDate,
        endDate: options?.endDate,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to read code churn: ${errorMsg}`);
      throw error;
    }
  }

  async getFileCoupling(options?: { ignorePatterns?: string[] }): Promise<FileCoupling[]> {
    try {
      const csvPath = path.join(this.dataDir, 'coupling.csv');

      this.logger.info(`Reading file coupling from ${csvPath}`);

      // Check if file exists
      if (!fs.existsSync(csvPath)) {
        this.logger.warn(`File coupling CSV not found: ${csvPath}`);
        return [];
      }

      const content = fs.readFileSync(csvPath, 'utf-8');
      const lines = content.trim().split('\n');

      if (lines.length < 2) {
        return [];
      }

      const delimiter = this.detectCsvDelimiter(lines[0]);

      // Parse header
      const header = this.parseCsvLine(lines[0], delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));

      // Find column indices
      const file1Idx = header.findIndex(
        (h) =>
          h.toLowerCase() === 'entity'
      );
      const file2Idx = header.findIndex(
        (h) =>
          h.toLowerCase() === 'coupled'
      );
      const couplingIdx = header.findIndex(
        (h) =>
          h.toLowerCase() === 'degree'
      );

      const averageRevsIdx = header.findIndex(
        (h) => h.toLowerCase().includes('average-revs')
      );

      if (file1Idx < 0 || file2Idx < 0 || couplingIdx < 0) {
        this.logger.warn('Invalid file coupling CSV format. Missing required columns.');
        return [];
      }

      // Parse data rows
      const coupleData: FileCoupling[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = this.parseCsvLine(lines[i], delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));

        if (row.length <= Math.max(file1Idx, file2Idx, couplingIdx)) {
          continue; // Skip malformed rows
        }

        const entity = row[file1Idx];
        const coupled = row[file2Idx];
        const degree = parseInt(row[couplingIdx], 10) || 0;
        const averageRevs = averageRevsIdx >= 0 ? parseInt(row[averageRevsIdx], 10) || 0 : 0;

        // Apply ignore patterns if provided
        // if (
        //   options?.ignorePatterns &&
        //   (this.isIgnoredPath(entity, options.ignorePatterns) ||
        //     this.isIgnoredPath(coupled, options.ignorePatterns))
        // ) {
        //   continue;
        // }

        coupleData.push({
          entity,
          coupled,
          degree,
          averageRevs,
        });
      }

      this.logger.info(`Parsed ${coupleData.length} file coupling relationships`);

      return coupleData;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to read file coupling: ${errorMsg}`);
      throw error;
    }
  }

  private detectCsvDelimiter(headerLine: string): string {
    const semicolons = (headerLine.match(/;/g) || []).length;
    const commas = (headerLine.match(/,/g) || []).length;
    return semicolons > commas ? ';' : ',';
  }

  private parseCsvLine(line: string, delimiter: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        // Handle escaped quote
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
          continue;
        }

        inQuotes = !inQuotes;
        continue;
      }

      if (!inQuotes && char === delimiter) {
        values.push(current);
        current = '';
        continue;
      }

      current += char;
    }

    values.push(current);
    return values;
  }

  async analyze(options?: {
    startDate?: string;
    endDate?: string;
    ignorePatterns?: string[];
  }): Promise<CodemaatAnalysisResult> {
    try {
      this.logger.info('Running CodeMaat analysis');

      const [churn, coupling] = await Promise.all([
        this.getCodeChurn({
          startDate: options?.startDate,
          endDate: options?.endDate,
        }),
        this.getFileCoupling({
          ignorePatterns: options?.ignorePatterns,
        }),
      ]);

      const result: CodemaatAnalysisResult = {
        churn,
        coupling,
      };

      this.logger.info('CodeMaat analysis completed');

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`CodeMaat analysis failed: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Check if a file path should be ignored
   */
  private isIgnoredPath(filePath: string, ignorePatterns: string[]): boolean {
    if (!ignorePatterns || ignorePatterns.length === 0) {
      return false;
    }

    const normalizedPath = filePath.replace(/\\/g, '/');

    for (const pattern of ignorePatterns) {
      // Handle glob patterns like *.js
      if (pattern.startsWith('*.')) {
        const ext = pattern.substring(1);
        if (normalizedPath.endsWith(ext)) {
          return true;
        }
      }

      // Handle folder/path matches
      if (normalizedPath.includes(pattern)) {
        return true;
      }

      // Handle prefix matches
      if (normalizedPath.startsWith(pattern)) {
        return true;
      }
    }

    return false;
  }
}
