#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"
poetry run pytest "$@"