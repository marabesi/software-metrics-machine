---
outline: deep
---

# Configuration

Configuration is stored in `smm_config.json` inside the folder referenced by `SMM_STORE_DATA_AT`.

## Required environment variable

```bash
export SMM_STORE_DATA_AT=/absolute/path/to/data-folder
```

## Example configuration

```json
{
  "git_provider": "github",
  "github_token": "your_github_token",
  "github_repository": "owner/repo",
  "git_repository_location": "/absolute/path/to/local/repository",
  "deployment_frequency_targets": [
    { "pipeline": ".github/workflows/ci.yml", "job": "deploy" }
  ],
  "main_branch": "main",
  "dashboard_start_date": "2025-01-01",
  "dashboard_end_date": "2025-12-31",
  "dashboard_color": "#1976d2",
  "log_level": "INFO",
  "jira_url": "https://your-domain.atlassian.net",
  "jira_email": "your-email@example.com",
  "jira_token": "your_jira_token",
  "jira_project": "PROJ",
  "sonar_url": "https://sonarqube.example.com",
  "sonar_token": "your_sonar_token",
  "sonar_project": "project_key"
}
```

## Key reference

| Key | Description | Required |
|-----|-------------|----------|
| `git_provider` | Git provider (for example `github`) | Yes |
| `github_token` | GitHub personal access token | Yes for GitHub PR/pipeline |
| `github_repository` | Repository in `owner/repo` format | Yes |
| `git_repository_location` | Local clone path for git/code metrics | Yes for source-code metrics |
| `deployment_frequency_targets` | Deployment frequency workflow/job targets as `{ "pipeline": "...", "job": "..." }` objects | No |
| `main_branch` | Main branch name | No |
| `dashboard_start_date` | Default start date in dashboard | No |
| `dashboard_end_date` | Default end date in dashboard | No |
| `dashboard_color` | Dashboard color theme value | No |
| `log_level` | Logging level (`DEBUG`, `INFO`, `WARN`, `ERROR`, `CRITICAL`) | No |
| `jira_url` | Jira base URL | No |
| `jira_email` | Jira account email | No |
| `jira_token` | Jira API token | No |
| `jira_project` | Jira project key | No |
| `sonar_url` | SonarQube server URL | No |
| `sonar_token` | SonarQube token | No |
| `sonar_project` | SonarQube project key | No |
