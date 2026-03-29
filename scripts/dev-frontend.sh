#!/bin/bash
set -e

echo "Starting Next.js frontend in development mode..."
cd "$(dirname "$0")/../apps/webapp"
npm run dev
