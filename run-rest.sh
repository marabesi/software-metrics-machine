#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"
poetry run fastapi dev src/software_metrics_machine/apps/rest/main.py --reload --port 8001 "$@"
