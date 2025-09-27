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
export SSM_GIT_REPOSITORY_LOCATION="$(pwd)/tmp_test/repo"
export SSM_GITHUB_REPOSITORY="fake/repo-test"
export SSM_GITHUB_TOKEN="fake-token"

echo "Running tests..."
export PYTHONPATH="$(pwd):$PYTHONPATH"
poetry run pytest -s "$@"

echo "Cleaning up..."
cleanup

echo "Done"
