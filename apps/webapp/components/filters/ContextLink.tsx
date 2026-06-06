'use client';

import Link from 'next/link';
import { ReactNode, useMemo } from 'react';
import { useFilters } from '@/components/filters/FiltersContext';
import { DashboardFilters, serializeDashboardFilters } from '@/components/filters/DashboardFilters';

interface ContextLinkProps {
  href: string;
  filterOverrides?: Partial<DashboardFilters>;
  children: ReactNode;
  className?: string;
}

/**
 * A wrapper around next/link that automatically appends the current 
 * dashboard filters (from FiltersContext) to the URL query string,
 * optionally allowing specific filters to be overridden.
 */
export function ContextLink({ href, filterOverrides, children, className }: ContextLinkProps) {
  const { filters } = useFilters();

  const finalHref = useMemo(() => {
    // Clone current filters and apply overrides
    const newFilters = { ...filters, ...filterOverrides } as DashboardFilters;
    const params = serializeDashboardFilters(newFilters);
    const queryString = params.toString();
    
    return queryString ? `${href}?${queryString}` : href;
  }, [filters, filterOverrides, href]);

  return (
    <Link href={finalHref} className={className}>
      {children}
    </Link>
  );
}
