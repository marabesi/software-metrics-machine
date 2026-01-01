import React, { createContext, ReactElement, useContext } from 'react';

interface Filter {
  name: string,
  value: string,
}

interface FiltersContextInterface {
  filters: Filter[]
}

const TabContext = createContext<FiltersContextInterface | undefined>(undefined);

export const useFilterContext = () => {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterContextProvider');
  }
  return context;
};

export const FiltersProvider = ({ children }: { children?: ReactElement | undefined }) => {
  return (
    <TabContext.Provider value={{
      filters: []
    }}>
      {children}
    </TabContext.Provider>
  );
};
