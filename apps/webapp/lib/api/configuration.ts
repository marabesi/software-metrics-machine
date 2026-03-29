import { fetchAPI } from './client';

export interface DashboardConfiguration {
  result: {
    git_provider: string;
    github_repository: string;
    git_repository_location: string;
    store_data: boolean;
    deployment_frequency_target_pipeline: string | null;
    deployment_frequency_target_job: string | null;
    main_branch: string;
    dashboard_start_date: string | null;
    dashboard_end_date: string | null;
    dashboard_color: string;
    logging_level: string;
    jira_url: string | null;
    jira_email: string | null;
    jira_token: string | null;
    jira_project: string | null;
  };
}

export const configurationAPI = {
  getConfiguration: () =>
    fetchAPI<DashboardConfiguration>('/configuration'),
};
