'use client';

import { createContext, ReactElement, useContext, useMemo } from 'react';
import { UrlBuilder, createUrlBuilder } from '@/server/utils/urlBuilder';
import { DashboardGlobalConfiguration } from '@/server/api/configuration';

interface LinkBuilderContextInterface {
  urlBuilder: UrlBuilder;
  config: DashboardGlobalConfiguration;
}

const LinkBuilderContext = createContext<LinkBuilderContextInterface | undefined>(undefined);

export const useLinkBuilder = () => {
  const context = useContext(LinkBuilderContext);
  if (context === undefined) {
    throw new Error('useLinkBuilder must be used within a LinkBuilderProvider');
  }
  return context;
};

export const LinkBuilderProvider = ({
  config,
  children,
}: {
  config: DashboardGlobalConfiguration;
  children?: ReactElement | undefined;
}) => {
  const urlBuilder = useMemo(() => createUrlBuilder(config), [config]);
  const contextValue = useMemo(() => ({ urlBuilder, config }), [urlBuilder, config]);

  return (
    <LinkBuilderContext.Provider value={contextValue}>
      {children}
    </LinkBuilderContext.Provider>
  );
};
