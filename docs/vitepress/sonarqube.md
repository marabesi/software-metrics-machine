---
outline: deep
---

# SonarQube

This guide covers how to configure and use SonarQube with Software Metrics Machine (SMM).

## What is supported

SMM supports SonarQube in three interfaces:

- CLI via the `smm sonarqube` command group
- REST API under `/sonarqube/*`
- Dashboard tab: `SonarQube`

## Configuration

Set `SMM_STORE_DATA_AT` to the folder that contains your `smm_config.json` file.

```bash
export SMM_STORE_DATA_AT=/path/to/data
```

Example `smm_config.json`:

```json
{
  "git_provider": "github",
  "github_repository": "owner/repo",
  "git_repository_location": "/path/to/repository",
  "sonar_url": "https://sonarqube.example.com",
  "sonar_token": "your_sonar_token",
  "sonar_project": "project_key"
}
```

## CLI commands

### Fetch quality measures

```bash
smm sonarqube fetch-measures
```

Common options:

- `--metrics`: comma-separated metric keys
- `--output`: `text` or `json`

Example:

```bash
smm sonarqube fetch-measures --metrics coverage,complexity,sqale_rating --output json
```

### Fetch component tree

```bash
smm sonarqube fetch-component-tree
```

Common options:

- `--component`: component key (defaults to configured project)
- `--depth`: depth (`-1` for full traversal)
- `--metrics`: comma-separated metric keys
- `--output`: `text` or `json`

Example:

```bash
smm sonarqube fetch-component-tree --depth -1 --metrics complexity,cognitive_complexity,ncloc
```

### Fetch historical measures

```bash
smm sonarqube fetch-historical-measures
```

Common options:

- `--metrics`: comma-separated metric keys
- `--start-date`: `YYYY-MM-DD`
- `--end-date`: `YYYY-MM-DD`
- `--save`: save result JSON to a file
- `--output`: `text` or `json`

Example:

```bash
smm sonarqube fetch-historical-measures \
  --metrics sqale_rating,coverage,duplicated_lines_density \
  --start-date 2025-01-01 \
  --end-date 2025-12-31 \
  --save sonarqube-history.json \
  --output json
```

## REST API

Main endpoints:

- `GET /sonarqube/quality`
- `GET /sonarqube/component-tree`

See [REST API](./rest-api.md) for details.

## Dashboard usage

Open dashboard:

```bash
smm dashboard serve
```

Then open the `SonarQube` tab and use filters for:

- include patterns
- ignore patterns
- remove folders

### SonarQube dashboard filters

| Dashboard filter               | Backend query parameter |
|--------------------------------|-------------------------|
| `sonarqubeIgnorePatternFiles`  | `ignore_files`          |
| `sonarqubeIncludePatternFiles` | `include_files`         |
| `sonarqubeRemoveFolders`       | `remove_folders=true`   |

### Pattern filtering notes

For include and ignore patterns:

- Plain text values perform substring match.
- Glob-like patterns are supported (`*`, `**`, `?`).
- If the pattern has no `/`, matching is applied to file name (basename).
