#!/bin/bash

set -e  # Exit on error

echo "🔨 Building webapp..."
cd webapp
npm run build

echo "📦 Copying build output to API..."
cd ..
rm -rf api/out
cp -r webapp/out api/

echo "✅ Build complete and deployed to api/out"
echo ""
echo "To start the Next.js dashboard, run:"
echo "  sh run-dashboard.sh"
echo ""
echo "The dashboard will be available at: http://localhost:3000"
