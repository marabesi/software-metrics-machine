#!/bin/bash

echo "Cleaning up..."
rm -rf ./data.csv

echo "Running tests..."
export PYTHONPATH="$(pwd):$PYTHONPATH"
poetry run pytest -s "$@"

echo "Cleaning up..."
rm -rf ./data.csv

echo "Done"