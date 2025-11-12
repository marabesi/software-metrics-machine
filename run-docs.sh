#!/bin/bash

if [ "$1" = "build" ] ; then
  (cd docs && npm run docs:build)
  exit 0
fi

(cd docs && npm run docs:dev -- "$@")