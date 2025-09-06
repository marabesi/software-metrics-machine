#!/bin/bash

# FETCH GIT BASED DATA
./providers/codemaat/fetch-codemaat.sh 2025-05-01

# view
./run-codemaat.sh code-churn.py \
  --out-file="dist/code_churn.png"