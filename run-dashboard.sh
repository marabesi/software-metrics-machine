#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"
poetry run panel serve src/apps/dashboard/dashboard.py --dev --autoreload "$@"