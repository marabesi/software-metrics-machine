# GitHub CLI Commands for Pull Workflows

## Fetch Workflows

```bash
./run-cli.sh workflows fetch
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Start date     | Fetches PRs created after a date.   | `--start-date=2025-01-01`     |
| End date       | Fetches PRs created before a date.  | `--end-date=2025-12-31`     |
| Step           | Step defines the pace in which the data is fetched. It helps to mitigate the rate limits in the GitHub API | `--step-by=day` |

## Fetch Jobs

```bash
./run-cli.sh workflows jobs-fetch
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
