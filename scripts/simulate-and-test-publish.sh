#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_IMAGE="smm-publish-test:local"
BUILD_FORCE="${1:-false}"

if ! command -v pnpm >/dev/null 2>&1; then
	echo "Error: pnpm is required but was not found in PATH."
	exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
	echo "Error: docker is required but was not found in PATH."
	exit 1
fi

MARKER_FILE="$(mktemp)"
touch "$MARKER_FILE"
trap 'rm -f "$MARKER_FILE"' EXIT


if [ "$BUILD_FORCE" = "true" ]; then
	echo "Packing @smmachine..."
	(
		cd "$REPO_ROOT"
		pnpm pack
	)

	PACKED_FILE="$(find "$REPO_ROOT" -maxdepth 1 -type f -name "smmachine-*.tgz" -newer "$MARKER_FILE" -print | tail -n 1)"

	if [ -z "$PACKED_FILE" ] || [ ! -f "$PACKED_FILE" ]; then
		echo "Error: could not locate generated package tarball in $REPO_ROOT ($PACKED_FILE)"
		exit 1
	fi

	PACKED_FILE_RELATIVE="${PACKED_FILE#$REPO_ROOT/}"

	echo "Building Docker image to test tarball install: $PACKED_FILE - docker build context: $REPO_ROOT - docker image: $DOCKER_IMAGE"
	docker build \
		--no-cache \
		--build-arg "PACKED_FILE=$PACKED_FILE_RELATIVE" \
		-f "$SCRIPT_DIR/Dockerfile.publish-test" \
		-t "$DOCKER_IMAGE" \
		"$REPO_ROOT"

	echo "Done. Package install simulation completed via Docker build."

	rm -f "$PACKED_FILE"

	# clone react, if not already present, to have a real-world codebase to test against
	if [ ! -d "$REPO_ROOT/tmp/react" ]; then
		mkdir -p "$REPO_ROOT/tmp"
		if [ -n "${GITHUB_TOKEN:-}" ]; then
			git -c "http.https://github.com/.extraheader=AUTHORIZATION: bearer ${GITHUB_TOKEN}" clone --shallow-since="2025-03-01" https://github.com/facebook/react "$REPO_ROOT/tmp/react"
		else
			git clone --shallow-since="2025-03-01" https://github.com/facebook/react "$REPO_ROOT/tmp/react"
		fi
	fi

	# create smm config file for testing template string
	export git_repository_location="$REPO_ROOT/tmp/react"
	template=$(cat <<EOF
{
	"git_provider": "github",
	"github_token": "xxxxxxxxxxxxxxxxxxxxxx",
	"github_repository": "facebook/react",
	"git_repository_location": "/app/react",
	"deployment_frequency_target_pipeline": "",
	"deployment_frequency_target_job": "",
	"main_branch": "main",
	"jira_url": "https://xxx.atlassian.net",
	"jira_token": "",
	"jira_project": "KAN",
	"jira_email": "xxxx",
	"sonar_url": "https://sonarcloud.io",
	"sonar_token": "xxxxxxxxx",
	"sonar_project": "xxxxx",
	"log_level": "DEBUG",
	"dashboard_start_date": "2025-03-01",
	"dashboard_end_date": "2025-03-30"
}
EOF
)
	echo "$template" > "$REPO_ROOT/tmp/smm_config.json"
fi

docker run -v "$REPO_ROOT/tmp:/app" -e DEBUG=true \
	-e SMM_STORE_DATA_AT=/app --rm $DOCKER_IMAGE \
	smm code codemaat-fetch --start-date 2025-03-01 --end-date 2025-03-30 \
	--debug

DASHBOARD_CONTAINER_ID=$(docker run -d -v "$REPO_ROOT/tmp:/app" -e DEBUG=true \
	-p 3000:3000 \
	-p 3001:3001 \
	-e SMM_STORE_DATA_AT=/app $DOCKER_IMAGE \
	smm dashboard serve)

echo "Dashboard container started with ID: $DASHBOARD_CONTAINER_ID"

# Wait for the dashboard to be ready
echo "Waiting for dashboard to become available on http://localhost:3000..."
MAX_RETRIES=30
RETRY_COUNT=0
until curl -s http://localhost:3000 > /dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  echo "Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
  RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Error: Dashboard did not become available in time."
  docker stop "$DASHBOARD_CONTAINER_ID" || true
  exit 1
fi

echo "Dashboard is up. Testing pages..."

# Test main page
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$HTTP_CODE" -eq 200 ]; then
  echo "http://localhost:3000/ returned 200 OK."
else
  echo "Error: http://localhost:3000/ returned HTTP $HTTP_CODE."
  docker stop "$DASHBOARD_CONTAINER_ID" || true
  exit 1
fi

# Test insights page
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard/insights/)
if [ "$HTTP_CODE" -eq 200 ]; then
  echo "http://localhost:3000/dashboard/insights/ returned 200 OK."
else
  echo "Error: http://localhost:3000/dashboard/insights/ returned HTTP $HTTP_CODE."
  docker stop "$DASHBOARD_CONTAINER_ID" || true
  exit 1
fi

echo "All checks passed. Stopping dashboard container..."
docker stop "$DASHBOARD_CONTAINER_ID"
