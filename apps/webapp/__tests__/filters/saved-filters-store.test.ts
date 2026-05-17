import {
  dashboardPathForSection,
  dashboardSectionFromPathname,
  SavedFiltersStorageAdapter,
  SavedFiltersStore,
} from '@/components/filters/saved-filters-store';
import { defaultFilters } from '@/components/filters/DashboardFilters';

class InMemoryAdapter implements SavedFiltersStorageAdapter {
  private readonly values: Record<string, string> = {};

  async getItem(key: string): Promise<string | null> {
    return this.values[key] ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.values[key] = value;
  }
}

describe('saved-filters-store', () => {
  it('saves and reads filters by section', async () => {
    const store = new SavedFiltersStore(new InMemoryAdapter(), 'test.saved.filters');

    await store.save('insights', '/dashboard/insights', 'My Insights', defaultFilters);
    await store.save('pipelines', '/dashboard/pipelines', 'My Pipeline', defaultFilters);

    const insights = await store.getBySection('insights');
    const pipelines = await store.getBySection('pipelines');

    expect(insights).toHaveLength(1);
    expect(insights[0]?.name).toBe('My Insights');
    expect(pipelines).toHaveLength(1);
    expect(pipelines[0]?.name).toBe('My Pipeline');
  });

  it('creates a unique suffix when names collide in same section', async () => {
    const store = new SavedFiltersStore(new InMemoryAdapter(), 'test.saved.filters');

    await store.save('insights', '/dashboard/insights', 'Team Alpha', defaultFilters);
    const second = await store.save('insights', '/dashboard/insights', 'Team Alpha', defaultFilters);

    expect(second.name).toBe('Team Alpha (2)');
  });

  it('removes a saved filter by id', async () => {
    const store = new SavedFiltersStore(new InMemoryAdapter(), 'test.saved.filters');

    const created = await store.save('source-code', '/dashboard/source-code', 'Churn Snapshot', defaultFilters);
    await store.remove(created.id);

    const sourceCode = await store.getBySection('source-code');
    expect(sourceCode).toHaveLength(0);
  });

  it('maps pathname and section helpers', () => {
    expect(dashboardSectionFromPathname('/dashboard/pull-requests')).toBe('pull-requests');
    expect(dashboardSectionFromPathname('/dashboard/source-code')).toBe('source-code');
    expect(dashboardSectionFromPathname('/dashboard')).toBe('insights');

    expect(dashboardPathForSection('insights')).toBe('/dashboard/insights');
  });
});
