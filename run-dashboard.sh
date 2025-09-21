#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"
poetry run panel serve app.py --dev "$@"