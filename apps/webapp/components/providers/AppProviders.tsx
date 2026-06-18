import { ReactNode } from 'react';
import { defaultFilters } from '@/components/filters/DashboardFilters';
import { FiltersProvider } from '@/components/filters/FiltersContext';
import { ConfigurationProvider } from '@/components/providers/ConfigurationContext';
import { LinkBuilderProvider } from '@/components/providers/LinkBuilderContext';
import { ProjectsProvider } from '@/components/providers/ProjectsContext';
import { DashboardGlobalConfiguration, ProjectItem } from '@/server/api/configuration';

interface AppProvidersProps {
  children: ReactNode;
  configuration: DashboardGlobalConfiguration;
  projects: ProjectItem[];
  initialActiveProject?: string;
  requireConfiguration?: boolean;
}

export default function AppProviders({
  children,
  configuration,
  projects,
  initialActiveProject,
  requireConfiguration = false,
}: AppProvidersProps) {
  const projectProvider = (
    <ProjectsProvider projects={projects} initialActiveProject={initialActiveProject}>
      {children}
    </ProjectsProvider>
  );

  if (!configuration.github_repository) {
    return requireConfiguration ? null : projectProvider;
  }

  return (
    <ConfigurationProvider config={configuration}>
      <FiltersProvider initialFilters={defaultFilters}>
        <LinkBuilderProvider config={configuration}>
          {projectProvider}
        </LinkBuilderProvider>
      </FiltersProvider>
    </ConfigurationProvider>
  );
}
