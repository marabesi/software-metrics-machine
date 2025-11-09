#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"
poetry run smm-dashboard "$@" --dev --autoreload