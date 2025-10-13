#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"
poetry run panel serve apps/dashboard/dashboard.py --dev "$@"