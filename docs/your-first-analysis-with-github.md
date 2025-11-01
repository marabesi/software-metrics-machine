---
outline: deep
---

# Your first analysis with Github and Github Actions

This guide will walk you through the steps to perform your first analysis using Software Metrics Machine. By the end of
this guide, you will have fetched data from a GitHub repository and visualized key metrics to gain insights into your
software development process.

> [!NOTE]
> This guide assumes you have already set up the project by following the [Getting Started](./getting-started.md) guide.

## The project

For this first analysis, we will be using a sample GitHub repository that contains a variety of pull requests and
workflows. You can use your own repository if you prefer. We wil be using the [vuejs repositoy](https://github.com/vuejs/vue)
as it is a heavy active open source project so that you can see most of the features of the tool.

## Setting up the environment

The first step is to clone the repository locally if you haven't done so already.

```bash
git clone https://github.com/vuejs/vue
```

Once done, note the path where you cloned the repository, as you will need it.

> [!NOTE]
> Closning the repository is used to fetch git history data with [codemaat](codemaat.md) tool, if you only want to fetch
> data from GitHub API you can skip this step.

## SMM Configuration file

Now, you need to set up the configuration file to point to the repository you just cloned and provide the necessary
GitHub token. If you haven't generated a GitHub token yet, follow the steps in the [GitHub setup guide](./github.md).

Define where to store the data through the environment variable `SMM_STORE_DATA_AT`, for example:

```bash
export SMM_STORE_DATA_AT=/path/to/data/folder
```

Next in the same folder where you set the `SMM_STORE_DATA_AT` variable, create a file named `smm_config.json` with the
following content:

```json
{
  "git_provider": "github",
  "github_token": "your_github_token",
  "github_repository": "vuejs/vue",
  "git_repository_location": "/path/to/cloned/vue",
  "main_branch": "main"
}
```

> [!IMPORTANT]
> Use a different folder than the cloned repository to store the data, to avoid any accidental deletion of data changes.

Replace `your_github_token` with the token you generated, and `/path/to/cloned/vue` with the path where you cloned the
repository. Next, set the `main_branch` to the main branch of the repository, which is `main` for the Vue.js repository
at the time of writing. Next, we will fetch the data from GitHub.

## Fetching Data

To fetch data from the GitHub repository, we will use the CLI commands provided by Software Metrics Machine.

### Fetching source code codemaat

To fetch the git history data using codemaat, run the following command:

```bash
./run-cli.sh code fetch --start-date 2023-01-01 --end-date 2023-01-10
```

### Fetch Pull Requests

To fetch pull requests from the repository, run the following command:

```bash
./run-cli.sh prs fetch --start-date 2023-01-01 --end-date 2023-01-10
```

This command fetches pull requests created between January 1, 2025, and January 10, 2025. You can adjust the dates as
needed. If you want to fetch all pull requests, you can omit the date filters. However, be aware that fetching a large number of
pull requests may take a while and could hit GitHub API rate limits.

### Fetch pipelines (workflow runs)

To fetch workflow runs from the repository, run the following command:

```bash
./run-cli.sh pipelines fetch --start-date 2025-01-01 --end-date 2025-12-10
```

This command fetches pipelines created between January 1, 2025, and December 10, 2025. You can adjust the dates as
needed. If you want to fetch all runs, you can omit the date filters. However, be aware that fetching a large number of
pull requests may take a while and could hit GitHub API rate limits.

## Visualizing the data

Now that you have fetched the data, you can visualize it using the dashboard application provided by Software Metrics
Machine. To start the dashboard, run the following command:

```bash
./run-dashboard.sh
```

This will start a local server, and you can access the dashboard by navigating to `http://localhost:5006/dashboard` in your web
browser.
