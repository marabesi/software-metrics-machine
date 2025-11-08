#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"
poetry run fastapi dev src/apps/rest/main.py "$@"