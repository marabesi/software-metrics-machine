# GitHub CLI Commands for Pipelines (Workflows)

## Fetch Workflows

```bash
smm pipelines fetch
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Start date     | Fetches workflows created after a date.   | `--start-date=2025-01-01`     |
| End date       | Fetches workflows created before a date.  | `--end-date=2025-12-31`     |
| Step           | Step defines the pace in which the data is fetched. It helps to mitigate the rate limits in the GitHub API | `--step-by=day` |

## Fetch Jobs

```bash
smm pipelines jobs-fetch
```

