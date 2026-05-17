import { FiltersProvider } from '@/components/filters/FiltersContext';
import { defaultFilters } from '@/components/filters/DashboardFilters';
import DrawerLayout from './drawer-layout';
import { Suspense } from 'react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <Suspense fallback={<div>Loading...</div>}>
       <FiltersProvider initialFilters={defaultFilters}>
        <DrawerLayout>
          {children}
        </DrawerLayout>
      </FiltersProvider>
    </Suspense>
  );
}
