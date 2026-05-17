import { FiltersProvider } from '@/components/filters/FiltersContext';
import { defaultFilters } from '@/components/filters/DashboardFilters';
import DrawerLayout from './drawer-layout';
import { Suspense } from 'react';
import { Configuration } from '@smmachine/core';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configuration = new Configuration()
  return (
    <Suspense fallback={<div>Loading...</div>}>
       <FiltersProvider initialFilters={defaultFilters}>
        <DrawerLayout repository={configuration.githubRepository}>
          {children}
        </DrawerLayout>
      </FiltersProvider>
    </Suspense>
  );
}
