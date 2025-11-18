---
outline: deep
---

# Pipelines

<!--@include: ../parts/supported-by-all.md{,2}-->

The pipelines section is at the core of any CI/CD system. It provides a high-level overview of the pipelines that have
been executed, their statuses, and key metrics related to their performance at a glance. It focuses on first, a quick
statuses run for the pipelines, and second, on the time it takes to run them.




## Pipeline by Status

:::tabs key:cli
== Dashboard

![Pipelines and statuses](/dashboard/pipelines/pipelines_run.png)

== CLI

```bash
smm pipelines pipeline-by-status
```

| Option         | Description                          | Example <div style="width:200px"></div> |
|----------------|--------------------------------------|--------------------------|
| Start date     | Filter by created after this date.   | `--start-date=2025-01-01`     |
| End date       | Filter by created before this date.  | `--end-date=2025-12-31`     |
| Workflow path | Filter by the workflow file path      | `--workflow-path=".github/workflows/ci.yml"`     |


:::






## Pipeline Runs by Time

```bash
smm pipelines runs-by
```

## Pipeline Runs Duration

:::tabs key:cli
== Dashboard

![Time it takes to run pipeline](/dashboard/pipelines/runs_in_minutes.png)

== CLI

```bash
smm pipelines runs-duration
```

| Option         | Description                          | Example <div style="width:200px"></div> |
|----------------|--------------------------------------|--------------------------|
| Start date     | Filter by created after this date.    | `--start-date=2025-01-01`     |
| End date       | Filter by created before this date.   | `--end-date=2025-12-31`     |
| Metric         | The type of metric to compute for each execution (avg, sum, count)   | `--metric=sum`     |
| Aggregate      | Aggregate the data by day, plotting each day computing the desired metric   | `--aggregate-by-day=true`     |
| Workflow path | Filter by the workflow file path   | `--workflow-path=".github/workflows/ci.yml"`     |

### Examples - Runs duration

Computes the average time of each pipeline run between August 17, 2025, and November 17, 2025 and aggregates the data
by day, returning the average duration of all runs executed each day:

```bash
smm pipelines runs-duration \
  --start-date 2025-08-17 \
  --end-date 2025-11-17 \
  --workflow-path=".github/workflows/ci.yml" \
  --aggregate-by-day=true
```

:::

## Pipeline Summary

```bash
smm pipelines summary
```





## Jobs Average Time Execution

Jobs are the building blocks of any pipeline. They represent individual tasks or steps that need to be executed as
part of the overall pipeline process. This command associates the jobs wih their corresponding pipeline execution.

:::tabs key:cli
== Dashboard

![Jobs averaged out by run duration](/dashboard/pipelines/jobs_duration.png)

== CLI

```bash
smm pipelines jobs-by-execution-time
```

| Option         | Description                          | Example <div style="width:200px"></div> |
|----------------|--------------------------------------|--------------------------|
| Start date     | Filter by created after this date.   | `--start-date=2025-01-01`     |
| End date       | Filter by created before this date.  | `--end-date=2025-12-31`     |
| Limit          |                                      | `--top=2`     |
| Filtering      | Include setup jobs used by GitHub actions,such as 'Set up job' or 'Checkout code'  | `--force-all-job` |
| Filtering      | Filters jobs based on their pipeline  | `--pipeline-raw-filters=target_branch=main` |
| Job name       | Optional job name substring to filter jobs | `--job-name=test` |


:::




## Jobs by Status

```bash
smm pipelines jobs-by-status
```

## Jobs Summary

```bash
smm pipelines jobs-summary
```



