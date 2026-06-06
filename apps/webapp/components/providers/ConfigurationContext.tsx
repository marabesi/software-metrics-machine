'use client';

import { DashboardConfiguration } from '@/server/api/configuration';
import { createContext, ReactNode, useContext } from 'react';

const ConfigurationContext = createContext<DashboardConfiguration['result'] | undefined>(undefined);

export const useConfiguration = (): DashboardConfiguration['result'] => {
  const context = useContext(ConfigurationContext);
  if (context === undefined) {
    throw new Error('useConfiguration must be used within a ConfigurationProvider');
  }
  return context;
};

export const ConfigurationProvider = ({
  config,
  children,
}: {
  config: DashboardConfiguration['result'];
  children?: ReactNode | undefined;
}) => {
  return (
    <ConfigurationContext.Provider value={config}>
      {children}
    </ConfigurationContext.Provider>
  );
};
