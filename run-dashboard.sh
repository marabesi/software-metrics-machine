#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"
poetry run panel serve src/software_metrics_machine/apps/dashboard/dashboard.py --dev --autoreload "$@"