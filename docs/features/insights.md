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

Deployment Frequency measures how often code is deployed to production. A higher deployment frequency indicates a more
agile and responsive development process.

:::tabs
== Dashboard
![Insights Overview](/dashboard/insights-deployment-frequency.png)

== CLI

```bash
smm pipelines deployment-frequency
```

:::
