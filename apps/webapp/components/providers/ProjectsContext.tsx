'use client';

import { createContext, ReactNode, useContext } from 'react';
import { ProjectItem } from '@/server/api/configuration';

interface ProjectsContextValue {
  projects: ProjectItem[];
  activeProject: string | undefined;
}

const ProjectsContext = createContext<ProjectsContextValue>({
  projects: [],
  activeProject: undefined,
});

export const useProjects = (): ProjectsContextValue => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};

export const ProjectsProvider = ({
  projects,
  activeProject,
  children,
}: {
  projects: ProjectItem[];
  activeProject?: string;
  children?: ReactNode | undefined;
}) => {
  return (
    <ProjectsContext.Provider value={{ projects, activeProject }}>
      {children}
    </ProjectsContext.Provider>
  );
};
