import { createUrlBuilder } from '@/server/utils/urlBuilder';
import { DashboardGlobalConfiguration } from '@/server/api/configuration';

function createConfig(overrides: Partial<DashboardGlobalConfiguration> = {}): DashboardGlobalConfiguration {
  return {
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
    ...overrides,
  };
}

describe('createUrlBuilder', () => {
  it('builds a GitHub Actions job metrics link with workflow and job filters', () => {
    const builder = createUrlBuilder(createConfig());

    expect(builder.getJobRunsUrl('Build and Test', '.github/workflows/ci.yml')).toBe(
      'https://github.com/acme/widgets/actions/metrics/performance?tab=jobs&filters=workflow_file_name%3A%22ci.yml%22+job_name%3A%22Build%20and%20Test%22'
    );
  });

  it('builds a GitHub Actions job metrics link without a workflow filter', () => {
    const builder = createUrlBuilder(createConfig());

    expect(builder.getJobRunsUrl('deploy')).toBe(
      'https://github.com/acme/widgets/actions/metrics/performance?tab=jobs&filters=job_name%3A%22deploy%22'
    );
  });

  it('builds a GitHub Actions job metrics link with the dashboard date range', () => {
    const builder = createUrlBuilder(createConfig());

    expect(
      builder.getJobRunsUrl('deploy', '.github/workflows/release.yml', {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      })
    ).toBe(
      'https://github.com/acme/widgets/actions/metrics/performance?dateRangeType=DATE_RANGE_TYPE_CUSTOM&tab=jobs&filters=workflow_file_name%3A%22release.yml%22+job_name%3A%22deploy%22&range=1767225600000-1769903999999'
    );
  });

  it('builds a GitLab CI jobs link filtered by job search and ref', () => {
    const builder = createUrlBuilder(createConfig({ git_provider: 'gitlab' }));

    expect(
      builder.getJobRunsUrl('Build and Test', 'main', {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      })
    ).toBe(
      'https://gitlab.com/acme/widgets/-/jobs?scope%5B%5D=all&search=Build+and+Test&ref=main&created_after=2026-01-01T00%3A00%3A00Z&created_before=2026-01-31T23%3A59%3A59Z'
    );
  });
});
