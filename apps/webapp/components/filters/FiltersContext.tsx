'use client';

import { createContext, ReactElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  const shouldSyncToUrl = useRef(false);

  useEffect(() => {
    if (!shouldSyncToUrl.current) return;

    shouldSyncToUrl.current = false;
    const nextParams = serializeDashboardFilters(filters);
    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [filters, pathname, router]);

  const updateFilter = useCallback(<K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    shouldSyncToUrl.current = true;
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    shouldSyncToUrl.current = true;
  }, []);

  const contextValue = useMemo(() => ({ filters, updateFilter, resetFilters }), [filters, resetFilters, updateFilter]);

  return (
    <FiltersContext.Provider value={contextValue}>
      {children}
    </FiltersContext.Provider>
  );
};
