import { FiltersProvider } from '@/components/filters/FiltersContext';
import { defaultFilters } from '@/components/filters/DashboardFilters';
import { LinkBuilderProvider } from '@/components/providers/LinkBuilderContext';
import { ConfigurationProvider } from '@/components/providers/ConfigurationContext';
import DrawerLayout from './drawer-layout';
import { Suspense } from 'react';
import { configurationAPI } from '@/server/api';
import { UrlBuilderConfig } from '@/server/utils/urlBuilder';
import { DashboardConfiguration } from '@/server/api/configuration';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configuration: DashboardConfiguration = await configurationAPI.getConfiguration();
  const urlBuilderConfig: UrlBuilderConfig = {
    gitProvider: configuration.result.git_provider,
    gitRepository: configuration.result.github_repository,
    gitRepositoryLocation: configuration.result.git_repository_location,
    sonarqubeUrl: configuration.result.sonar_url,
    sonarqubeProject: configuration.result.sonar_project,
  };
  urlBuilderConfig.gitProvider = configuration.result.git_provider;
  urlBuilderConfig.gitRepository = configuration.result.github_repository;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {configuration.result.github_repository &&
        <ConfigurationProvider config={configuration.result}>
          <FiltersProvider initialFilters={defaultFilters}>
            <LinkBuilderProvider config={urlBuilderConfig}>
              <DrawerLayout repository={configuration.result.github_repository}>
                {children}
              </DrawerLayout>
            </LinkBuilderProvider>
          </FiltersProvider>
        </ConfigurationProvider>}
    </Suspense>
  );
}
