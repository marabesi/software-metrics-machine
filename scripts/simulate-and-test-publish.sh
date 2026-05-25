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
		git clone --depth=500 https://github.com/facebook/react "$REPO_ROOT/tmp/react"
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
	"dashboard_start_date": "2026-03-01",
	"dashboard_end_date": "2026-03-30"
}
EOF
)
	echo "$template" > "$REPO_ROOT/tmp/smm_config.json"
fi

docker run -v "$REPO_ROOT/tmp:/app" -e DEBUG=true \
	-e SMM_STORE_DATA_AT=/app --rm $DOCKER_IMAGE \
	smm code codemaat-fetch --start-date 2026-03-01 --end-date 2026-03-30 \
	--debug
