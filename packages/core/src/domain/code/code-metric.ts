import { Logger, logger } from '@smm/utils';

export interface CodeMetadataResult {
  message: string;
  percentage?: number;
}

export interface ICodeMetricService {
  analyzeCodeChanges(options?: {
    startDate?: string;
    endDate?: string;
    ignore?: string;
    testPatterns?: string;
  }): Promise<CodeMetadataResult>;
}

/**
 * CodeMetric analyzes code changes to determine the ratio of production code changes
 * that are accompanied by test changes.
 *
 * This measures test-driven development practices.
 */
export class CodeMetricService implements ICodeMetricService {
  private logger: Logger = logger;

  async analyzeCodeChanges(options?: {
    startDate?: string;
    endDate?: string;
    ignore?: string;
    testPatterns?: string;
  }): Promise<CodeMetadataResult> {
    // Parse ignore patterns
    const ignoreList = this.parsePatterns(options?.ignore);
    const testPatternsList = this.parsePatterns(options?.testPatterns);

    this.logger.info(
      `Analyzing code changes with ${testPatternsList.length} test patterns`
    );

    // This would typically traverse git history and analyze commits
    // For now, returning a placeholder that demonstrates the calculation structure
    
    return {
      message: 'Code analysis would traverse commits and calculate test coverage ratio',
      percentage: 0,
    };
  }

  /**
   * Determines if a file path should be ignored based on patterns.
   * Supports glob patterns (*.ext) and folder/path matches.
   */
  private isIgnoredPath(path: string, ignoreList: string[]): boolean {
    if (ignoreList.length === 0) return false;

    const normalizedPath = path.replace(/\\/g, '/');

    for (const pattern of ignoreList) {
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

  /**
   * Determines if a file path is a test file based on patterns
   * or heuristic (default: contains 'test' in name or path).
   */
  private isTestPath(path: string, testPatternsList: string[]): boolean {
    const normalizedPath = path.replace(/\\/g, '/');
    const fileName = path.split('/').pop()?.toLowerCase() || '';
    const fullLower = normalizedPath.toLowerCase();

    // If test patterns provided, use them
    if (testPatternsList.length > 0) {
      for (const pattern of testPatternsList) {
        // Handle glob patterns
        if (pattern.startsWith('*.')) {
          const ext = pattern.substring(1);
          if (fileName.endsWith(ext)) {
            return true;
          }
        }

        // Handle path patterns
        if (fullLower.includes(pattern.toLowerCase())) {
          return true;
        }
      }
      return false;
    }

    // Fallback heuristic: check if 'test' appears in name or path
    return (
      fileName.includes('test') ||
      fullLower.includes('/tests/') ||
      fullLower.includes('/test/')
    );
  }

  /**
   * Parse comma-separated patterns into an array.
   */
  private parsePatterns(patternStr?: string): string[] {
    if (!patternStr) return [];
    return patternStr
      .split(',')
      .map(p => p.trim().replace(/\\/g, '/').replace(/\/$/, ''))
      .filter(p => p.length > 0);
  }
}
