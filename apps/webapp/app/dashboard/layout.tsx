import { FiltersProvider } from '@/components/filters/FiltersContext';
import { defaultFilters } from '@/components/filters/DashboardFilters';
import { LinkBuilderProvider } from '@/components/providers/LinkBuilderContext';
import { ConfigurationProvider } from '@/components/providers/ConfigurationContext';
import { ProjectsProvider } from '@/components/providers/ProjectsContext';
import DrawerLayout from './drawer-layout';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { configurationAPI, projectsAPI } from '@/server/api';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const rawSelectedProject = cookieStore.get('smm_active_project')?.value;
  const selectedProject = rawSelectedProject ? decodeURIComponent(rawSelectedProject) : undefined;

  const [configuration, projects] = await Promise.all([
    configurationAPI.getConfiguration(),
    projectsAPI.getProjects(),
  ]);

  // Determine active project: cookie value, or first project
  const activeProject = selectedProject || projects.result[0]?.github_repository;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {configuration.result.github_repository &&
        <ConfigurationProvider config={configuration.result}>
            <FiltersProvider initialFilters={defaultFilters}>
              <LinkBuilderProvider config={configuration.result}>
                  <ProjectsProvider projects={projects.result} activeProject={activeProject}>
                <DrawerLayout repository={configuration.result.github_repository}>
                  {children}
                </DrawerLayout>
                  </ProjectsProvider>
              </LinkBuilderProvider>
            </FiltersProvider>
        </ConfigurationProvider>}
    </Suspense>
  );
}
