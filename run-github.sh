#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"
cd ./providers/github && poetry run python "$@"