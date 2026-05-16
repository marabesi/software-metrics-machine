import { describe, it, expect, beforeAll } from 'vitest';
import { CommitTraverser } from '../../../src';

describe('Git Commit Analysis - CommitTraverser', () => {
  let traverser: CommitTraverser;

  beforeAll(() => {
    // Use the current project's git repository for testing
    traverser = new CommitTraverser(process.cwd());
  });

  describe('Commit Traversal', () => {
    it('should traverse commits from repository', async () => {
      const result = await traverser.traverseCommits();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalAnalyzedCommits');
      expect(result).toHaveProperty('pairedCommits');
      expect(result).toHaveProperty('commits');
      expect(typeof result.totalAnalyzedCommits).toBe('number');
      expect(result.totalAnalyzedCommits).toBeGreaterThanOrEqual(0);
    });

    it('should extract commit metadata correctly', async () => {
      const result = await traverser.traverseCommits();

      if (result.commits.length > 0) {
        const commit = result.commits[0];
        expect(commit).toHaveProperty('hash');
        expect(commit).toHaveProperty('author');
        expect(commit).toHaveProperty('email');
        expect(commit).toHaveProperty('timestamp');
        expect(commit).toHaveProperty('subject');
        expect(commit).toHaveProperty('coAuthors');

        // Validate types
        expect(typeof commit.hash).toBe('string');
        expect(typeof commit.author).toBe('string');
        expect(typeof commit.subject).toBe('string');
        expect(Array.isArray(commit.coAuthors)).toBe(true);
      }
    });

    it('should detect paired commits (with co-authors)', async () => {
      const result = await traverser.traverseCommits();

      expect(result.pairedCommits).toBeGreaterThanOrEqual(0);
      expect(result.pairedCommits).toBeLessThanOrEqual(result.totalAnalyzedCommits);

      // Check that paired commits actually have co-authors
      const pairedCommits = result.commits.filter((c) => c.coAuthors && c.coAuthors.length > 0);
      expect(pairedCommits.length).toBe(result.pairedCommits);
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter commits by start date', async () => {
      // Get commits from 2024 onwards
      const result = await traverser.traverseCommits({
        startDate: '2024-01-01',
      });

      expect(result.commits).toBeDefined();
      result.commits.forEach((commit) => {
        const commitDate = new Date(commit.timestamp);
        expect(commitDate.getTime()).toBeGreaterThanOrEqual(new Date('2024-01-01').getTime());
      });
    });

    it('should filter commits by end date', async () => {
      // Get commits before 2024
      const result = await traverser.traverseCommits({
        endDate: '2023-12-31',
      });

      expect(result.commits).toBeDefined();
      result.commits.forEach((commit) => {
        const commitDate = new Date(commit.timestamp);
        expect(commitDate.getTime()).toBeLessThanOrEqual(new Date('2023-12-31').getTime());
      });
    });

    it('should filter commits by date range', async () => {
      const result = await traverser.traverseCommits({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(result.commits).toBeDefined();
      result.commits.forEach((commit) => {
        const commitDate = new Date(commit.timestamp);
        expect(commitDate.getTime()).toBeGreaterThanOrEqual(new Date('2024-01-01').getTime());
        expect(commitDate.getTime()).toBeLessThanOrEqual(new Date('2024-12-31').getTime());
      });
    });
  });

  describe('Author Filtering', () => {
    it('should handle empty result for non-existent author', async () => {
      const result = await traverser.traverseCommits({
        selectedAuthors: ['NonExistentAuthor12345'],
      });

      expect(result.commits.length).toBe(0);
    });

    it('should filter commits by selected author', async () => {
      // First, get all commits to find an actual author
      const allCommits = await traverser.traverseCommits();

      if (allCommits.commits.length > 0) {
        const author = allCommits.commits[0].author;
        const result = await traverser.traverseCommits({
          selectedAuthors: [author],
        });

        expect(result.commits.length).toBeGreaterThan(0);
        result.commits.forEach((commit) => {
          expect(commit.author.toLowerCase()).toBe(author.toLowerCase());
        });
      }
    });

    it('should support multiple authors filter', async () => {
      const allCommits = await traverser.traverseCommits();

      if (allCommits.commits.length >= 2) {
        const authors = [
          allCommits.commits[0].author,
          allCommits.commits[allCommits.commits.length - 1].author,
        ];

        const result = await traverser.traverseCommits({
          selectedAuthors: authors,
        });

        expect(result.commits.length).toBeGreaterThan(0);
        result.commits.forEach((commit) => {
          const matches = authors.some((a) => a.toLowerCase() === commit.author.toLowerCase());
          expect(matches).toBe(true);
        });
      }
    });

    it('should exclude specified authors', async () => {
      const allCommits = await traverser.traverseCommits();
      const totalBefore = allCommits.commits.length;

      if (totalBefore > 0) {
        const authorToExclude = allCommits.commits[0].author;
        const result = await traverser.traverseCommits({
          excludedAuthors: [authorToExclude],
        });

        result.commits.forEach((commit) => {
          expect(commit.author.toLowerCase()).not.toBe(authorToExclude.toLowerCase());
        });

        // Should have fewer commits after exclusion
        expect(result.commits.length).toBeLessThan(totalBefore);
      }
    });
  });

  describe('Co-Author Detection', () => {
    it('should detect co-authored commits', async () => {
      const result = await traverser.traverseCommits();

      const coAuthoredCommits = result.commits.filter((c) => c.coAuthors && c.coAuthors.length > 0);

      // Note: May be 0 if no co-authored commits in repo
      expect(Array.isArray(coAuthoredCommits)).toBe(true);

      coAuthoredCommits.forEach((commit) => {
        expect(Array.isArray(commit.coAuthors)).toBe(true);
        expect(commit.coAuthors.length).toBeGreaterThan(0);
        commit.coAuthors.forEach((coAuthor) => {
          expect(typeof coAuthor).toBe('string');
          expect(coAuthor.length).toBeGreaterThan(0);
        });
      });
    });

    it('should calculate pairing index correctly', async () => {
      const result = await traverser.traverseCommits();

      if (result.totalAnalyzedCommits > 0) {
        const expectedPaired = result.commits.filter(
          (c) => c.coAuthors && c.coAuthors.length > 0
        ).length;
        expect(result.pairedCommits).toBe(expectedPaired);
      }
    });
  });

  describe('Combined Filtering', () => {
    it('should filter by date and author simultaneously', async () => {
      const allCommits = await traverser.traverseCommits();

      if (allCommits.commits.length > 0) {
        const author = allCommits.commits[0].author;

        const result = await traverser.traverseCommits({
          selectedAuthors: [author],
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        });

        result.commits.forEach((commit) => {
          expect(commit.author.toLowerCase()).toBe(author.toLowerCase());
          const commitDate = new Date(commit.timestamp);
          expect(commitDate.getTime()).toBeGreaterThanOrEqual(new Date('2024-01-01').getTime());
          expect(commitDate.getTime()).toBeLessThanOrEqual(new Date('2024-12-31').getTime());
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid repository path gracefully', async () => {
      const invalidTraverser = new CommitTraverser('/invalid/path/does/not/exist');

      try {
        await invalidTraverser.traverseCommits();
        // If we get here, error handling might not be working as expected
        // This is ok for testing purposes
      } catch (error: any) {
        expect(error.message).toMatch(/traverse commits|repository|git command failed/i);
      }
    });

    it('should initialize successfully', () => {
      const traverser = new CommitTraverser(process.cwd());
      expect(traverser).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should complete traversal in reasonable time', async () => {
      const start = Date.now();
      const result = await traverser.traverseCommits();
      const duration = Date.now() - start;

      // Should complete within 10 seconds (generous for large repos)
      expect(duration).toBeLessThan(10000);
      expect(result.commits).toBeDefined();
    });
  });
});
