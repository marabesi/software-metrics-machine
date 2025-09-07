#!/bin/bash

# fetch
./run-github.sh prs/fetch_prs.py --months="4"
# ./run-github.sh prs/fetch_prs.py --cutoff-date="2025-09-05" --force=true

# view summary
./run-github.sh prs/view_summary.py

# view prs
./run-github.sh prs/view_prs_by_author.py \
  --labels="dependencies" \
  --top="20" \
  --out-file="dist/pr_by_authors.png" \
  && \
./run-github.sh prs/view_average_review_time_by_author.py \
  --labels="dependencies" \
  --top="20" \
  --out-file="dist/pr_view_average_review_time_by_author.png" \
  && \
./run-github.sh prs/view_average_of_prs_open_by_month.py \
    --labels="" \
    --aggregate-by="month" \
    --out-file="plots/pr_average_open_prs_by_month.png" \
  && \
./run-github.sh prs/view_average_of_prs_open_by_month.py \
    --labels="" \
    --aggregate-by="week" \
    --out-file="plots/pr_average_open_prs_by_week.png"
