import React from 'react';
import { render, screen } from '@testing-library/react';
import PipelineRunsDurationCard from '@/components/charts/pipeline/PipelineRunsDurationCard';
import { LinkBuilderProvider } from '@/components/providers/LinkBuilderContext';
import { FiltersProvider } from '@/components/filters/FiltersContext';
import { defaultFilters } from '@/components/filters/DashboardFilters';
import { DashboardGlobalConfiguration } from '@/server/api/configuration';

const configuration: DashboardGlobalConfiguration = {
  git_provider: 'github',
  github_repository: 'acme/widgets',
  git_repository_location: '',
  store_data: false,
  deployment_frequency_targets: [],
  main_branch: 'main',
  dashboard_start_date: null,
  dashboard_end_date: null,
  dashboard_color: '',
  logging_level: 'info',
  jira_url: null,
  jira_email: null,
  jira_token: null,
  jira_project: null,
  sonar_url: null,
  sonar_project: null,
};

describe('PipelineRunsDurationCard', () => {
  it('keeps the workflow link and links the average duration to workflow metrics', () => {
    render(
      <FiltersProvider initialFilters={{ ...defaultFilters, startDate: '2026-01-01', endDate: '2026-01-31' }}>
        <LinkBuilderProvider config={configuration}>
          <PipelineRunsDurationCard
            dataByAggregation={{
              avg: [
                {
                  workflow: '.github/workflows/ci.yml',
                  avg_duration: 5,
                  min_duration: 3,
                  max_duration: 8,
                  total_runs: 10,
                },
              ],
              min: [],
              max: [],
            }}
            runsByDay={[]}
            jobsDurationByWorkflow={[]}
          />
        </LinkBuilderProvider>
      </FiltersProvider>
    );

    expect(screen.getByRole('link', { name: '.github/workflows/ci.yml' })).toHaveAttribute(
      'href',
      'https://github.com/acme/widgets/actions/workflows/.github/workflows/ci.yml'
    );
    expect(screen.getByRole('link', { name: '5 min' })).toHaveAttribute(
      'href',
      'https://github.com/acme/widgets/actions/metrics/performance?dateRangeType=DATE_RANGE_TYPE_CUSTOM&tab=jobs&filters=workflow_file_name%3A%22ci.yml%22&range=1767225600000-1769903999999'
    );
  });
});
