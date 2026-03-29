import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { FiltersProvider, useFilters, DashboardFilters } from '@/components/filters/FiltersContext';

describe('FiltersContext', () => {
  it('throws error when useFilters is used outside provider', () => {
    // Suppress console.error for this test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useFilters());
    }).toThrow('useFilters must be used within a FiltersProvider');
    
    spy.mockRestore();
  });

  it('provides initial filter state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FiltersProvider>{children}</FiltersProvider>
    );

    const { result } = renderHook(() => useFilters(), { wrapper });

    expect(result.current.filters.startDate).toBe('');
    expect(result.current.filters.endDate).toBe('');
    expect(result.current.filters.workflowSelector).toBe('All');
    expect(result.current.filters.workflowStatus).toEqual([]);
    expect(result.current.filters.aggregateBy).toBe('week');
    expect(result.current.filters.topEntries).toBe(20);
  });

  it('updates filter value', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FiltersProvider>{children}</FiltersProvider>
    );

    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.updateFilter('startDate', '2023-01-01');
    });

    expect(result.current.filters.startDate).toBe('2023-01-01');
  });

  it('updates multiple filters independently', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FiltersProvider>{children}</FiltersProvider>
    );

    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.updateFilter('startDate', '2023-01-01');
      result.current.updateFilter('endDate', '2023-12-31');
      result.current.updateFilter('workflowSelector', 'workflow-1');
    });

    expect(result.current.filters.startDate).toBe('2023-01-01');
    expect(result.current.filters.endDate).toBe('2023-12-31');
    expect(result.current.filters.workflowSelector).toBe('workflow-1');
  });

  it('updates array filters', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FiltersProvider>{children}</FiltersProvider>
    );

    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.updateFilter('workflowStatus', ['completed', 'in_progress']);
    });

    expect(result.current.filters.workflowStatus).toEqual(['completed', 'in_progress']);
  });

  it('updates numeric filters', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FiltersProvider>{children}</FiltersProvider>
    );

    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.updateFilter('topEntries', 50);
    });

    expect(result.current.filters.topEntries).toBe(50);
  });

  it('resets filters to default state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FiltersProvider>{children}</FiltersProvider>
    );

    const { result } = renderHook(() => useFilters(), { wrapper });

    // Change some filters
    act(() => {
      result.current.updateFilter('startDate', '2023-01-01');
      result.current.updateFilter('workflowStatus', ['completed']);
      result.current.updateFilter('topEntries', 50);
    });

    expect(result.current.filters.startDate).toBe('2023-01-01');
    expect(result.current.filters.workflowStatus).toEqual(['completed']);
    expect(result.current.filters.topEntries).toBe(50);

    // Reset
    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters.startDate).toBe('');
    expect(result.current.filters.endDate).toBe('');
    expect(result.current.filters.workflowStatus).toEqual([]);
    expect(result.current.filters.aggregateBy).toBe('week');
    expect(result.current.filters.topEntries).toBe(20);
    expect(result.current.filters.workflowSelector).toBe('All');
  });

  it('initializes with all expected filter properties', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FiltersProvider>{children}</FiltersProvider>
    );

    const { result } = renderHook(() => useFilters(), { wrapper });
    const filters = result.current.filters;

    // Date filters
    expect(filters).toHaveProperty('startDate');
    expect(filters).toHaveProperty('endDate');

    // Pipeline filters
    expect(filters).toHaveProperty('workflowSelector');
    expect(filters).toHaveProperty('workflowStatus');
    expect(filters).toHaveProperty('workflowConclusions');
    expect(filters).toHaveProperty('jobSelector');
    expect(filters).toHaveProperty('branch');
    expect(filters).toHaveProperty('event');

    // PR filters
    expect(filters).toHaveProperty('authorSelect');
    expect(filters).toHaveProperty('labelSelector');
    expect(filters).toHaveProperty('aggregateBy');

    // Source code filters
    expect(filters).toHaveProperty('ignorePatternFiles');
    expect(filters).toHaveProperty('includePatternFiles');
    expect(filters).toHaveProperty('authorSelectSourceCode');
    expect(filters).toHaveProperty('topEntries');
    expect(filters).toHaveProperty('typeChurn');

    // Metrics filters
    expect(filters).toHaveProperty('aggregateMetric');
  });

  it('maintains other filters when updating one', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FiltersProvider>{children}</FiltersProvider>
    );

    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.updateFilter('startDate', '2023-01-01');
      result.current.updateFilter('workflowStatus', ['completed']);
    });

    const originalAggregateBy = result.current.filters.aggregateBy;
    const originalTopEntries = result.current.filters.topEntries;

    act(() => {
      result.current.updateFilter('endDate', '2023-12-31');
    });

    // Verify unchanged filters remain the same
    expect(result.current.filters.aggregateBy).toBe(originalAggregateBy);
    expect(result.current.filters.topEntries).toBe(originalTopEntries);
    expect(result.current.filters.startDate).toBe('2023-01-01');
    expect(result.current.filters.workflowStatus).toEqual(['completed']);
  });
});
