---
outline: deep
---

# Jira provider

This provider is focused on fetching and analyzing data from Jira Cloud instances. It leverages the Jira REST API to gather information about issues, their change history, and comments. This enables comprehensive tracking of issue lifecycle, timeline analysis, and development flow metrics.

> [!IMPORTANT]
> Before following the steps below, make sure you have followed the [Getting Started](./getting-started.md) guide to set up
> the project and have Python, Poetry and Java installed.

You should expect to have the Jira integration up and running in a few minutes after following the steps below. The steps are organized as follows:

1. Generating the Jira API token
2. Configuring Jira connection
3. Fetching data from Jira
4. Analyzing and visualizing the data

## Generating the Jira API token

To interact with the Jira API and fetch the data needed for this project, you need to generate an API token. Follow these steps:

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token" button
3. Give your token a meaningful label (e.g., "software-metrics-machine")
4. Click "Create" and copy the generated token
5. Store it securely - you won't be able to see it again after leaving the page
6. Store it in the configuration file [smm_config.json](./getting-started.md#configuration-options) under the key `jira_token`

### Check token is working

To check if the token is working, you can set it as environment variables in your terminal session and then do a test request. Start by running the following commands:

```bash
export JIRA_URL="https://your-domain.atlassian.net"
export JIRA_TOKEN="your_api_token"
export JIRA_EMAIL="your-email@example.com"
```

Once the variables have been set, test your connection with Jira using the following command:

```bash
curl -u "$JIRA_EMAIL:$JIRA_TOKEN" "$JIRA_URL/rest/api/3/myself"
```

A JSON response should be returned with your user information, something similar to the following:

```json
{
  "self": "https://your-domain.atlassian.net/rest/api/3/user?accountId=123456",
  "accountId": "123456",
  "accountType": "atlassian",
  "name": "user",
  "email": "user@example.com",
  "avatarUrls": {
    "48x48": "https://...",
    "24x24": "https://...",
    "16x16": "https://...",
    "32x32": "https://..."
  },
  "displayName": "User Name",
  "active": true,
  ...other fields
}
```

That's it! You are ready to go and start fetching your data!

## Configuration

The Jira provider requires the following configuration parameters in your `smm_config.json` file:

```json
{
  "git_provider": "github",
  "github_token": "your_github_token",
  "github_repository": "owner/repo",
  "git_repository_location": "/path/to/repo",
  "store_data": "/path/to/data/storage",
  "jira_url": "https://your-domain.atlassian.net",
  "jira_token": "your_jira_api_token",
  "jira_project": "PROJ"
}
```

### Configuration parameters

- **`jira_url`**: The base URL of your Jira Cloud instance (e.g., `https://your-domain.atlassian.net`)
- **`jira_token`**: Your Jira API token generated from https://id.atlassian.com/manage-profile/security/api-tokens
- **`jira_project`**: The Jira project key you want to analyze (e.g., `PROJ`, `DEV`, `BUG`)

You can also set these as environment variables:
```bash
export SMM_JIRA_URL="https://your-domain.atlassian.net"
export SMM_JIRA_TOKEN="your_api_token"
export SMM_JIRA_PROJECT="PROJ"
```

## Fetching data

Fetching data from Jira is the first step to start analyzing metrics. The Jira provider supports three types of data fetching:

> [!NOTE]
> Fetching data may take a while depending on the number of issues in your project. By default, it fetches
> all issues in the configured project. To fine tune the fetching process, use the options available in the
> CLI commands below.

### Issues

Fetch issues from your Jira project with optional filtering:

```bash
smm jira fetch [OPTIONS]
```

#### Options

- `--months MONTHS`: Number of months back to fetch (default: 1)
- `--start-date DATE`: Start date in ISO 8601 format (YYYY-MM-DD)
- `--end-date DATE`: End date in ISO 8601 format (YYYY-MM-DD)
- `--issue-type TYPE`: Filter by issue type (e.g., Bug, Story, Task)
- `--status STATUS`: Filter by status (e.g., Open, In Progress, Done)
- `--raw-filters FILTERS`: Additional JQL (Jira Query Language) filters
- `--force`: Force re-fetching even if data is already cached

#### Examples

Fetch all issues from the last 3 months:
```bash
smm jira fetch --months 3
```

Fetch issues with a specific date range:
```bash
smm jira fetch --start-date 2024-01-01 --end-date 2024-03-31
```

Fetch only Bug issues:
```bash
smm jira fetch --issue-type Bug
```

Fetch issues in a specific status:
```bash
smm jira fetch --status "In Progress"
```

Fetch with custom JQL filters:
```bash
smm jira fetch --raw-filters 'assignee = currentUser()'
```

### Issue change history (changelog)

Fetch the change history for all issues:

```bash
smm jira fetch-changelog [OPTIONS]
```

#### Options

- `--force`: Force re-fetching changelog data

#### Example

```bash
smm jira fetch-changelog --force
```

### Issue comments

Fetch comments on all issues:

```bash
smm jira fetch-comments [OPTIONS]
```

#### Options

- `--force`: Force re-fetching comments

#### Example

```bash
smm jira fetch-comments
```

## Data Storage

The fetched Jira data is stored in the following structure:

```
<store_data>/
└── jira_<project_key>/
    ├── issues.json              # All fetched issues
    ├── issues_changelog.json    # Issue change history
    └── issues_comments.json     # Issue comments
```

For example, if your `store_data` is `/data/metrics` and project key is `PROJ`:

```
/data/metrics/
└── jira_PROJ/
    ├── issues.json
    ├── issues_changelog.json
    └── issues_comments.json
```

## Limitations

### API Rate Limiting

Jira Cloud has rate limits on API requests. The Jira provider implements intelligent caching to minimize unnecessary API calls:

- Downloaded data is cached locally
- Use the `--force` flag to re-download data
- Subsequent runs will skip already downloaded data

For more information about Jira API rate limits, see:
https://developer.atlassian.com/cloud/jira/platform/rate-limits/

### Project Access

Ensure that:
- Your API token has access to the configured project
- You have the necessary permissions in Jira to view issues, comments, and history
- The project key is correct and accessible

## Common Use Cases

### Analyzing Issue Resolution Time

Fetch issues and their changelog to calculate how long it takes to resolve issues:

```bash
smm jira fetch --months 6
smm jira fetch-changelog
```

### Tracking Issue Comments and Discussion

Get all comments on issues to analyze collaboration and discussion:

```bash
smm jira fetch
smm jira fetch-comments
```

### Filtering by Issue Type

If you want to focus on specific issue types:

```bash
smm jira fetch --issue-type "Story"
smm jira fetch --issue-type "Bug"
smm jira fetch --issue-type "Task"
```

### Continuous Integration with Git Data

Combine Jira data with GitHub/GitLab data for comprehensive metrics:

```bash
# Fetch both GitHub and Jira data
smm prs fetch
smm pipelines fetch
smm jira fetch
smm jira fetch-changelog
smm jira fetch-comments
```

## Troubleshooting

### Authentication Errors

If you receive authentication errors:

1. Verify your Jira URL is correct
2. Check that your API token is valid and not expired
3. Ensure your email address is correct (used for authentication)
4. Verify you have access to the specified project

### Connection Errors

If you cannot connect to Jira:

1. Check your internet connection
2. Verify the Jira URL is accessible
3. Check if your firewall/VPN allows connections to Jira
4. Verify the project key is correct

### No Data Returned

If no issues are returned:

1. Check that the project key is correct
2. Verify the date range includes issues in your project
3. Check issue type and status filters are correct
4. Try fetching without filters: `smm jira fetch`

## Next Steps

Once you have fetched data from Jira, you can:

1. Combine it with git and GitHub data for comprehensive analysis
2. Visualize trends and patterns using the dashboard
3. Export data for further analysis in other tools
4. Build custom reports using the CLI commands
