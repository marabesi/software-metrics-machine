#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"

if [ "$1" == "dev" ]; then
  BOKEH_ALLOW_WS_ORIGIN=localhost:5006 poetry run panel serve src/software_metrics_machine/apps/dashboard/__init__.py --dev --autoreload
  exit
fi

poetry run smm-dashboard
