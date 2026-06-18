'use client';

import { ReactNode } from 'react';
import { useConfiguration } from '@/components/providers/ConfigurationContext';
import DrawerLayout from './drawer-layout';

export default function DashboardFrame({ children }: { children: ReactNode }) {
  const configuration = useConfiguration();

  return (
    <DrawerLayout repository={configuration.github_repository}>
      {children}
    </DrawerLayout>
  );
}
