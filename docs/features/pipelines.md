---
outline: deep
---

# Pipelines

The pipelines section is at the core of any CI/CD system. It provides a high-level overview of the pipelines that have
been executed, their statuses, and key metrics related to their performance at a glance. It focuses on first, a quick
statuses run for the pipelines, and second, on the time it takes to run them.

![Pipelines and statuses](/dashboard/pipelines/pipelines_run.png)

![Time it takes to run pipeline](/dashboard/pipelines/runs_in_minutes.png)

![Jobs averaged out by run duration](/dashboard/pipelines/jobs_duration.png)

## Jobs Average Time Execution

```bash
smm pipelines jobs-by-execution-time
```

## Jobs by Status

```bash
smm pipelines jobs-by-status
```

## Jobs Summary

```bash
smm pipelines jobs-summary
```

## Pipeline by Status

```bash
smm pipelines pipeline-by-status
```

## Pipeline Deployment Frequency

```bash
smm pipelines deployment-frequency
```

## Pipeline Runs by Time

```bash
smm pipelines runs-by
```

## Pipeline Runs Duration

```bash
smm pipelines runs-duration
```

## Pipeline Summary

```bash
smm pipelines summary
```
