# GitHub CLI Commands for Pipelines

## Fetch Pipelines

```bash
./run-cli.sh pipelines fetch
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Start date     | Fetches pipeline runs created after a date.   | `--start-date=2025-01-01`     |
| End date       | Fetches pipeline runs created before a date.  | `--end-date=2025-12-31`     |
| Target branch  | The branch to filter workflow runs   | `--target-branch=main`   |
| Raw filters    | Filters to apply to the GitHub API request | `--raw-filters=event=push,actor=someuser` |
| Step           | Step defines the pace in which the data is fetched. It helps to mitigate the rate limits in the GitHub API | `--step-by=day` |

## Fetch Jobs

```bash
./run-cli.sh pipelines fetch_all_job_runs
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Start date     | Fetches jobs after a date.   | `--start-date=2025-01-01`     |
| End date       | Fetches jobs before a date.  | `--end-date=2025-12-31`     |
| Raw filters    | Filters to apply to the GitHub API request | `--raw-filters=status=completed` |

### Jobs Average Time Execution

```bash
./run-cli.sh pipelines jobs_by_execution_time
```

### Jobs by Status

```bash
./run-cli.sh pipelines jobs_by_status
```

### Jobs Summary

```bash
./run-cli.sh pipelines jobs_summary
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Max jobs       | Maximum number of jobs to list in the summary   | `--max-jobs=10`     |
| Start date     | Fetches jobs after a date.   | `--start-date=2025-01-01`     |
| End date       | Fetches jobs before a date.  | `--end-date=2025-12-31`     |

### Pipeline by Status

```bash
./run-cli.sh pipelines workflow_by_status
```

### Pipeline Deployment Frequency

```bash
./run-cli.sh pipelines deployment_frequency
```

### Pipeline Runs by Time

```bash
./run-cli.sh pipelines workflow_runs_by
```

### Pipeline Runs Duration

```bash
./run-cli.sh pipelines workflows_run_duration
```

### Pipeline Summary

```bash
./run-cli.sh pipelines summary
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Max workflows  | Maximum number of workflows to list in the summary   | `--max-workflows=10`     |
| Start date     | Fetches pipeline runs after a date.   | `--start-date=2025-01-01`     |
| End date       | Fetches pipeline runs before a date.  | `--end-date=2025-12-31`     |
| Output         | Output format (text or json)  | `--output=json`     |
