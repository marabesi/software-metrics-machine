#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"
cd ./providers/codemaat && poetry run python "$@"
