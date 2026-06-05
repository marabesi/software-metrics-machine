import React from "react";
import { renderHook } from "@testing-library/react";
import { FiltersProvider, useFilters } from "@/components/filters/FiltersContext";

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  usePathname: jest.fn(() => '/dashboard/insights'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

describe('Insights context', () => {
  it('provides filters context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FiltersProvider>{children}</FiltersProvider>
    );
    
    const { result } = renderHook(() => useFilters(), { wrapper });
    expect(result.current.filters).toBeDefined();
  });

  it('filters context has expected properties', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FiltersProvider>{children}</FiltersProvider>
    );
    
    const { result } = renderHook(() => useFilters(), { wrapper });
    expect(result.current.filters.startDate).toBe('');
    expect(result.current.filters.endDate).toBe('');
  });
});
