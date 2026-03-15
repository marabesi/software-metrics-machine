#!/bin/bash

# Start the dashboard server from the static build output

PROJECT_ROOT="$(dirname "$0")/.."

if [ ! -d "$PROJECT_ROOT/api/out" ]; then
    echo "❌ Dashboard build not found at api/out"
    echo "Run this first:"
    echo "  sh scripts/build-and-deploy-dashboard.sh"
    exit 1
fi

echo "🚀 Starting dashboard server..."
echo "📍 Open: http://localhost:3000"
echo ""

# Use Python's built-in HTTP server if available, otherwise use Node.js
if command -v python3 &> /dev/null; then
    cd "$PROJECT_ROOT/api/out"
    echo "Using Python HTTP server..."
    python3 -m http.server 3000
elif command -v npx &> /dev/null; then
    echo "Using Node.js http-server..."
    npx http-server "$PROJECT_ROOT/api/out" -p 3000 -c-1
else
    echo "❌ Neither Python nor Node.js found"
    exit 1
fi
