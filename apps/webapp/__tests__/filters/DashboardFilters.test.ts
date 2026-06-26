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
      timezone: 'Europe/Madrid',
    });

    expect(params.get('workflowSelector')).toBe('release.yml');
    expect(params.get('workflowStatus')).toBe('completed');
    expect(params.get('timezone')).toBe('Europe/Madrid');
  });

  it('parses filter state from search params', () => {
    const filters = parseDashboardFilters(
      { workflowSelector: 'release.yml', workflowStatus: 'completed', timezone: 'Europe/Madrid' },
      defaultFilters,
    );

    expect(filters.workflowSelector).toBe('release.yml');
    expect(filters.workflowStatus).toEqual(['completed']);
    expect(filters.timezone).toBe('Europe/Madrid');
  });

  it('parses false boolean filters from search params', () => {
    const filters = parseDashboardFilters(
      { sonarqubeRemoveFolders: 'false' },
      defaultFilters,
    );

    expect(filters.sonarqubeRemoveFolders).toBe(false);
  });
});
