#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Port configuration (can be overridden via environment variables)
REST_PORT="${REST_PORT:-8001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --rest-port)
            REST_PORT="$2"
            shift 2
            ;;
        --frontend-port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --rest-port PORT       REST API port (default: 8001)"
            echo "  --frontend-port PORT   Frontend port (default: 3000)"
            echo "  --help                 Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  REST_PORT              REST API port (default: 8001)"
            echo "  FRONTEND_PORT          Frontend port (default: 3000)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done
# Store background process PIDs
REST_PID=""
FRONTEND_PID=""

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    
    if [ -n "$REST_PID" ]; then
        echo "Stopping REST API (PID: $REST_PID)..."
        kill $REST_PID 2>/dev/null || true
    fi
    
    if [ -n "$FRONTEND_PID" ]; then
        echo "Stopping Frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Wait for processes to finish
    wait $REST_PID 2>/dev/null || true
    wait $FRONTEND_PID 2>/dev/null || true
    
    echo -e "${YELLOW}Services stopped.${NC}"
}

# Trap signals to cleanup
trap cleanup SIGINT SIGTERM EXIT

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Software Metrics Machine - Dev${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Start REST API
echo -e "${BLUE}Starting REST API on http://localhost:${REST_PORT}${NC}"
cd "$PROJECT_ROOT/api"
export SMM_STORE_DATA_AT="$PROJECT_ROOT/api/downloads/ollama_analysis"
PORT=$REST_PORT ./run-rest.sh 2>&1 | sed "s/^/${BLUE}[REST]${NC} /" &
REST_PID=$!
echo -e "${GREEN}✓ REST API started (PID: $REST_PID)${NC}"
echo -e "${GREEN}  Data location: ${SMM_STORE_DATA_AT}${NC}"
echo ""

# Wait a moment for the API to start
sleep 2

# Start Frontend
echo -e "${BLUE}Starting Frontend on http://localhost:${FRONTEND_PORT}${NC}"
cd "$PROJECT_ROOT/apps/webapp"
PORT=$FRONTEND_PORT npm run dev 2>&1 | sed "s/^/${GREEN}[FRONTEND]${NC} /" &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
echo ""

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Services are running!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "REST API:  ${BLUE}http://localhost:${REST_PORT}${NC}"
echo -e "Frontend:  ${BLUE}http://localhost:${FRONTEND_PORT}${NC}"
echo ""
echo -e "Press ${YELLOW}Ctrl+C${NC} to stop all services"
echo ""

# Wait for both processes
wait
