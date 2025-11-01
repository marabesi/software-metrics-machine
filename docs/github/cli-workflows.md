# GitHub CLI Commands for Pipelines (Workflows)

## Fetch Workflows

```bash
../run-cli.sh pipelines fetch
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Start date     | Fetches workflows created after a date.   | `--start-date=2025-01-01`     |
| End date       | Fetches workflows created before a date.  | `--end-date=2025-12-31`     |
| Step           | Step defines the pace in which the data is fetched. It helps to mitigate the rate limits in the GitHub API | `--step-by=day` |

## Fetch Jobs

```bash
../run-cli.sh pipelines jobs-fetch
```

### Jobs Average Time Execution

```bash
../run-cli.sh pipelines jobs-by-execution-time
```

### Jobs by Status

```bash
../run-cli.sh pipelines jobs-by-status
```

### Jobs Summary

```bash
../run-cli.sh pipelines jobs-summary
```

### Pipeline by Status

```bash
../run-cli.sh pipelines pipeline-by-status
```

### Pipeline Deployment Frequency

```bash
../run-cli.sh pipelines deployment-frequency
```

### Pipeline Runs by Time

```bash
../run-cli.sh pipelines runs-by
```

### Pipeline Runs Duration

```bash
../run-cli.sh pipelines runs-duration
```

### Pipeline Summary

```bash
../run-cli.sh pipelines summary
```
