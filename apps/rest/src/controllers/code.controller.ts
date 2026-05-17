import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CodeMetricsRepository, Configuration } from '@smmachine/core';
import * as fs from 'fs/promises';
import * as path from 'path';

type GenericRecord = Record<string, string | number | null>;

/**
 * Code Metrics REST Controller
 * Provides endpoints for code quality and analysis metrics
 */
@ApiTags('Code Metrics')
@Controller()
export class CodeController {
  private readonly logger = new Logger('CodeController');

  constructor(
    private readonly codeRepo: CodeMetricsRepository,
    private readonly config: Configuration
  ) {}

  @Get('/code/pairing-index')
  async pairingIndex(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('authors') authors?: string
  ) {
    const selectedAuthors = this.parseCsvList(authors);
    const pairing = await this.codeRepo.getPairingIndex({
      startDate,
      endDate,
      selectedAuthors: selectedAuthors.length > 0 ? selectedAuthors : undefined,
    });

    return {
      pairing_index_percentage: pairing?.pairingIndexPercentage ?? 0,
      total_analyzed_commits: pairing?.totalAnalyzedCommits ?? 0,
      paired_commits: pairing?.pairedCommits ?? 0,
    };
  }

  @Get('/code/code-churn')
  async codeChurn(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('type_churn') typeChurn?: string
  ) {
    const churn = await this.codeRepo.getCodeChurn({ startDate, endDate });
    const churnType = (typeChurn || 'total').toLowerCase();

    return (churn?.data || []).map(
      (row: { date: string; added: number; deleted: number; commits: number }) => {
        const value =
          churnType === 'added'
            ? row.added
            : churnType === 'deleted'
              ? row.deleted
              : churnType === 'commits'
                ? row.commits
                : row.added + row.deleted;

        return {
          date: row.date,
          type: churnType,
          value,
        };
      }
    );
  }

  @Get('/code/coupling')
  async coupling(
    @Query('ignore_files') ignoreFiles?: string,
    @Query('include_only') includeOnly?: string,
    @Query('top') top?: string
  ) {
    const ignorePatterns = this.parseCsvList(ignoreFiles);
    const includePatterns = this.parseCsvList(includeOnly);
    const coupling = await this.codeRepo.getFileCoupling({
      ignorePatterns: ignorePatterns.length > 0 ? ignorePatterns : undefined,
    });

    const filtered = coupling
      .filter(
        (row: { entity: string; coupled: string; degree: number; averageRevs: number }) =>
          !this.matchesIgnore(row.entity, ignorePatterns) &&
          !this.matchesIgnore(row.coupled, ignorePatterns) &&
          (
            this.matchesIncludeOnly(row.entity, includePatterns) ||
            this.matchesIncludeOnly(row.coupled, includePatterns) ||
            includePatterns.length === 0
          )
      )
      .sort(
        (a: { degree: number }, b: { degree: number }) =>
          b.degree - a.degree
      );

    const maxRows = top ? Number(top) : 20;
    return filtered
      .slice(0, Number.isFinite(maxRows) ? maxRows : 20)
      .map((row: { entity: string; coupled: string; degree: number; averageRevs: number }) => row);
  }

  @Get('/code/entity-churn')
  async entityChurn(
    @Query('ignore_files') ignoreFiles?: string,
    @Query('include_only') includeOnly?: string,
    @Query('top') top?: string
  ) {
    const rows = await this.readCsvRecords('entity-churn.csv');
    const filtered = this.filterEntities(rows, ignoreFiles, includeOnly)
      .map((row) => ({
        entity: String(row.entity || ''),
        added: this.toNumber(row.added),
        deleted: this.toNumber(row.deleted),
        commits: this.toNumber(row.commits),
      }))
      .sort((a, b) => b.added + b.deleted - (a.added + a.deleted));

    const maxRows = top ? Number(top) : 20;
    return filtered.slice(0, Number.isFinite(maxRows) ? maxRows : 20);
  }

  @Get('/code/entity-effort')
  async entityEffort(
    @Query('ignore_files') ignoreFiles?: string,
    @Query('include_only') includeOnly?: string,
    @Query('top') top?: string
  ) {
    const rows = await this.readCsvRecords('entity-effort.csv');
    const filtered = this.filterEntities(rows, ignoreFiles, includeOnly)
      .map((row) => ({
        entity: String(row.entity || ''),
        'total-revs': this.toNumber(row['total-revs'] || row.total_revs || row.revs),
      }))
      .sort((a, b) => b['total-revs'] - a['total-revs']);

    const maxRows = top ? Number(top) : 30;
    return filtered.slice(0, Number.isFinite(maxRows) ? maxRows : 30);
  }

  @Get('/code/entity-ownership')
  async entityOwnership(
    @Query('ignore_files') ignoreFiles?: string,
    @Query('include_only') includeOnly?: string,
    @Query('authors') authors?: string,
    @Query('top') top?: string
  ) {
    const authorFilter = new Set(this.parseCsvList(authors).map((author) => author.toLowerCase()));
    const rows = await this.readCsvRecords('entity-ownership.csv');

    const filtered = this.filterEntities(rows, ignoreFiles, includeOnly)
      .filter((row) => {
        if (authorFilter.size === 0) {
          return true;
        }
        const author = String(row.author || '').toLowerCase();
        return authorFilter.has(author);
      })
      .map((row) => ({
        entity: String(row.entity || ''),
        author: String(row.author || ''),
        added: this.toNumber(row.added),
        deleted: this.toNumber(row.deleted),
      }))
      .sort((a, b) => b.added + b.deleted - (a.added + a.deleted));

    const maxRows = top ? Number(top) : 100;
    return filtered.slice(0, Number.isFinite(maxRows) ? maxRows : 100);
  }

  @Get('/code/authors')
  async codeAuthors() {
    const rows = await this.readCsvRecords('entity-ownership.csv');
    return Array.from(
      new Set(
        rows.map((row) => String(row.author || '').trim()).filter((author) => author.length > 0)
      )
    ).sort();
  }

  // ========== PRIVATE HELPERS ==========

  private parseCsvList(value?: string): string[] {
    if (!value) {
      return [];
    }
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private toNumber(value: string | number | null | undefined): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 0;
    }
    return 0;
  }

  private matchesIncludeOnly(entity: string, includePatterns: string[]): boolean {
    if (includePatterns.length === 0) {
      return true;
    }

    return includePatterns.some((pattern) => this.matchesPattern(entity, pattern));
  }

  private matchesIgnore(entity: string, ignorePatterns: string[]): boolean {
    if (ignorePatterns.length === 0) {
      return false;
    }

    return ignorePatterns.some((pattern) => this.matchesPattern(entity, pattern));
  }

  private matchesPattern(entity: string, pattern: string): boolean {
    const normalizedEntity = entity.toLowerCase().replace(/\\/g, '/');
    const normalizedPattern = pattern.toLowerCase();

    if (!this.containsGlobToken(normalizedPattern)) {
      return normalizedEntity.includes(normalizedPattern);
    }

    const regex = this.globToRegExp(normalizedPattern);

    // If the pattern doesn't include path separators, apply it to filename only.
    if (!normalizedPattern.includes('/')) {
      const basename = path.posix.basename(normalizedEntity);
      return regex.test(basename);
    }

    return regex.test(normalizedEntity);
  }

  private containsGlobToken(value: string): boolean {
    return /[*?[\]]/.test(value);
  }

  private globToRegExp(globPattern: string): RegExp {
    let regexPattern = '^';

    for (let index = 0; index < globPattern.length; index += 1) {
      const current = globPattern[index];
      const next = globPattern[index + 1];

      if (current === '*' && next === '*') {
        regexPattern += '.*';
        index += 1;
        continue;
      }

      if (current === '*') {
        regexPattern += '[^/]*';
        continue;
      }

      if (current === '?') {
        regexPattern += '[^/]';
        continue;
      }

      regexPattern += current.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
    }

    regexPattern += '$';
    return new RegExp(regexPattern);
  }

  private async readCsvRecords(fileName: string): Promise<GenericRecord[]> {
    const csvPath = path.join(this.buildDataDirectories().codemaatDirectory, fileName);

    try {
      const content = await fs.readFile(csvPath, 'utf-8');
      const lines = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length < 2) {
        return [];
      }

      const header = lines[0].split(',').map((item) => item.trim().replace(/^"|"$/g, ''));
      const records: GenericRecord[] = [];

      for (let index = 1; index < lines.length; index += 1) {
        const row = lines[index].split(',').map((item) => item.trim().replace(/^"|"$/g, ''));
        if (row.length === 0) {
          continue;
        }

        const entry: GenericRecord = {};
        for (let col = 0; col < header.length; col += 1) {
          entry[header[col]] = row[col] ?? '';
        }
        records.push(entry);
      }

      return records;
    } catch (error) {
      this.logger.warn(
        `Failed to read CSV ${csvPath}: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  private filterEntities(
    rows: GenericRecord[],
    ignoreFiles?: string,
    includeOnly?: string
  ): GenericRecord[] {
    const ignorePatterns = this.parseCsvList(ignoreFiles);
    const includePatterns = this.parseCsvList(includeOnly);

    return rows.filter((row) => {
      const entity = String(row.entity || '');
      if (!entity) {
        return false;
      }

      if (this.matchesIgnore(entity, ignorePatterns)) {
        return false;
      }

      if (!this.matchesIncludeOnly(entity, includePatterns)) {
        return false;
      }

      return true;
    });
  }

  private buildDataDirectories() {
    const baseDir = this.config.storeData || './outputs';
    const gitProvider = this.config.gitProvider || 'github';
    const repoSlug = (this.config.githubRepository || '').replace('/', '_');
    const dataDirectory = path.join(baseDir, `${gitProvider}_${repoSlug}`);

    return {
      gitProviderDirectory: path.join(dataDirectory, gitProvider),
      codemaatDirectory: path.join(dataDirectory, 'codemaat'),
    };
  }
}
