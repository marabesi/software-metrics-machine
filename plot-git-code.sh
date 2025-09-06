#!/bin/bash

# FETCH GIT BASED DATA
./providers/codemaat/fetch-codemaat.sh 2020-01-01

# view
./run-git.sh code-churn.py \
  --out-file="dist/code_churn.png"