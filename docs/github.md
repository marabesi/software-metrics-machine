---
outline: deep
---

# GitHub provider

This provider is focused on fetching and visualizing data from GitHub repositories, specifically pull requests and
workflows (pipelines). It leverages the GitHub REST API to gather the necessary information and provides a set of
tools to visualize and analyze the data.

> [!IMPORTANT]
> Before following the steps below, make sure you have followed the [Getting Started](./getting-started.md) guide to set up
> the project and have Python, Poetry and Java installed.

## Generating a token

To interact with the GitHub API and fetch the data needed for this project, you need to generate a personal access token.
Follow these steps:

1. Go to your GitHub account settings.
2. Navigate to "Developer settings" > "Personal access tokens" > "Tokens (classic)".
3. Click on "Generate new token" and select the necessary scopes:
   - `repo` (for accessing private repositories if needed)
   - `workflow` (for accessing GitHub Actions workflows)
   - `pull requests` (for accessing pull request data)
4. Generate the token and copy it. Make sure to store it securely, as you won't be able to see it again.
5. Store it in the configuration file [smm_config.json](./getting-started.md#configuration-options) under the key `github_token`.

## Basic configuration with env

This project currently uses env variables to define two key properties: the repository, the token and the repository.
This is required by the GitHub API to authenticate and authorize the requests to fetch the data. Before executing any
command, make sure to have them set as follows:

```bash
export SSM_GITHUB_TOKEN=ghp_123123123
```

To persist those changes, use the bash profile or the zshrc, this way whenever you open a new terminal it will be already set.

### Check point

Once the variables have been set, test your connection with Github with the following command:

```bash
curl -H "Authorization: token $SSM_GITHUB_TOKEN" https://api.github.com/user
```

A JSON response should be return with the user information, something similar to the following:

```json
{
  "login": "user",
  "id": 12312344,
  "node_id": "aaa2",
  "avatar_url": "https://avatars.githubusercontent.com/u/123123?v=4",
  "gravatar_id": ""
  ...other fields
}
```

That is it! You are ready to go and start fetching your data!

## Fetching data

Fetching the data before operating it is the most first step to get started with metrics. This application provides
utilities to fetch data based on date time criteria as it is a standard to use it as a cut off for data analysis. Filters
are optional.

### Pull requests

```bash
./run-cli.sh prs fetch
```

### Workflows (pipelines)

```bash
./run-cli.sh workflows fetch
```

## Visualizing data

This project provides commands to visualize the fetched data using various metrics. Visualization helps in understanding
trends, identifying bottlenecks, and making informed decisions based on the data. The two options to visualize data are:

1. CLI commands that generate charts and display them using matplotlib.
2. A dashboard (web application) that provides an interactive interface to explore the data.

### CLI commands

The CLI commands are designed to generate specific charts based on the fetched data. Each command corresponds to a
particular metric or analysis.

### Dashboard

The web application provides an interactive dashboard to explore the data visually. To start the dashboard, run the
following command:

```bash
./run-dashboard.sh
```
