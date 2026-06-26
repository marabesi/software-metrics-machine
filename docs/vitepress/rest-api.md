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
- `GET /pull-requests/comments-by-author`
- `GET /pull-requests/first-comment-time`
- `GET /pull-requests/filter-options`

Common query params:

- `start_date`, `end_date`
- `timezone`
- `authors`, `exclude_authors`, `exclude_commenters`, `labels`
- `status`
- `aggregate_by`

## Pipelines

- `GET /pipelines/summary`
- `GET /pipelines/by-status`
- `GET /pipelines/jobs-by-status`
- `GET /pipelines/runs-duration`
- `GET /pipelines/jobs-duration-by-workflow`
- `GET /pipelines/deployment-frequency`
- `GET /pipelines/runs-by`
- `GET /pipelines/jobs-average-time`
- `GET /pipelines/jobs-average-time-by-day`
- `GET /pipelines/jobs-reruns-by-day`
- `GET /pipelines/jobs-steps-average-time`
- `GET /pipelines/jobs-steps-average-time-by-day`
- `GET /pipelines/filter-options`
- `GET /pipelines/jobs`

Common query params:

- `start_date`, `end_date`
- `timezone`
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
- `GET /code/big-o`
- `GET /code/big-o/file`

Common query params:

- `start_date`, `end_date`
- `timezone`
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
- `GET /sonarqube/measurements`
- `GET /sonarqube/measurements/history`
- `GET /sonarqube/component-tree/history`

Common query params:

- `measures`
- `component`, `depth`, `metrics`
- `ignore_files`, `include_files`, `remove_folders`

## Configuration

- `GET /configuration`

Returns active runtime configuration values used by dashboard and API integrations.
