# GitHub CLI Commands for Analysis

This document provides a guide for developers to run GitHub-related analyses using the CLI commands available in the `software-metrics-machine` project. Each command is categorized by its purpose and functionality.

## Pull Requests

### Fetch PRs

```bash
./run-cli.sh prs fetch
```

| Option         | Description                         | Example                  |
|----------------|-------------------------------------|--------------------------|
| Start date     | Fetches PRs created after a date.   | `--start-date=2025-01-01`|
| End date       | Fetches PRs created before a date.  | `--end-date=2025-12-31`  |

Filtering the data fetch from PRs by date is done logically while fetching the data, this is not a feature that GitHub
API provides.

### View Average Review Time by Author

```bash
./run-cli.sh prs view-average-review-time
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Labels         | Filters PRs by the labels attached to it.      | `--labels=my_label,anothe_label`       |
| Start date     | Fetches PRs created after a date.   | `--start-date=2025-01-01`     |
| End date       | Fetches PRs created before a date.  | `--end-date=2025-12-31`     |
| Limit          | If the list is too big --top will show only the top x results from the list.  | `--top=10`     |
| File           | The name of the file to store the generated chart  | `--out-file=my_chart.png` or   `--out-file=subfolder/my_chart.png`   |

### View PRs by Author

```bash
./run-cli.sh prs view-by-author
```

### View Summary

```bash
./run-cli.sh prs view-summary
```

### View Average of PRs Open by Time

```bash
./run-cli.sh prs view-average-open-time
```

## Workflows

### Fetch Workflows

```bash
./run-cli.sh workflows fetch
```

### Fetch Jobs

```bash
./run-cli.sh workflows fetch-jobs
```

### Jobs Average Time Execution

```bash
./run-cli.sh workflows jobs-average-time
```

### Jobs by Status

```bash
./run-cli.sh workflows jobs-by-status
```

### Jobs Summary

```bash
./run-cli.sh workflows jobs-summary
```

### Workflow by Status

```bash
./run-cli.sh workflows workflow-by-status
```

### Workflow Deployment Frequency

```bash
./run-cli.sh workflows deployment-frequency
```

### Workflow Runs by Time

```bash
./run-cli.sh workflows runs-by-time
```

### Workflow Runs Duration

```bash
./run-cli.sh workflows runs-duration
```

### Workflow Summary

```bash
./run-cli.sh workflows summary
```
