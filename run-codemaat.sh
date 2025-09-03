#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"
cd ./codemaat && poetry run python "$@"