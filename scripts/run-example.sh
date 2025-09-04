#!/bin/bash

# fetch
./run-github.sh prs/fetch_prs.py --months="4"
./run-github.sh workflows/fetch_workflows.py \
	--target-branch="main" \
	--with-jobs="true" \
	--start-date="2025-05-01" \
	--end-date="2025-08-30" \
  && \

# view
./run-github.sh prs/view_prs_by_author.py \
  --labels="dependencies" \
  --top="20" \
	--out-file="dist/prs_by_authors.png" \
  && \
./run-github.sh prs/view_average_review_time_by_author.py \
  --labels="dependencies" \
  --top="20" \
	--out-file="dist/view_average_review_time_by_author.png" \
  && \
./run-github.sh prs/view_average_of_prs_open_by_month.py \
	  --labels="dependencies" \
	  --out-file="dist" \
	  --out-file="dist/average_open_prs.png" \
&& \
./run-github.sh workflows/view_workflow_by_status.py \
  --workflow-name="Node CI" \
  --out-file="dist/pipeline_by_status.png" \
&& \
./run-github.sh workflows/view_jobs_by_status.py \
  --workflow-name="Node CI" \
  --job-name="delivery" \
  --aggregate-by-week \
  --event="push" \
  --target-branch="main" \
  --with-pipeline="true" \
  --out-file="dist/delivery.png"
