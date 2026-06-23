import {
  defaultFilters,
  parseDashboardFilters,
  serializeDashboardFilters,
} from '@/components/filters/DashboardFilters';

describe('DashboardFilters', () => {
  it('serializes filter state', () => {
    const params = serializeDashboardFilters({
      ...defaultFilters,
      workflowSelector: 'release.yml',
      workflowStatus: ['completed'],
    });

    expect(params.get('workflowSelector')).toBe('release.yml');
    expect(params.get('workflowStatus')).toBe('completed');
  });

  it('parses filter state from search params', () => {
    const filters = parseDashboardFilters(
      { workflowSelector: 'release.yml', workflowStatus: 'completed' },
      defaultFilters,
    );

    expect(filters.workflowSelector).toBe('release.yml');
    expect(filters.workflowStatus).toEqual(['completed']);
  });

  it('parses false boolean filters from search params', () => {
    const filters = parseDashboardFilters(
      { sonarqubeRemoveFolders: 'false' },
      defaultFilters,
    );

    expect(filters.sonarqubeRemoveFolders).toBe(false);
  });
});
