#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"
poetry run fastapi dev apps/rest/main.py "$@"