#!/bin/bash

repo_url="https://github.com/ollama/ollama.git"
clone_dir="$(pwd)/acceptance/ollama"

analysis_dir="$(pwd)/acceptance/analysis"
mkdir -p "$analysis_dir"
export SMM_STORE_DATA_AT="$analysis_dir"

TEMPLATE=$(cat <<EOF
  {
    "git_provider": "github",
    "github_token": "fake-token",
    "github_repository": "ollama/ollama",
    "git_repository_location": "$clone_dir",
    "deployment_frequency_target_pipeline": "",
    "deployment_frequency_target_job": ""
  }
EOF
)

echo "$TEMPLATE" > "$analysis_dir/smm_config.json"

function set_up() {
  git clone "$repo_url" "$clone_dir"
  assert_equals 0 $? "Failed to clone repository"
}

function tear_down() {
  rm -rf "$clone_dir"
  rm -rf "$analysis_dir"
}

function test_clone_and_fetch_codemaat() {
  local start_date="2023-01-01"
  local end_date="2023-12-31"
  local output

  output=$(./run-cli.sh codemaat fetch --start-date "$start_date" --end-date "$end_date" 2>&1)

  assert_contains "Running CodeMaat analyses... this may take a while depending on the size of the repository." "$output"
  assert_contains "Running age data extraction ..." "$output"
  assert_contains "Running abs-churn data extraction ..." "$output"
  assert_contains "Running author-churn data extraction ..." "$output"
  assert_contains "Running entity-ownership data extraction ..." "$output"
  assert_contains "Running entity-effort data extraction ..." "$output"
  assert_contains "Running entity-churn data extraction ..." "$output"
  assert_contains "Running coupling data extraction ..." "$output"
}