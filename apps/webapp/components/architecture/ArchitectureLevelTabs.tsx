'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import { Tab, Tabs } from '@mui/material';

export type ArchitectureLevelTab = {
  level: 'context' | 'container' | 'component' | 'code';
  href: string;
  disabled: boolean;
};

type ArchitectureLevelTabsProps = {
  selectedLevel: 'context' | 'container' | 'component' | 'code';
  items: ArchitectureLevelTab[];
};

export default function ArchitectureLevelTabs({
  selectedLevel,
  items,
}: ArchitectureLevelTabsProps) {
  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Tabs
        value={selectedLevel}
        textColor="secondary"
        indicatorColor="secondary"
        aria-label="architecture level tabs"
      >
        {items.map((item) => (
          <Tab
            key={item.level}
            component={Link}
            href={item.href}
            value={item.level}
            label={item.level.toUpperCase()}
            disabled={item.disabled}
            scroll={false}
          />
        ))}
      </Tabs>
    </Box>
  );
}
