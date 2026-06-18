import { cookies } from 'next/headers';
import { configurationAPI, projectsAPI } from '@/server/api';

export async function loadAppProviderData() {
  const cookieStore = await cookies();
  const rawSelectedProject = cookieStore.get('smm_active_project')?.value;
  const selectedProject = rawSelectedProject ? decodeURIComponent(rawSelectedProject) : undefined;

  const [configuration, projects] = await Promise.all([
    configurationAPI.getConfiguration(),
    projectsAPI.getProjects(),
  ]);

  return {
    configuration: configuration.result,
    projects: projects.result,
    initialActiveProject: selectedProject || projects.result[0]?.github_repository,
  };
}
