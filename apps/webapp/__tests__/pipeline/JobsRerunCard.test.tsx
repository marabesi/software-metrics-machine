import React from 'react';
import { render, screen } from '@testing-library/react';
import JobsRerunCard from '@/components/charts/pipeline/JobsRerunCard';
import { LinkBuilderProvider } from '@/components/providers/LinkBuilderContext';
import { DashboardGlobalConfiguration } from '@/server/api/configuration';
import { FiltersProvider } from '@/components/filters/FiltersContext';
import { defaultFilters } from '@/components/filters/DashboardFilters';

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

describe('JobsRerunCard', () => {
  it('renders job names as external links to provider job metrics', () => {
    render(
      <FiltersProvider initialFilters={{ ...defaultFilters, startDate: '2026-01-01', endDate: '2026-01-31' }}>
        <LinkBuilderProvider config={configuration}>
          <JobsRerunCard
            data={[
              {
                workflow_name: '.github/workflows/ci.yml',
                job_name: 'Build and Test',
                total_runs: 12,
                avg_duration_minutes: 4,
                success_count: 10,
                failure_count: 2,
                success_rate: 83.3,
                failure_rate: 16.7,
                rerun_count: 3,
              },
            ]}
            dataByDay={[]}
          />
        </LinkBuilderProvider>
      </FiltersProvider>
    );

    const link = screen.getByRole('link', { name: 'Build and Test' });

    expect(link).toHaveAttribute(
      'href',
      'https://github.com/acme/widgets/actions/metrics/performance?dateRangeType=DATE_RANGE_TYPE_CUSTOM&tab=jobs&filters=workflow_file_name%3A%22ci.yml%22+job_name%3A%22Build%20and%20Test%22&range=1767225600000-1769903999999'
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
