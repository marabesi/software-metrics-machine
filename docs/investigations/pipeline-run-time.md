---
outline: deep
---

# Pipeline run time analysis

In this investigation, we analyze the run time of CI/CD pipelines to identify trends and potential bottlenecks in the development process. Understanding pipeline run times can help teams optimize their workflows and improve overall efficiency.

## Target project

The project used is [json-tool](https://github.com/marabesi/json-tool) as it is an open source project with a moderate
level of activity, making it suitable for this analysis.

## Data Collection

We collected data on pipeline run times from our GitHub repository using the Metrics Machine tool. The data includes timestamps for when each pipeline started and finished, allowing us to calculate the total run time for each pipeline execution.

```bash
smm pipelines fetch --start-date 2025-08-17 --end-date 2025-11-17 --raw-filters=branch=main
```

We use the branch filter to focus on the main development line, ensuring that our analysis reflects the most relevant
pipeline executions. Executions from branches other than `main` are subject to a full analysis in future investigations.
Note that, this constraint is applied to all data available for this investigation. If the desired to see executions that are not
on the main branch, remove the branch filter and re-fetch the data.

## Analysis

Using the collected data, we calculated the run time for each pipeline by subtracting the start time from the finish time
and calculating the duration average in minutes. The pipeline used is the one named ci.yml, as it is the main pipeline
executed when changes are pushed to the main line. The following CLI command was used to perform this analysis:

```bash
smm pipelines runs-duration --start-date 2025-08-17 --end-date 2025-11-17 --workflow-path=".github/workflows/ci.yml"
```

## Findings

