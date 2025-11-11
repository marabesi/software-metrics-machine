---
outline: deep
---

# Configuration

The configuration file `smm_config.json` supports the following options:

| Key                     |  Section      |  Description                                                            | Required | Default Value        |
|-------------------------| -------       | ------------------------------------------------------------------------|----------|----------------------|
| **PROVIDERS**           |               |                                                                         |          |                      |
| git_provider            |  Provider     |  The git provider to use (github, gitlab, etc)                          | Yes      | github               |
| [github_token](./github.md#generating-a-token)          |  Provider     |  The personal access token for GitHub   | Yes      |                      |
| **REPOSITORY**          |               |                                                                         |          |                      |
| github_repository       |  Repository   |  The GitHub repository in the format user/repo                          | Yes      |                      |
| git_repository_location |  Repository   |  The local path to the git repository (for codemaat)                    | Yes      |                      |
| **METRICS**             |               |                                                                         |          |                      |
| deployment_frequency_target_pipeline    |  Metrics     |  The personal access token for GitLab                    | No       |                      |
| deployment_frequency_target_job         |  Metrics     |  The personal access token for GitLab                    | No       |                      |
| main_branch             |  Metrics      |  The main branch repository, usually main by default                    | No       |                      |
| **DASHBOARD**           |               |                                                                         |          |                      |
| dashboard_start_date    |  Dashboard     |  Specifies the start date to start the dashboard                       | No       |                      |
| dashboard_end_date      |  Dashboard     |  Specifies the end date to start the dashboard                         | No       |                      |