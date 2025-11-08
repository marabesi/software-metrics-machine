#!/bin/bash

# Function to unify rm -rf operations
cleanup() {
  rm -rf "$(pwd)/tmp_test"
  rm -rf "$(pwd)/data.csv"
}

cleanup
mkdir -p "$(pwd)/tmp_test/repo"

cp -R "$(pwd)/fixtures/github" "$(pwd)/tmp_test"

export SMM_STORE_DATA_AT="$(pwd)/tmp_test/github"

TEMPLATE=$(cat <<EOF
{
  "git_provider": "github",
  "github_token": "fake-token",
  "github_repository": "fake-repo-test",
  "git_repository_location": "$(pwd)/tmp_test/repo",
  "deployment_frequency_target_pipeline": "",
  "deployment_frequency_target_job": ""
}
EOF
)

echo "$TEMPLATE" > "$(pwd)/tmp_test/github/smm_config.json"

git config --global user.email "you@example.com"
git config --global user.name "Pytest"

echo "Running tests..."
#export PYTHONPATH="$(pwd):$PYTHONPATH"
poetry run pytest -s "$@"

echo "Cleaning up..."
cleanup

echo "Done"
