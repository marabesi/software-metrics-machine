#!/bin/bash

export PYTHONPATH="$(pwd):$PYTHONPATH"

poetry run streamlit run apps/dashboard/chat.py "$@"