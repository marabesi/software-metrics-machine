#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"
cd ./github && poetry run python "$@"