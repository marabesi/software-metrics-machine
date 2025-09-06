#!/bin/bash

# FETCH GIT BASED DATA
./providers/codemaat/fetch-codemaat.sh 2025-05-01

# view
./run-codemaat.sh code-churn.py \
  --out-file="dist/code_churn.png" \
&& \
./run-codemaat.sh coupling.py \
  --out-file="dist/code_coupling.png" \
&& \
./run-codemaat.sh entity_churn.py \
  --top=30 \
  --ignore-files="*.json,*.snap" \
  --out-file="dist/code_entity_churn.png" \
&& \
./run-codemaat.sh entity_effort.py \
  --top=30 \
  --ignore-files="*.json,*.snap,*md,*.yml" \
  --out-file="dist/code_entity_effort.png"
