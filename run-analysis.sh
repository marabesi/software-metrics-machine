#!/bin/bash

GITHUB_TOKEN=$1

# project="ollama"
# github_repo="ollama/ollama"

# project="vitepress"
# github_repo="vuejs/vitepress"

#project="smelly-test"
#github_repo="marabesi/smelly-test"

project="marabesi"
github_repo="marabesi/json-tool"

repo_url="https://github.com/$github_repo.git"

base_dir="$(pwd)"
clone_dir="$base_dir/downloads/$project"
analysis_dir="$base_dir/downloads/analysis"

export SMM_STORE_DATA_AT="$analysis_dir"

echo $analysis_dir

start_date="2025-08-17"
end_date="2025-08-20"

./run-cli.sh pipelines pipeline-by-status --start-date "$start_date" \
  --end-date "$end_date" \
  --workflow-path=".github/workflows/ci.yml"


./run-cli.sh pipelines runs-duration --start-date "$start_date" \
  --end-date "$end_date" \
  --workflow-path=".github/workflows/ci.yml" \
  --metric="avg" \
  --aggregate-by-day=true

./run-cli.sh pipelines jobs-by-execution-time \
  --start-date $start_date \
  --end-date $end_date \
  --workflow-path=".github/workflows/ci.yml"


# current="$start_date"

# start_ts=$(date -j -f "%Y-%m-%d" "$start_date" "+%s")
# end_ts=$(date -j -f "%Y-%m-%d" "$end_date" "+%s")

# current_ts=$start_ts
# while [ "$current_ts" -le "$end_ts" ]; do
#   current=$(date -r "$current_ts" "+%Y-%m-%d")
#   echo "Running pipelines runs-duration for date: $current"
#   ./run-cli.sh pipelines runs-duration --start-date "$current" \
#     --end-date "$current" \
#     --workflow-path=".github/workflows/ci.yml" \
#     --metric="avg"

#   current_ts=$((current_ts + 86400))
# done
