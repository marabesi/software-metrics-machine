import { FiltersProvider } from '@/components/filters/FiltersContext';
import { defaultFilters } from '@/components/filters/DashboardFilters';
import { LinkBuilderProvider } from '@/components/providers/LinkBuilderContext';
import { ConfigurationProvider } from '@/components/providers/ConfigurationContext';
import DrawerLayout from './drawer-layout';
import { Suspense } from 'react';
import { configurationAPI } from '@/server/api';
import { DashboardConfiguration } from '@/server/api/configuration';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configuration: DashboardConfiguration = await configurationAPI.getConfiguration();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {configuration.result.github_repository &&
        <ConfigurationProvider config={configuration.result}>
          <FiltersProvider initialFilters={defaultFilters}>
            <LinkBuilderProvider config={configuration.result}>
              <DrawerLayout repository={configuration.result.github_repository}>
                {children}
              </DrawerLayout>
            </LinkBuilderProvider>
          </FiltersProvider>
        </ConfigurationProvider>}
    </Suspense>
  );
}
