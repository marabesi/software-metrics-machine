#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"
poetry run panel serve apps/dashboard/main.py --dev "$@"