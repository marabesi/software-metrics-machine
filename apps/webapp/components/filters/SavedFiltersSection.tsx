'use client';

import Link from 'next/link';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import MUILink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import { useFilters } from '@/components/filters/FiltersContext';
import { serializeDashboardFilters } from './DashboardFilters';
import {
  dashboardPathForSection,
  DashboardSection,
  SavedFilterEntry,
  SavedFiltersStore,
} from './saved-filters-store';

interface SavedFiltersSectionProps {
  activeSection: DashboardSection;
  pathname: string;
}

export default function SavedFiltersSection({
  activeSection,
  pathname,
}: SavedFiltersSectionProps) {
  const { filters } = useFilters();
  const savedFiltersStore = useMemo(() => new SavedFiltersStore(), []);
  const [savedFilterName, setSavedFilterName] = useState('');
  const [savedFilters, setSavedFilters] = useState<SavedFilterEntry[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadSavedFilters = async () => {
    const entries = await savedFiltersStore.getBySection(activeSection);
    setSavedFilters(entries);
  };

  const handleSaveFilter = async () => {
    setSaveError(null);

    try {
      await savedFiltersStore.save(activeSection, pathname, savedFilterName, filters);
      setSavedFilterName('');
      await loadSavedFilters();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to save filter.';
      setSaveError(errorMessage);
    }
  };

  const handleDeleteSavedFilter = async (entry: SavedFilterEntry) => {
    const shouldDelete = window.confirm(`Delete saved filter "${entry.name}"?`);
    if (!shouldDelete) {
      return;
    }

    await savedFiltersStore.remove(entry.id);
    await loadSavedFilters();
  };

  useEffect(() => {
    loadSavedFilters().catch((error) => {
      console.warn('Unable to load saved filters', error);
    });
  }, [activeSection]);

  return (
    <Stack direction="column" spacing={2}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Save Current Filter
        </Typography>
        <Stack direction="column" spacing={1}>
          <TextField
            label="Saved filter name"
            size="small"
            value={savedFilterName}
            onChange={(event) => setSavedFilterName(event.target.value)}
            placeholder="e.g. Team A - last 30 days"
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleSaveFilter}
            disabled={savedFilterName.trim().length === 0}
          >
            Save Filter
          </Button>
          {saveError && (
            <Typography variant="caption" color="error">
              {saveError}
            </Typography>
          )}
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Saved Filters
        </Typography>
        {savedFilters.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No saved filters for this section yet.
          </Typography>
        ) : (
          <Stack direction="column" spacing={1}>
            {savedFilters.map((entry) => {
              const queryString = serializeDashboardFilters(entry.filters).toString();
              const href = queryString
                ? `${dashboardPathForSection(entry.section)}?${queryString}`
                : dashboardPathForSection(entry.section);

              return (
                <Stack key={entry.id} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <MUILink component={Link} href={href} underline="hover">
                    {entry.name}
                  </MUILink>
                  <Button
                    variant="text"
                    size="small"
                    color="error"
                    onClick={() => {
                      handleDeleteSavedFilter(entry).catch((error) => {
                        console.warn('Unable to delete saved filter', error);
                      });
                    }}
                  >
                    Delete
                  </Button>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}