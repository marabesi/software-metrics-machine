'use client';

import { Box, Paper, Typography, Divider, Button, Stack } from "@mui/material";
import { useFilters } from "@/components/filters/FiltersContext";
import { useTabContext } from "@/components/tabs/TabContext";
import DateRangePicker from "@/components/filters/DateRangePicker";
import SelectFilter from "@/components/filters/SelectFilter";
import MultiSelectFilter from "@/components/filters/MultiSelectFilter";
import TextInputFilter from "@/components/filters/TextInputFilter";
import SliderFilter from "@/components/filters/SliderFilter";
import { useEffect, useState } from "react";
import { pipelineAPI, pullRequestAPI } from "@/lib/api";

export default function FiltersContainer() {
  const { filters, updateFilter, resetFilters } = useFilters();
  const { activeTab } = useTabContext();
  const [workflowOptions, setWorkflowOptions] = useState<string[]>(['All']);
  const [jobOptions, setJobOptions] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [conclusionOptions, setConclusionOptions] = useState<string[]>([]);
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [eventOptions, setEventOptions] = useState<string[]>([]);
  const [authorOptions, setAuthorOptions] = useState<string[]>([]);
  const [labelOptions, setLabelOptions] = useState<string[]>([]);

  // Fetch filter options from API on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Try to fetch filter options, but provide defaults if endpoints don't exist yet
        const workflows = await pipelineAPI.getWorkflows().catch(() => []);
        setWorkflowOptions(['All', ...workflows.map((w: any) => w.name || w.path).filter(Boolean)]);

        const statuses = await pipelineAPI.getStatuses().catch(() => []);
        setStatusOptions(statuses.length > 0 ? statuses : ['completed', 'in_progress', 'queued']);

        const conclusions = await pipelineAPI.getConclusions().catch(() => []);
        setConclusionOptions(conclusions.length > 0 ? conclusions : ['success', 'failure', 'cancelled', 'timed_out']);

        const branches = await pipelineAPI.getBranches().catch(() => []);
        setBranchOptions(branches);

        const events = await pipelineAPI.getEvents().catch(() => []);
        setEventOptions(events.length > 0 ? events : ['push', 'pull_request', 'schedule', 'manual']);

        const authors = await pullRequestAPI.getAuthors().catch(() => []);
        setAuthorOptions(authors);

        const labels = await pullRequestAPI.getLabels().catch(() => []);
        setLabelOptions(labels);

        const jobs = await pipelineAPI.getJobs().catch(() => []);
        setJobOptions(jobs.map((j: any) => j.name).filter(Boolean));
      } catch (error) {
        console.warn('Some filter options could not be loaded:', error);
        // All fallbacks are already set in individual catch blocks
      }
    };

    fetchFilterOptions();
  }, []);

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Filters
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* Date Range - Always Show */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Date Range
        </Typography>
        <DateRangePicker />
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Insights Tab (one) - Date Range Only */}
      {activeTab === 'one' && (
        <Box sx={{ mb: 3 }} />
      )}

      {/* Pipelines Tab (two) - Pipeline Filters */}
      {activeTab === 'two' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Pipeline Filters
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} flexWrap="wrap">
            <SelectFilter
              label="Workflow"
              value={filters.workflowSelector}
              options={workflowOptions}
              onChange={(value) => updateFilter('workflowSelector', value)}
            />
            <MultiSelectFilter
              label="Status"
              values={filters.workflowStatus}
              options={statusOptions}
              onChange={(values) => updateFilter('workflowStatus', values)}
            />
            <MultiSelectFilter
              label="Conclusion"
              values={filters.workflowConclusions}
              options={conclusionOptions}
              onChange={(values) => updateFilter('workflowConclusions', values)}
            />
            <MultiSelectFilter
              label="Jobs"
              values={filters.jobSelector}
              options={jobOptions}
              onChange={(values) => updateFilter('jobSelector', values)}
            />
            <MultiSelectFilter
              label="Branch"
              values={filters.branch}
              options={branchOptions}
              onChange={(values) => updateFilter('branch', values)}
            />
            <MultiSelectFilter
              label="Event"
              values={filters.event}
              options={eventOptions}
              onChange={(values) => updateFilter('event', values)}
            />
          </Stack>
        </Box>
      )}

      {/* Pull Request Tab (three) - Pull Request Filters */}
      {activeTab === 'three' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Pull Request Filters
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} flexWrap="wrap">
            <MultiSelectFilter
              label="Authors"
              values={filters.authorSelect}
              options={authorOptions}
              onChange={(values) => updateFilter('authorSelect', values)}
            />
            <MultiSelectFilter
              label="Labels"
              values={filters.labelSelector}
              options={labelOptions}
              onChange={(values) => updateFilter('labelSelector', values)}
            />
            <SelectFilter
              label="Aggregate By"
              value={filters.aggregateBy}
              options={['week', 'month']}
              onChange={(value) => updateFilter('aggregateBy', value)}
            />
          </Stack>
        </Box>
      )}

      {/* Source Code Tab (four) - Source Code Filters */}
      {activeTab === 'four' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Source Code Filters
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} flexWrap="wrap" alignItems="flex-start">
            <TextInputFilter
              label="Ignore Pattern Files"
              value={filters.ignorePatternFiles}
              onChange={(value) => updateFilter('ignorePatternFiles', value)}
              placeholder="e.g., *.test.ts, node_modules/*"
            />
            <TextInputFilter
              label="Include Pattern Files"
              value={filters.includePatternFiles}
              onChange={(value) => updateFilter('includePatternFiles', value)}
              placeholder="e.g., *.ts, src/**"
            />
            <MultiSelectFilter
              label="Authors (Source Code)"
              values={filters.authorSelectSourceCode}
              options={authorOptions}
              onChange={(values) => updateFilter('authorSelectSourceCode', values)}
            />
            <SelectFilter
              label="Type Churn"
              value={filters.typeChurn}
              options={['added', 'deleted']}
              onChange={(value) => updateFilter('typeChurn', value)}
            />
            <SliderFilter
              label="Top Entries"
              value={filters.topEntries}
              onChange={(value) => updateFilter('topEntries', value)}
              min={1}
              max={100}
              step={5}
            />
          </Stack>
        </Box>
      )}

      {/* Action Buttons */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={resetFilters}
        >
          Reset Filters
        </Button>
      </Box>
    </Paper>
  );
}
