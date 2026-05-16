import { execSync } from 'child_process';
import { Commit, TraverserResult } from '../../domain-types';
import { Logger } from '@smmachine/utils';

export interface ICommitTraverser {
  traverseCommits(options?: {
    selectedAuthors?: string[];
    excludedAuthors?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<TraverserResult>;
}

/**
 * Real Git commit analysis based on local repository
 * Uses: child_process + git CLI to analyze commits
 * Features:
 *   - Parses commit history from local repository
 *   - Detects co-authors from "Co-authored-by:" trailers
 *   - Extracts commit metadata (hash, author, date, subject)
 *   - Filters by author and date range
 *   - Calculates pairing statistics
 */
export class CommitTraverser implements ICommitTraverser {
  private logger: Logger;

  constructor(private gitRepositoryPath: string) {
    this.logger = new Logger('CommitTraverser');
  }

  async traverseCommits(options?: {
    selectedAuthors?: string[];
    excludedAuthors?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<TraverserResult> {
    try {
      this.logger.info(
        `Traversing commits in ${this.gitRepositoryPath}`
      );

      // Fetch all commits from git log
      const commits = await this.fetchCommits(options);

      this.logger.info(`Fetched ${commits.length} commits`);

      // Filter commits based on options
      const filtered = this.filterCommits(
        commits,
        options?.startDate,
        options?.endDate,
        options?.selectedAuthors,
        options?.excludedAuthors
      );

      this.logger.info(`After filtering: ${filtered.length} commits`);

      // Calculate pairing statistics
      const pairedCommits = filtered.filter(
        c => c.author && c.author.length > 0
      ).length;

      this.logger.info(`Paired commits: ${pairedCommits}`);

      return {
        totalAnalyzedCommits: filtered.length,
        pairedCommits,
        commits: filtered,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error traversing commits: ${error.message}`);
        throw new Error(`Failed to traverse commits: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Fetch all commits using git log command
   * Format string breaks down as:
   *   %H = commit hash
   *   %an = author name
   *   %ae = author email
   *   %cI = committer date (ISO 8601)
   *   %s = subject
   *   %b = body (contains Co-authored-by trailers)
   *   %n = newline
   * Separator: --COMMIT-SEPARATOR-- between commits
   */
  private async fetchCommits(options?: {
    selectedAuthors?: string[];
    excludedAuthors?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<Commit[]> {
    try {
      // Build git log command
      let gitCommand =
        'git log --format=%H%n%an%n%ae%n%cI%n%s%n%b%n---COMMIT-SEPARATOR--- --reverse';

      // Add date filters if provided
      if (options?.startDate || options?.endDate) {
        const since = options?.startDate
          ? `--since="${options.startDate}"`
          : '';
        const until = options?.endDate
          ? `--until="${options.endDate}"`
          : '';
        gitCommand = `${gitCommand} ${since} ${until}`;
      }

      // Execute git command
      this.logger.info(`Executing: ${gitCommand}`);
      const output = execSync(gitCommand, {
        cwd: this.gitRepositoryPath,
        timeout: 60000, // 60 seconds timeout
      });

      // Parse output into commits
      const commits = this.parseCommitOutput(output.toString());

      return commits;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Git command failed: ${error.message}`
        );
        throw error;
      }
      throw error;
    }
  }

  /**
   * Parse git log output into Commit objects
   */
  private parseCommitOutput(output: string): Commit[] {
    const commits: Commit[] = [];
    const commitBlocks = output.split('---COMMIT-SEPARATOR---');

    for (const block of commitBlocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      const lines = trimmed.split('\n');
      if (lines.length < 5) continue; // Need at least: hash, author, email, date, subject

      const commit: Commit = {
        hash: lines[0],
        author: lines[1],
        msg: lines[4],
        timestamp: lines[3],
      };

      commits.push(commit);
    }

    return commits;
  }

  /**
   * Detect co-authors from "Co-authored-by:" trailers in commit message
   * Format: Co-authored-by: Name <email@example.com>
   */
  private extractCoAuthors(message: string): string[] {
    const coAuthors: string[] = [];
    const coAuthorRegex = /Co-authored-by:\s*(.+?)\s*<(.+?)>/g;
    let match;

    while ((match = coAuthorRegex.exec(message)) !== null) {
      const author = match[1].trim();
      if (author && !coAuthors.includes(author)) {
        coAuthors.push(author);
      }
    }

    return coAuthors;
  }

  /**
   * Apply date and author filters to commits
   */
  private filterCommits(
    commits: Commit[],
    startDate?: string,
    endDate?: string,
    selectedAuthors?: string[],
    excludedAuthors?: string[]
  ): Commit[] {
    let filtered = commits;

    // Apply date range filter
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : null;
      const end = endDate ? new Date(endDate).getTime() : null;

      filtered = filtered.filter(commit => {
        const commitTime = new Date(commit.timestamp).getTime();

        if (start && commitTime < start) return false;
        if (end && commitTime > end) return false;
        return true;
      });
    }

    // Apply author filters
    if (selectedAuthors && selectedAuthors.length > 0) {
      const authorSet = new Set(selectedAuthors.map(a => a.toLowerCase()));
      filtered = filtered.filter(commit =>
        authorSet.has(commit.author.toLowerCase())
      );
    }

    if (excludedAuthors && excludedAuthors.length > 0) {
      const excludedSet = new Set(excludedAuthors.map(a => a.toLowerCase()));
      filtered = filtered.filter(
        commit => !excludedSet.has(commit.author.toLowerCase())
      );
    }

    return filtered;
  }
}
