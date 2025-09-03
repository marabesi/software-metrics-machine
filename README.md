# Software Metrics Machine

## A Data-Driven Approach to High-Performing Teams

Agile software development has become a dominant practice, but many teams struggle to consistently deliver high-value
software. While story points and code maintainability metrics (like SonarQube) provide a starting point, they often
miss crucial factors like team dynamics, waiting times, code churn, and the impact of knowledge silos. Metrics Machine
is designed to fillin these gaps by providing a comprehensive set of metrics that reflect the health of your development
process.

## Why Metrics Machine?

We believe that the success of an Agile team is directly tied to the speed and quality with which value is delivered to
production. Software Metrics Machine provides insights beyond traditional metrics.

## Philosophy Drivers

* **Continuous Feedback Loops:**  A constant cycle of observation, analysis, and adjustment is essential.
* **Pipeline Health:**  Maintain a consistently green and stable development pipeline.
* **Controlled Code Churn:** Minimize unnecessary code changes, as they often indicate underlying issues.
* **Knowledge Sharing:** Actively avoid knowledge silos – encourage collaboration and knowledge transfer.
* **Data-Based Technical Debt:** Define and prioritize technical debt based on *real* data and impact.

## Facets

This project relies on metrics that are extracted from:

- Pipeline
  - Success rate of pipeline ✅
  - Average time to complete pipeline from start to finish 🚧
- Pull requests
  - Average of Pull requests opened ✅
- Git history
  * Code churn  ✅
  * Hotspots  ✅
  * Change Frequency 🚧
  * Complexity Trends Over Time 🚧

## Getting started

This section provides the needed configuration to get started with Metrics machine, it requires knowledge of env variables and python ecosystem tools.

### Environment requirements

- python 3.10+
- poetry installed

If you are on a mac, you can easily install them using the following commands:

```bash
brew install python
brew install poetry
```

### Checkpoint

Once installed python and poetry, run the following command:

```bash
poetry run python --version
```

You should see an output something like the following:

```plaintext
Python 3.11.0
```

## Github connector

### Basic configuration with env

This project currently uses env variables to define two key properties: the repository, the token and the repository. Before executing any command, make sure to have them set:

```bash
export REPO=user/repo
export GITHUB_TOKEN=ghp_123123123
```

To persist those changes, use the bash profile or the zshrc, this way whenever you open a new terminal it will be already set.

### Check point

Once the variables have been set, test your connection with Github with the following command:

```bash
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
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

### Fetching data ⬇️

Fetching the data before operating it is the most first step to get started with metrics. This application provides utilities to fetch data based on date time criteria as it is a standard to use it as a cut off for data analysis. Filters are optional.

Pull requests

```markdown
./run-github.sh prs/fetch_prs.py --months="4"
```

Pipeline

```markdown
./run-github.sh workflows/fetch_workflows.py \
 --target-branch="main" \
 --with-jobs="true" \
 --start-date="2025-05-01" \
 --end-date="2025-08-30"
```

### Limitations

GitHub however, has a limit on requests that can be done to collect data, which impacts the accessibility and the data analysis that Metrics Machine can do. For that end, the library has implemented a mechanism of pause and resume to start off where the last downloaded data has been stored, to avoid missing the data needed.

<https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#primary-rate-limit-for-authenticated-users>

# Dataviz documentation

The docs described in this section are tailored to a hands-on approach, it is recommended to play around with the commands and the different options to incorporate how its possibilities.

## Pull requests

### Pull requests - Average open by month

```bash
./run-github.sh prs/view_average_of_prs_open_by_month.py \
   --author="dependabot" \
   --labels="dependencies" \
   --out-file="dist"
```

```markdown
usage: view_average_of_prs_open_by_month.py [-h] [--out-file OUT_FILE] [--author AUTHOR] [--labels LABELS]

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
./run-github.sh prs/view_average_of_prs_open_by_month.py \
 --author="dependabot" \
 --labels="dependencies"
```

```markdown
usage: view_average_of_prs_open_by_month.py [-h] [--out-file OUT_FILE] [--author AUTHOR] [--labels LABELS]

Plot average PR open days by month

options:
  -h, --help            show this help message and exit
  --out-file, -o OUT_FILE
                        Optional path to save the plot image
  --author, -a AUTHOR   Optional username to filter PRs by author
  --labels, -l LABELS   Comma-separated list of label names to filter PRs by (e.g. bug,enhancement)
```

---

## Pipeline

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

## References

- Metrics
  - <https://github.com/adamtornhill/code-maat>
  - <https://pragprog.com/titles/atevol/software-design-x-rays/>
- Platform
  - <https://python-poetry.org/>
  - <https://matplotlib.org/>
  - <https://git-scm.com/doc>
  - <https://docs.github.com/en/rest?apiVersion=2022-11-28>

