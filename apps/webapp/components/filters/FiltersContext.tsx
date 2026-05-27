'use client';

import { createContext, ReactElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DashboardFilters, defaultFilters, parseDashboardFilters, serializeDashboardFilters } from './DashboardFilters';

interface FiltersContextInterface {
  filters: DashboardFilters;
  updateFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  resetFilters: () => void;
}

const FiltersContext = createContext<FiltersContextInterface | undefined>(undefined);

export const useFilters = () => {
  const context = useContext(FiltersContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return context;
};

export const FiltersProvider = ({ initialFilters, children }: { initialFilters: DashboardFilters; children?: ReactElement | undefined }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialUrlFilters = useMemo(
    () => parseDashboardFilters(Object.fromEntries(searchParams.entries()), initialFilters),
    [initialFilters, searchParams],
  );

  const [filters, setFilters] = useState<DashboardFilters>(initialUrlFilters);
  const [shouldSyncToUrl, setShouldSyncToUrl] = useState(false);

  useEffect(() => {
    setFilters((currentFilters) => {
      const nextFilters = parseDashboardFilters(Object.fromEntries(searchParams.entries()), initialFilters);
      return JSON.stringify(currentFilters) === JSON.stringify(nextFilters) ? currentFilters : nextFilters;
    });
  }, [initialFilters, searchParams]);

  // Sync filters to URL after state updates complete (not during render)
  useEffect(() => {
    if (!shouldSyncToUrl) return;
    
    const nextParams = serializeDashboardFilters(filters);
    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    setShouldSyncToUrl(false);
  }, [filters, pathname, shouldSyncToUrl]);

  const updateFilter = useCallback(<K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    setFilters((prev) => {
      return {
        ...prev,
        [key]: value,
      };
    });
    setShouldSyncToUrl(true);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setShouldSyncToUrl(true);
  }, []);

  const contextValue = useMemo(() => ({ filters, updateFilter, resetFilters }), [filters, resetFilters, updateFilter]);

  return (
    <FiltersContext.Provider value={contextValue}>
      {children}
    </FiltersContext.Provider>
  );
};
