# GitHub CLI Commands for Pipelines (Workflows)

## Fetch Workflows

Date-only values passed to pipeline commands are interpreted with the selected project's configured `timezone` from
`smm_config.json`. If the project does not set `timezone`, SMM uses `SMM_TIMEZONE`, then `UTC`.

```bash
smm pipelines fetch
```

| Option         | Description                          | Example                   |
|----------------|--------------------------------------|---------------------------|
| Start date     | Fetches workflows created after a date.   | `--start-date=2025-01-01` |
| End date       | Fetches workflows created before a date.  | `--end-date=2025-12-31`   |
| Step           | Step defines the pace in which the data is fetched. It helps to mitigate the rate limits in the GitHub API | `--by-day`  |

Example with an explicit timezone from the environment:

```bash
SMM_TIMEZONE=Europe/Madrid smm pipelines fetch --start-date=2025-01-01 --end-date=2025-12-31
```

## Fetch Jobs

```bash
smm pipelines fetch-jobs
```
