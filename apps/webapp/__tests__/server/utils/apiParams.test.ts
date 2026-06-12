import { buildPullRequestApiParams } from '@/server/utils/apiParams';

describe('buildPullRequestApiParams', () => {
  it('includes status when pullRequestStatus is provided', () => {
    const params = buildPullRequestApiParams({
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      authorSelect: ['alice'],
      excludeAuthorSelect: ['bot'],
      excludeCommenterSelect: ['renovate'],
      labelSelector: ['bug'],
      pullRequestStatus: 'merged',
      aggregateBy: 'week',
    });

    expect(params.status).toBe('merged');
    expect(params.start_date).toBe('2026-01-01');
    expect(params.end_date).toBe('2026-01-31');
    expect(params.authors).toBe('alice');
    expect(params.exclude_authors).toBe('bot');
    expect(params.exclude_commenters).toBe('renovate');
    expect(params.labels).toBe('bug');
  });

  it('omits status when pullRequestStatus is not provided', () => {
    const params = buildPullRequestApiParams({
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      authorSelect: [],
      labelSelector: [],
      aggregateBy: 'month',
    });

    expect(params.status).toBeUndefined();
  });
});
