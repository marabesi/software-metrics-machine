---
outline: deep
---

# Insights

The insights section of the dashboard provides a comprehensive overview of key metrics and trends derived from your data.
It includes visualizations such as the time that it takes to land code in production and meta data derived from your
data.

For example, you can track metrics like Deployment Frequency, Lead Time for Changes, Change Failure Rate, and Mean Time to
Recovery (MTTR). These insights help you understand the efficiency and effectiveness of your development and deployment
processes. Those come from your pipelines. However, pairing index comes from your git history, from the source code.

## Deployment Frequency

<!--@include: ../parts/supported-by-all.md{,2}-->

Deployment Frequency measures how often code is deployed to production. A higher deployment frequency indicates a more
agile and responsive development process.

The deployment frequency is calculated by dividing the number of deployments by the number of deployments in a given
time period. To track the deployment frequency, Smm requires a pipeline that deploys to production.

:::tabs key:cli
== Dashboard

This is configured
in the [configuration file](./configuration.md). You need to specify the pipeline and the job that deploys
to production.

![Insights Deployment Frequency](/dashboard/insights-deployment-frequency.png)

== CLI

```bash
smm pipelines deployment-frequency
```

For CLI execution, you need to specify the pipeline and the job that deploys to production.

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Start date     | Uses pipeline starting from this date.    | `--start-date=2025-01-01`     |
| End date       | Uses pipeline starting until this date.   | `--end-date=2025-12-31`     |
| Pipeline       | Pipeline to use                           | `--workflow-path=.github/workflows/ci.yml`       |
| Job            | The job that deploys to production        | `--job-name=deploy_production`       |

:::

## Pairing index

<!--@include: ../parts/supported-by-all.md-->

The Pairing Index provides insights into collaboration within your development team by analyzing how often developers
work together on code changes. A higher pairing index suggests a more collaborative environment, which can lead to
improved code quality and knowledge sharing.

:::tabs key:cli
== Dashboard

![Insights Pairing Index](/dashboard/insights-pairing-index.png)

== CLI

```bash
smm code pairing-index
```

| Option         | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| Start date     | Fetches PRs created after a date.    | `--start-date=2025-01-01`     |
| End date       | Fetches PRs created before a date.   | `--end-date=2025-12-31`     |
| Authors        | The comma separated authors to include in the index. It must be the email used in the commit. | `--authors=me@me.com`       |

### Examples - Pairing Index

```bash
smm code pairing-index \
  --start-date="2025-08-01" \
  --end-date="2025-08-10" \
  --authors=me@me.com,another@another.com
```

:::

