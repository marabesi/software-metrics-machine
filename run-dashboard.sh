#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"

if [ "$1" == "dev" ]; then
  poetry run panel serve src/software_metrics_machine/apps/dashboard/__init__.py --dev --autoreload --allow-websocket-origin=0.0.0.0:5006
  exit
fi

poetry run smm-dashboard
