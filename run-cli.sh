#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"
poetry run python cli.py "$@"