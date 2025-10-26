#!/bin/bash

GITHUB_TOKEN=$1

# project="ollama"
# github_repo="ollama/ollama"

# project="reactjs"
# github_repo="facebook/react"

project="vscode"
github_repo="microsoft/vscode"
repo_url="https://github.com/$github_repo.git"

base_dir="$(pwd)"
clone_dir="$base_dir/downloads/$project"
analysis_dir="$base_dir/downloads/analysis"

rm -rf "$analysis_dir"
mkdir -p "$analysis_dir"

start_date="2025-09-20"
end_date="2025-09-25"

export SMM_STORE_DATA_AT="$analysis_dir"

if [ ! -d "$clone_dir" ]; then
  git clone "$repo_url" "$clone_dir"
else
  echo "Repository already cloned at $clone_dir"
fi

TEMPLATE=$(cat <<EOF
  {
    "git_provider": "github",
    "github_token": "$GITHUB_TOKEN",
    "github_repository": "$github_repo",
    "git_repository_location": "$clone_dir",
    "deployment_frequency_target_pipeline": "",
    "deployment_frequency_target_job": ""
  }
EOF
)

echo "$TEMPLATE" > "$analysis_dir/smm_config.json"


./run-cli.sh codemaat fetch --start-date "$start_date" --end-date "$end_date"
./run-cli.sh prs fetch --start-date "$start_date" --end-date "$end_date"
./run-cli.sh pipelines fetch --start-date "$start_date" --end-date "$end_date"
./run-cli.sh pipelines fetch-jobs --start-date "$start_date" --end-date "$end_date"

./run-cli.sh pipelines summary
./run-cli.sh prs summary

./run-dashboard.sh
