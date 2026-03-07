import React, { createContext, useContext } from 'react';
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

  return (
    <TabContext.Provider value={{
      activeTab: value,
      setActiveTab: setValue
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