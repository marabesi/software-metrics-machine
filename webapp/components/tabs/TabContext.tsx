import React, { createContext, ReactElement, useContext } from 'react';
import Box from "@mui/material/Box";
import {Tab, Tabs} from "@mui/material";
import InsightsSection from "@/components/dashboard/InsightsSection";

interface TabsContextInterface {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabContext = createContext<TabsContextInterface | undefined>(undefined);

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useClipboardContext must be used within a ClipboardContextProvider');
  }
  return context;
};

export const TabProvider = ({ children }: { children?: ReactElement | undefined }) => {
  const [value, setValue] = React.useState('one');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    console.log(newValue);
  };

  return (
    <TabContext.Provider value={{
      activeTab: value,
      setActiveTab: setValue
    }}>
      <Box sx={{ width: '100%' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          textColor="secondary"
          indicatorColor="secondary"
          aria-label="secondary tabs example"
        >
          <Tab value="one" label="Insights" />
          <Tab value="two" label="Item Two" />
          <Tab value="three" label="Item Three" />
        </Tabs>
      </Box>
      <TabPanel value="one" active={value}>
        <InsightsSection />
      </TabPanel>
      {children}
    </TabContext.Provider>
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
      id={`full-width-tabpanel-${active}`}
      aria-labelledby={`full-width-tab-${active}`}
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