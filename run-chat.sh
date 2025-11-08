#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"

poetry run streamlit run src/apps/dashboard/chat.py "$@"