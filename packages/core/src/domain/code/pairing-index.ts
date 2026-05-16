import { Logger, logger } from '@smmachine/utils';
import { IRepository } from '../../infrastructure/repository';
import { Commit, PairingIndexResult } from '../../domain-types';

export interface IPairingIndexService {
  getPairingIndex(options?: {
    selectedAuthors?: string[];
    startDate?: string;
    endDate?: string;
    includeAuthors?: string;
    excludeAuthors?: string;
  }): Promise<PairingIndexResult>;
}

/**
 * PairingIndex calculates the percentage of commits that have co-authors.
 * This metric helps identify pair programming practices.
 *
 * Formula: (paired_commits / total_analyzed_commits) * 100
 */
export class PairingIndexService implements IPairingIndexService {
  private logger: Logger = logger;

  constructor(private commitRepository: IRepository<Commit>) {}

  async getPairingIndex(options?: {
    selectedAuthors?: string[];
    startDate?: string;
    endDate?: string;
    includeAuthors?: string;
    excludeAuthors?: string;
  }): Promise<PairingIndexResult> {
    let selectedAuthors = options?.selectedAuthors || [];
    const startDate = options?.startDate;
    const endDate = options?.endDate;
    const includeAuthorsStr = options?.includeAuthors;
    const excludeAuthorsStr = options?.excludeAuthors;

    // Parse additional authors from string
    if (includeAuthorsStr) {
      const parsed = includeAuthorsStr
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0);
      selectedAuthors = [...selectedAuthors, ...parsed];
    }

    // Parse excluded authors
    let excludedList: Set<string> = new Set();
    if (excludeAuthorsStr) {
      excludedList = new Set(
        excludeAuthorsStr
          .split(',')
          .map((a) => a.trim().toLowerCase())
          .filter((a) => a.length > 0)
      );
    }

    if (selectedAuthors.length > 0) {
      this.logger.info(`Filtering commits to authors: ${selectedAuthors.join(', ')}`);
    }

    // Load all commits
    const allCommits = await this.commitRepository.loadAll();

    // Filter by date range
    let filteredCommits = allCommits;
    if (startDate || endDate) {
      filteredCommits = this.filterByDateRange(allCommits, startDate, endDate);
    }

    // Filter by authors
    if (selectedAuthors.length > 0 || excludedList.size > 0) {
      filteredCommits = this.filterByAuthors(filteredCommits, selectedAuthors, excludedList);
    }

    // Count paired commits (those with co-authors)
    const totalCommits = filteredCommits.length;
    const pairedCommits = filteredCommits.filter(
      (commit) => commit.files && commit.files.length > 0
    ).length;

    this.logger.info(`Total commits analyzed: ${totalCommits}`);
    this.logger.info(`Total commits with co-authors: ${pairedCommits}`);

    if (totalCommits === 0) {
      return {
        pairingIndexPercentage: 0.0,
        totalAnalyzedCommits: 0,
        pairedCommits: 0,
      };
    }

    const index = (pairedCommits / totalCommits) * 100;
    const pairingIndex = Math.round(index * 100) / 100; // Round to 2 decimal places

    return {
      pairingIndexPercentage: pairingIndex,
      totalAnalyzedCommits: totalCommits,
      pairedCommits,
    };
  }

  private filterByDateRange(commits: Commit[], startDate?: string, endDate?: string): Commit[] {
    if (!startDate && !endDate) {
      return commits;
    }

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    return commits.filter((commit) => {
      const commitDate = new Date(commit.timestamp);
      if (start && commitDate < start) return false;
      if (end && commitDate > end) return false;
      return true;
    });
  }

  private filterByAuthors(
    commits: Commit[],
    selectedAuthors: string[],
    excludedList: Set<string>
  ): Commit[] {
    return commits.filter((commit) => {
      const authorLower = commit.author.toLowerCase();

      if (excludedList.has(authorLower)) {
        return false;
      }

      if (selectedAuthors.length === 0) {
        return true;
      }

      return selectedAuthors.some((author) => author.toLowerCase() === authorLower);
    });
  }
}
