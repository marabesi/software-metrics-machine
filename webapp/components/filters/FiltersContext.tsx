'use client';

import React, { createContext, ReactElement, useContext, useState } from 'react';

export interface DashboardFilters {
  // Date filters
  startDate: string;
  endDate: string;

  // Pipeline filters
  workflowSelector?: string;
  workflowStatus: string[];
  workflowConclusions: string[];
  jobSelector: string[];
  branch: string[];
  event: string[];

  // PR filters
  authorSelect: string[];
  labelSelector: string[];
  aggregateBy: string;

  // Source code filters
  ignorePatternFiles: string;
  includePatternFiles: string;
  authorSelectSourceCode: string[];
  topEntries: number;
  typeChurn: string;

  // Metrics filters
  aggregateMetric: string;
}

const defaultFilters: DashboardFilters = {
  startDate: '',
  endDate: '',
  workflowSelector: undefined,
  workflowStatus: [],
  workflowConclusions: [],
  jobSelector: [],
  branch: [],
  event: [],
  authorSelect: [],
  labelSelector: [],
  aggregateBy: 'week',
  ignorePatternFiles: '',
  includePatternFiles: '',
  authorSelectSourceCode: [],
  topEntries: 20,
  typeChurn: 'added',
  aggregateMetric: 'avg',
};

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

export const FiltersProvider = ({ children }: { children?: ReactElement | undefined }) => {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  const updateFilter = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <FiltersContext.Provider value={{ filters, updateFilter, resetFilters }}>
      {children}
    </FiltersContext.Provider>
  );
};
