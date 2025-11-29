#!/bin/bash

docker run --rm -p 5006:5006 \
  -e SMM_STORE_DATA_AT="/data" \
  -v $(pwd)/downloads/ollama:/ollama \
  -v $(pwd)/downloads/ollama_analysis:/data \
  smm-docker \
  smm-dashboard
