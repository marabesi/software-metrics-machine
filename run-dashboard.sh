#!/bin/bash
export SSM_STORE_DATA_AT=/Users/marabesi/Downloads/github-mcp-analysis
export SSM_GIT_REPOSITORY_LOCATION=/Users/marabesi/Downloads/github-mcp-server
export SSM_GITHUB_REPOSITORY=github/github-mcp-server

export PYTHONPATH="$(pwd):$PYTHONPATH"
poetry run python "$@"