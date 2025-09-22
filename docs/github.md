---
outline: deep
---

# GitHub provider

This provider is focused on fetching and visualizing data from GitHub repositories, specifically pull requests and
workflows (pipelines). It leverages the GitHub REST API to gather the necessary information and provides a set of
tools to visualize and analyze the data.

## Basic configuration with env

This project currently uses env variables to define two key properties: the repository, the token and the repository.
This is required by the GitHub API to authenticate and authorize the requests to fetch the data. Before executing any
command, make sure to have them set as follows:

```bash
export SSM_GITHUB_REPOSITORY=user/repo
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

```