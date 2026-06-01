import { FiltersProvider } from '@/components/filters/FiltersContext';
import { defaultFilters } from '@/components/filters/DashboardFilters';
import { LinkBuilderProvider } from '@/components/providers/LinkBuilderContext';
import DrawerLayout from './drawer-layout';
import { Suspense } from 'react';
import { Configuration } from '@smmachine/core';
import { configurationAPI } from '@/server/api';
import { UrlBuilderConfig } from '@/server/utils/urlBuilder';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configuration = new Configuration()
  const urlBuilderConfig: UrlBuilderConfig = {
    gitProvider: 'github',
    gitRepository: 'owner/repo',
  };

  try {
    const apiConfig = await configurationAPI.getConfiguration();
    const cfg = (apiConfig as any).result || apiConfig as any;
    urlBuilderConfig.gitProvider = cfg.git_provider || 'github';
    urlBuilderConfig.gitRepository = cfg.github_repository || 'owner/repo';
    if (cfg.git_repository_location) {
      urlBuilderConfig.gitRepositoryLocation = cfg.git_repository_location;
    }
    if (cfg.sonar_url) {
      urlBuilderConfig.sonarqubeUrl = cfg.sonar_url;
    }
    if (cfg.sonar_project) {
      urlBuilderConfig.sonarqubeProject = cfg.sonar_project;
    }
  } catch (error) {
    console.warn('Failed to fetch configuration for URL builder:', error);
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {configuration.githubRepository &&
        <FiltersProvider initialFilters={defaultFilters}>
          <LinkBuilderProvider config={urlBuilderConfig}>
            <DrawerLayout repository={configuration.githubRepository}>
              {children}
            </DrawerLayout>
          </LinkBuilderProvider>
        </FiltersProvider>}
    </Suspense>
  );
}
