import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it, vi } from 'vitest';
import { IssuesRepository, type IJiraIssuesClient, type Issue } from '../../src';
import { MockLoggerBuilder } from '../mock-logger-builder';

function createIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: '1',
    key: 'PROJ-1',
    title: 'Test issue',
    status: 'Open',
    createdAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

function createJiraClient(overrides: Partial<IJiraIssuesClient> = {}): IJiraIssuesClient {
  return {
    fetchIssues: vi.fn().mockResolvedValue([]),
    fetchIssueChanges: vi.fn(),
    fetchIssueComments: vi.fn(),
    ...overrides,
  };
}

describe('IssuesRepository', () => {
  const logger = new MockLoggerBuilder().build();

  describe('refreshIssues', () => {
    it('incremental update with a non-empty cache fetches issues created after the latest cached date and merges them', async () => {
      const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smm-issues-incr-'));
      const cachedIssues = [
        createIssue({ id: '1', createdAt: '2026-05-01T00:00:00.000Z' }),
        createIssue({ id: '2', createdAt: '2026-05-05T00:00:00.000Z' }),
      ];
      await fs.writeFile(path.join(cacheDir, 'issues.json'), JSON.stringify(cachedIssues));

      const freshIssue = createIssue({ id: '3', createdAt: '2026-05-20T00:00:00.000Z' });
      const fetchIssues = vi.fn().mockResolvedValue([freshIssue]);
      const jiraClient = createJiraClient({ fetchIssues });

      const repository = new IssuesRepository(jiraClient, cacheDir, logger);

      const result = await repository.refreshIssues({ incrementalUpdate: true });

      expect(fetchIssues).toHaveBeenCalledWith({
        startDate: '2026-05-05T00:00:00.000Z',
        endDate: undefined,
        status: undefined,
      });

      expect(result).toHaveLength(3);
      expect(result.map((issue) => issue.id).sort()).toEqual(['1', '2', '3']);
    });

    it('incremental update with an empty cache falls through to a plain fetch', async () => {
      const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smm-issues-incr-empty-'));
      const fresh = [createIssue({ id: '1' })];
      const fetchIssues = vi.fn().mockResolvedValue(fresh);
      const jiraClient = createJiraClient({ fetchIssues });

      const repository = new IssuesRepository(jiraClient, cacheDir, logger);

      const options = { incrementalUpdate: true };
      const result = await repository.refreshIssues(options);

      expect(fetchIssues).toHaveBeenCalledWith({
        startDate: undefined,
        endDate: undefined,
        status: undefined,
      });
      expect(result).toEqual(fresh);
    });

    it('manual date range with a non-empty cache fetches for that range and merges with the cache', async () => {
      const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smm-issues-range-'));
      const cachedIssue = createIssue({ id: '1', createdAt: '2026-04-01T00:00:00.000Z' });
      await fs.writeFile(path.join(cacheDir, 'issues.json'), JSON.stringify([cachedIssue]));

      const freshIssue = createIssue({ id: '2', createdAt: '2026-04-15T00:00:00.000Z' });
      const fetchIssues = vi.fn().mockResolvedValue([freshIssue]);
      const jiraClient = createJiraClient({ fetchIssues });

      const repository = new IssuesRepository(jiraClient, cacheDir, logger);

      const result = await repository.refreshIssues({
        startDate: '2026-04-01T00:00:00.000Z',
        endDate: '2026-04-30T00:00:00.000Z',
      });

      expect(fetchIssues).toHaveBeenCalledWith({
        startDate: '2026-04-01T00:00:00.000Z',
        endDate: '2026-04-30T00:00:00.000Z',
        status: undefined,
      });
      expect(result).toHaveLength(2);
      expect(result.map((issue) => issue.id).sort()).toEqual(['1', '2']);
    });

    it('manual date range with an empty cache falls through to a plain fetch', async () => {
      const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smm-issues-range-empty-'));
      const fresh = [createIssue({ id: '1' })];
      const fetchIssues = vi.fn().mockResolvedValue(fresh);
      const jiraClient = createJiraClient({ fetchIssues });

      const repository = new IssuesRepository(jiraClient, cacheDir, logger);

      const options = {
        startDate: '2026-04-01T00:00:00.000Z',
        endDate: '2026-04-30T00:00:00.000Z',
      };
      const result = await repository.refreshIssues(options);

      expect(fetchIssues).toHaveBeenCalledWith(options);
      expect(result).toEqual(fresh);
    });

    it('returns cached issues directly without fetching when no date range or incremental flag is set', async () => {
      const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smm-issues-cache-hit-'));
      const cachedIssues = [createIssue({ id: '1' }), createIssue({ id: '2' })];
      await fs.writeFile(path.join(cacheDir, 'issues.json'), JSON.stringify(cachedIssues));

      const fetchIssues = vi.fn();
      const jiraClient = createJiraClient({ fetchIssues });

      const repository = new IssuesRepository(jiraClient, cacheDir, logger);

      const result = await repository.refreshIssues();

      expect(fetchIssues).not.toHaveBeenCalled();
      expect(result).toEqual(cachedIssues);
    });

    it('forceRefresh does NOT bypass the incremental branch when incrementalUpdate is also set on a non-empty cache', async () => {
      const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smm-issues-force-incr-'));
      const cachedIssue = createIssue({ id: '1', createdAt: '2026-05-01T00:00:00.000Z' });
      await fs.writeFile(path.join(cacheDir, 'issues.json'), JSON.stringify([cachedIssue]));

      const freshIssue = createIssue({ id: '2', createdAt: '2026-06-01T00:00:00.000Z' });
      const fetchIssues = vi.fn().mockResolvedValue([freshIssue]);
      const jiraClient = createJiraClient({ fetchIssues });

      const repository = new IssuesRepository(jiraClient, cacheDir, logger);

      const result = await repository.refreshIssues({
        incrementalUpdate: true,
        forceRefresh: true,
      });

      // Guard 1 only checks `incrementalUpdate && fromCache.length > 0` — it never
      // inspects forceRefresh. So forceRefresh has no effect here: the incremental
      // merge branch still runs, fetching from the latest cached date and merging.
      expect(fetchIssues).toHaveBeenCalledWith({
        startDate: '2026-05-01T00:00:00.000Z',
        endDate: undefined,
        status: undefined,
      });
      expect(result).toHaveLength(2);
      expect(result.map((issue) => issue.id).sort()).toEqual(['1', '2']);
    });
  });
});
