#!/bin/bash

repo_url="https://github.com/ollama/ollama.git"
clone_dir="$(pwd)/e2e/target"
analysis_dir="$(pwd)/e2e/analysis"
export SMM_STORE_DATA_AT="$analysis_dir"

function set_up() {
  mkdir -p "$analysis_dir"
  chmod +w "$analysis_dir"

  if [ ! -d "$clone_dir" ]; then
    git clone "$repo_url" "$clone_dir"
    assert_equals 0 $? "Failed to clone repository"
  else
    echo "Repository already cloned at $clone_dir"
  fi


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
}

function tear_down() {
  # rm -rf "$clone_dir"
  rm -rf "$analysis_dir"
}

function test_clone_and_fetch_codemaat_for_entire_repo() {
  local start_date="2023-01-01"
  local end_date="2023-12-31"
  local output

  output=$(./run-cli.sh code fetch --start-date "$start_date" --end-date "$end_date" 2>&1)

  assert_contains "Running CodeMaat analyses... this may take a while depending on the size of the repository." "$output"
  assert_contains "Running age data extraction ..." "$output"
  assert_contains "Running abs-churn data extraction ..." "$output"
  assert_contains "Running author-churn data extraction ..." "$output"
  assert_contains "Running entity-ownership data extraction ..." "$output"
  assert_contains "Running entity-effort data extraction ..." "$output"
  assert_contains "Running entity-churn data extraction ..." "$output"
  assert_contains "Running coupling data extraction ..." "$output"
}

function test_clone_and_fetch_codemaat_for_entire_a_subfolder_in_the_repo() {
  local start_date="2023-01-01"
  local end_date="2023-12-31"
  local output

  output=$(./run-cli.sh code fetch --start-date "$start_date" --end-date "$end_date" --subfolder "api/" 2>&1)

  assert_contains "Running CodeMaat analyses... this may take a while depending on the size of the repository." "$output"
  assert_contains "Running age data extraction ..." "$output"
  assert_contains "Running abs-churn data extraction ..." "$output"
  assert_contains "Running author-churn data extraction ..." "$output"
  assert_contains "Running entity-ownership data extraction ..." "$output"
  assert_contains "Running entity-effort data extraction ..." "$output"
  assert_contains "Running entity-churn data extraction ..." "$output"
  assert_contains "Running coupling data extraction ..." "$output"
}

function test_skip_refetching_when_files_exists() {
  local start_date="2023-01-01"
  local end_date="2023-12-31"
  local output

  output=$(./run-cli.sh code fetch --start-date "$start_date" --end-date "$end_date" --subfolder "api/" 2>&1)
  output=$(./run-cli.sh code fetch --start-date "$start_date" --end-date "$end_date" --subfolder "api/" 2>&1)

  assert_contains "Running CodeMaat analyses... this may take a while depending on the size of the repository." "$output"
  assert_contains "Skipping age: output already exists at $analysis_dir/github_ollama_ollama/age.csv" "$output"
  assert_contains "Skipping abs-churn: output already exists at $analysis_dir/github_ollama_ollama/abs-churn.csv" "$output"
  assert_contains "Skipping author-churn: output already exists at $analysis_dir/github_ollama_ollama/author-churn.csv" "$output"
  assert_contains "Skipping entity-ownership: output already exists at $analysis_dir/github_ollama_ollama/entity-ownership.csv" "$output"
  assert_contains "Skipping entity-effort: output already exists at $analysis_dir/github_ollama_ollama/entity-effort.csv" "$output"
  assert_contains "Skipping entity-churn: output already exists at $analysis_dir/github_ollama_ollama/entity-churn.csv" "$output"
  assert_contains "Skipping coupling: output already exists at $analysis_dir/github_ollama_ollama/coupling.csv" "$output"
}