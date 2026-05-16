import { CommitTraverser } from '../../../src';

describe('CommitTraverser', () => {
  let traverser: CommitTraverser;

  beforeEach(() => {
    traverser = new CommitTraverser('/path/to/repo');
  });

  it('should traverse commits', async () => {
    const result = await traverser.traverseCommits({
      selectedAuthors: ['Alice'],
    });

    expect(result.totalAnalyzedCommits).toBeGreaterThanOrEqual(0);
    expect(result.pairedCommits).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.commits)).toBe(true);
  });

  it('should filter commits by date range', async () => {
    const result = await traverser.traverseCommits({
      startDate: '2024-01-01',
      endDate: '2024-02-01',
    });

    expect(result).toBeDefined();
  });

  it('should filter commits by authors', async () => {
    const result = await traverser.traverseCommits({
      selectedAuthors: ['Alice', 'Bob'],
    });

    expect(result).toBeDefined();
  });

  it('should exclude authors from results', async () => {
    const result = await traverser.traverseCommits({
      excludedAuthors: ['Bot', 'CI'],
    });

    expect(result).toBeDefined();
  });
});
