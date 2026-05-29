'use client';

import { createContext, ReactElement, useContext, useMemo } from 'react';
import { UrlBuilder, UrlBuilderConfig, createUrlBuilder } from '@/server/utils/urlBuilder';

interface LinkBuilderContextInterface {
  urlBuilder: UrlBuilder;
  config: UrlBuilderConfig;
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
  config: UrlBuilderConfig;
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
