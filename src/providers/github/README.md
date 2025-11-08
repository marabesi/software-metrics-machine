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
export SMM_GITHUB_TOKEN=ghp_123123123
```

To persist those changes, use the bash profile or the zshrc, this way whenever you open a new terminal it will be already set.

### Check point

Once the variables have been set, test your connection with Github with the following command:

```bash
curl -H "Authorization: token $SMM_GITHUB_TOKEN" https://api.github.com/user
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

## Fetching data ⬇️

Fetching the data before operating it is the most first step to get started with metrics. This application provides
utilities to fetch data based on date time criteria as it is a standard to use it as a cut off for data analysis. Filters
are optional.

### Pull requests

```markdown
./run-github.sh prs/fetch_prs.py --months="4"
```

The above command will fetch all the pull requests from the last 4 months. This project comes with a summary to see what data was fetched.

```bash
./run-github.sh prs/view_summary.py
```

The output of the above command should be similar to the following:

```markdown
PRs summary:
  Total  PRs: 502
  Merged PRs: 285
  Closed (not merged) PRs: 116
  PRs without conclusion (open): 101
  Unique authors: 199
  Unique labels: 13
  Timespan between first and last PR: 5 months, 24 days, 5 hours, 47 minutes

First PR:
  Created at 13 Mar 2025, 15:44
  Merged  at 13 Mar 2025, 15:45
  Closed  at 13 Mar 2025, 15:45
  https://github.com/github/github-mcp-server/pull/7
  #7 ---  'Use full go version' --- by SamMorrowDrums

Last PR:
  Created at 06 Sep 2025, 22:32
  Not merged
  Closed  at 06 Sep 2025, 22:33
  https://github.com/github/github-mcp-server/pull/1059
  #1059 ---  'Update README.md' --- by isabelschoepsthiel

Labels used:
  dependencies: 32
```

Te summary accepts two parameters to filter the data fetched, `--start-date` and `--end-date`:

```bash
./run-github.sh prs/view_summary.py \
  --start-date="2025-08-01" \
  --end-date="2025-08-31"
```

### Pipeline

```bash
./run-github.sh workflows/fetch_workflows.py \
  --target-branch="main" \
  --start-date="2025-05-01" \
  --end-date="2025-08-30"
```

The above command will fetch all the workflow runs from the `main` branch, including the jobs executed, from May 1st, 2025 to August 30th, 2025.
There are limits that are applied by GitHub, please refer to the limitations section below. For further details on the parameters, please refer to the
[GitHub Api documentation](https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#list-workflow-runs-for-a-repository).

### Limitations

#### Requests

GitHub however, has a limit on requests that can be done to collect data, which impacts the accessibility and the data
analysis that Metrics Machine can do. For that end, the library has implemented a mechanism of pause and resume to start
off where the last downloaded data has been stored, to avoid missing the data needed.

<https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#primary-rate-limit-for-authenticated-users>

#### Workflow runs

There is a limitation of 1000 workflow runs that can be fetched from the GitHub API if using certain parameters, such as:
[actor, branch, check_suite_id, created, event, head_sha, status](https://github.com/orgs/community/discussions/41630#discussioncomment-10054510),
which can impact the data analysis that Metrics Machine can do. For that end, this project has implemented filters that
can be applied or not. By default none is used.

## Dataviz documentation

The docs described in this section are tailored to a hands-on approach, it is recommended to play around with the commands
and the different options to incorporate how its possibilities.

## Pull requests

Before diving into the different visualizations, let' go throug the assessment of the data fetched. It is a previous step
to understand the data and its quality. It will help to understand the data and its limitations and verify that the fetched
data fulfilled the parameters set during the fetching step.

```bash
./run-github.sh prs/view_summary.py
```

### Pull requests - Average open by month

```bash
./run-github.sh prs/view_average_of_prs_open_by.py \
   --author="dependabot" \
   --labels="dependencies" \
   --out-file="dist"
```

```markdown
usage: view_average_of_prs_open_by.py [-h] [--out-file OUT_FILE] [--author AUTHOR] [--labels LABELS]

Plot average PR open days by month

options:
  -h, --help            show this help message and exit
  --out-file, -o OUT_FILE
                        Optional path to save the plot image
  --author, -a AUTHOR   Optional username to filter PRs by author
  --labels, -l LABELS   Comma-separated list of label names to filter PRs by (e.g. bug,enhancement)
```

### Pull requests - open by authors

```markdown
./run-github.sh prs/view_prs_by_author.py --out-file=dist
```

```markdown
usage:
view_prs_by_author.py [-h] [--top TOP] [--labels LABELS] [--out-file OUT_FILE]

Plot number of PRs by author

options:
  -h, --help            show this help message and exit
  --top TOP             How many top authors to show
  --labels, -l LABELS   Comma-separated list of label names to filter PRs by (e.g. bug,enhancement)
  --out-file, -o OUT_FILE
                        Optional path to save the plot image
```

```bash
./run-github.sh prs/view_prs_by_author.py \
  --labels="dependencies"
  --top="10"
```

### Pull requests - average of open pull request

```bash
./run-github.sh prs/view_average_of_prs_open_by.py \
 --author="dependabot" \
 --labels="dependencies"
```

```markdown
usage: view_average_of_prs_open_by.py [-h] [--out-file OUT_FILE] [--author AUTHOR] [--labels LABELS]

Plot average PR open days by month

options:
  -h, --help            show this help message and exit
  --out-file, -o OUT_FILE
                        Optional path to save the plot image
  --author, -a AUTHOR   Optional username to filter PRs by author
  --labels, -l LABELS   Comma-separated list of label names to filter PRs by (e.g. bug,enhancement)
```

---

## Pipeline (Workflows and Jobs)

Before diving into the different visualizations, let' go throug the assessment of the data fetched. It is a previous step
to understand the data and its quality. It will help to understand the data and its limitations and verify that the fetched
data fulfilled the parameters set during the fetching step.

```bash
./run-github.sh workflows/view_summary.py
```

### Pipeline - Workflow runs by status

```markdown
./run-github.sh workflows/view_workflow_by_status.py \
  --workflow-name="Node CI"
```

```markdown
usage: view_workflow_by_status.py [-h] [--out-file OUT_FILE] [--workflow-name WORKFLOW_NAME]

Plot workflow status summary

options:
  -h, --help            show this help message and exit
  --out-file, -o OUT_FILE
                        Optional path to save the plot image
  --workflow-name, -w WORKFLOW_NAME
                        Optional workflow name (case-insensitive substring) to filter runs
```

### Pipeline - Jobs executed

```markdown
./run-github.sh workflows/view_jobs_by_status.py \
  --workflow-name="Node CI" \
  --job-name="delivery" \
  --aggregate-by-week \
  --event="push" \
  --target-branch="main" \
  --with-pipeline
```

```markdown
usage: view_jobs_by_status.py [-h] --job-name JOB_NAME [--workflow-name WORKFLOW_NAME] [--out-file OUT_FILE] [--with-pipeline] [--aggregate-by-week] [--event EVENT] [--target-branch TARGET_BRANCH]

Plot workflow/job status charts

options:
  -h, --help            show this help message and exit
  --job-name JOB_NAME   Job name to count/plot
  --workflow-name, -w WORKFLOW_NAME
                        Optional workflow name (case-insensitive substring) to filter runs and jobs
  --out-file, -o OUT_FILE
                        Optional path to save the plot image
  --with-pipeline       Show workflow summary alongside job chart
  --aggregate-by-week   Aggregate job executions by ISO week instead of day
  --event EVENT         Filter runs by event (comma-separated e.g. push,pull_request,schedule)
  --target-branch TARGET_BRANCH
                        Filter runs/jobs by target branch name (comma-separated)
```