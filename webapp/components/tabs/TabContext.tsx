'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Box from "@mui/material/Box";
import {Tab, Tabs} from "@mui/material";
import InsightsSection from "@/components/dashboard/InsightsSection";
import PipelineSection from "@/components/dashboard/PipelineSection";
import PullRequestsSection from "@/components/dashboard/PullRequestsSection";
import SourceCodeSection from "@/components/dashboard/SourceCodeSection";

interface TabsContextInterface {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabContext = createContext<TabsContextInterface | undefined>(undefined);

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
};

export const TabProvider = ({ children }: { children?: React.ReactNode }) => {
  const [value, setValue] = React.useState('one');
  const [mounted, setMounted] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update tab from URL when searchParams change
  useEffect(() => {
    if (!mounted) return;
    const tabParam = searchParams.get('tab');
    if (tabParam && ['one', 'two', 'three', 'four'].includes(tabParam)) {
      setValue(tabParam);
    }
  }, [searchParams, mounted]);

  const setActiveTab = (tab: string) => {
    setValue(tab);
    // Update URL with new tab
    router.push(`?tab=${tab}`, { scroll: false });
  };

  return (
    <TabContext.Provider value={{
      activeTab: value,
      setActiveTab
    }}>
      {children}
    </TabContext.Provider>
  );
};

export const TabContent = () => {
  const { activeTab: value, setActiveTab } = useTabContext();

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <Box sx={{ width: '100%' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          textColor="secondary"
          indicatorColor="secondary"
          aria-label="dashboard tabs"
        >
          <Tab value="one" label="Insights" />
          <Tab value="two" label="Pipelines" />
          <Tab value="three" label="Pull Requests" />
          <Tab value="four" label="Source Code" />
        </Tabs>
      </Box>
      <TabPanel key="panel-insights" value="one" active={value}>
        <InsightsSection />
      </TabPanel>
      <TabPanel key="panel-pipelines" value="two" active={value}>
        <PipelineSection />
      </TabPanel>
      <TabPanel key="panel-prs" value="three" active={value}>
        <PullRequestsSection />
      </TabPanel>
      <TabPanel key="panel-source-code" value="four" active={value}>
        <SourceCodeSection />
      </TabPanel>
    </>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  active: string;
  value: string;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, active, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== active}
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      {...other}
    >
      {value === active && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}