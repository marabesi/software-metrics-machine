#!/bin/bash
PROJECT_ROOT="$(dirname "$0")/api"
export PYTHONPATH="$PROJECT_ROOT:$PYTHONPATH"
cd "$PROJECT_ROOT" && poetry run smm "$@"