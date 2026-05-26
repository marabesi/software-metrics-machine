import path from 'path';
import {
  CodeChurnResult,
  CodeMaatMetricsRepository,
  FileCoupling,
} from 'src/providers/codemaat';

type EntityEffortRow = { entity: string; 'total-revs': number };
type EntityOwnershipRow = { entity: string; author: string; added: number; deleted: number };

export class CodemaatService {
  constructor(private metricsRepository: CodeMaatMetricsRepository) {}

  async getCodeChurn(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CodeChurnResult> {
    return this.metricsRepository.getCodeChurn(options);
  }

  async getFileCoupling(options?: { ignorePatterns?: string[] }): Promise<FileCoupling[]> {
    return this.metricsRepository.getFileCoupling(options);
  }

  async getEntityEffort(options?: {
    ignoreFiles?: string;
    includeOnly?: string;
    top?: number;
  }): Promise<Array<{ entity: string; 'total-revs': number }>> {
    const rows = (await this.metricsRepository.getEntityEffort()) as EntityEffortRow[];
    const filtered = this.filterEntities(rows, options?.ignoreFiles, options?.includeOnly).sort(
      (a, b) => b['total-revs'] - a['total-revs']
    );

    const limit = options?.top ?? 30;
    return filtered.slice(0, Number.isFinite(limit) ? limit : 30);
  }

  async getEntityOwnership(options?: {
    ignoreFiles?: string;
    includeOnly?: string;
    authors?: string;
    top?: number;
  }): Promise<Array<{ entity: string; author: string; added: number; deleted: number }>> {
    const authorFilter = new Set(
      this.parseCsvList(options?.authors).map((author) => author.toLowerCase())
    );

    const rows = (await this.metricsRepository.getEntityOwnership()) as EntityOwnershipRow[];
    const filtered = this.filterEntities(rows, options?.ignoreFiles, options?.includeOnly)
      .filter((row) => {
        if (authorFilter.size === 0) {
          return true;
        }
        return authorFilter.has(row.author.toLowerCase());
      })
      .sort((a, b) => b.added + b.deleted - (a.added + a.deleted));

    const limit = options?.top ?? 100;
    return filtered.slice(0, Number.isFinite(limit) ? limit : 100);
  }

  private parseCsvList(value?: string): string[] {
    if (!value) {
      return [];
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private filterEntities<T extends { entity: string }>(
    rows: T[],
    ignoreFiles?: string,
    includeOnly?: string
  ): T[] {
    const ignorePatterns = this.parseCsvList(ignoreFiles);
    const includePatterns = this.parseCsvList(includeOnly);

    return rows.filter((row) => {
      const entity = row.entity;
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
}
