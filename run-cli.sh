#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"
poetry run python src/apps/cli/main.py "$@"