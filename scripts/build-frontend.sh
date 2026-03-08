#!/bin/bash
set -e

echo "Building Next.js frontend..."
cd "$(dirname "$0")/../webapp"
npm install
npm run build
echo "Frontend build complete - output in webapp/.next"
