---
outline: deep
---

# REST API

This page documents the active REST API surface in SMM.

> Note: Swagger UI is the authoritative source for the full schema and examples.
> Default path: `http://localhost:<port>/api/docs`.

## Start API

From the workspace root:

```bash
smm dashboard serve
```

Default port is `3000` unless `PORT` is set.

## Pull Requests

- `GET /pull-requests/summary`
- `GET /pull-requests/through-time`
- `GET /pull-requests/by-author`
- `GET /pull-requests/average-review-time`
- `GET /pull-requests/average-open-by`
- `GET /pull-requests/average-comments`
- `GET /pull-requests/authors`
- `GET /pull-requests/labels`

Common query params:

- `start_date`, `end_date`
- `authors`, `labels`
- `status`

## Pipelines

- `GET /pipelines/summary`
- `GET /pipelines/by-status`
- `GET /pipelines/jobs-by-status`
- `GET /pipelines/runs-duration`
- `GET /pipelines/jobs-duration-by-workflow`
- `GET /pipelines/deployment-frequency`
- `GET /pipelines/runs-by`
- `GET /pipelines/jobs-average-time`
- `GET /pipelines/workflows`
- `GET /pipelines/jobs`
- `GET /pipelines/statuses`
- `GET /pipelines/conclusions`
- `GET /pipelines/branches`
- `GET /pipelines/events`

Common query params:

- `start_date`, `end_date`
- `workflow_path`
- `status`, `conclusion`
- `job_name`, `branch`, `event`
- `aggregate_by`, `top`

## Source Code

- `GET /code/pairing-index`
- `GET /code/code-churn`
- `GET /code/coupling`
- `GET /code/entity-churn`
- `GET /code/entity-effort`
- `GET /code/entity-ownership`
- `GET /code/authors`

Common query params:

- `start_date`, `end_date`
- `authors`
- `ignore_files`, `include_only`
- `top`
- `type_churn`

## Jira

- `GET /jira/issues`

Common query params:

- `status`
- `startDate`, `endDate`

## SonarQube

- `GET /sonarqube/quality`
- `GET /sonarqube/component-tree`

Common query params:

- `measures`
- `component`, `depth`, `metrics`
- `ignore_files`, `include_files`, `remove_folders`

## Configuration

- `GET /configuration`

Returns active runtime configuration values used by dashboard and API integrations.
