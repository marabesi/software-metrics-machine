#!/bin/bash

## FETCH GITHUB BASED DATA
./run-github.sh workflows/fetch_workflows.py \
  --target-branch="main" \
  --start-date="2025-05-01" \
  --end-date="2025-08-30"

./run-github.sh workflows/view_summary.py

./run-github.sh workflows/view_jobs_summary.py

workflow="Node CI"

# view pipelines
./run-github.sh workflows/view_workflow_by_status.py \
  --workflow-name="$workflow" \
  --out-file="dist/pipeline_by_status.png" \
&& \
./run-github.sh workflows/view_jobs_average_time_execution.py \
  --workflow-name="$workflow" \
  --exclude-jobs="setup" \
  --out-file="dist/pipeline_jobs_average_time_execution.png" \
&& \
./run-github.sh workflows/view_jobs_by_status.py \
  --workflow-name="$workflow" \
  --job-name="delivery" \
  --aggregate-by-week \
  --event="push" \
  --target-branch="main" \
  --with-pipeline="true" \
  --out-file="dist/pipeline_delivery.png" \
  && \
./run-github.sh workflows/view_workflow_runs_by.py \
  --include-defined-only="true" \
  --aggregate-by="week" \
  --out-file="dist/pipeline_run_by_week.png" 