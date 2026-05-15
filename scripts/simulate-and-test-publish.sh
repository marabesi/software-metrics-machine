#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

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

echo "Packing @smmachine/cli..."
(
	cd "$REPO_ROOT"
	pnpm --filter=@smmachine/cli pack
)

PACKED_FILE="$(find "$REPO_ROOT" -maxdepth 1 -type f -name "smmachine-cli-*.tgz" -newer "$MARKER_FILE" -print | tail -n 1)"

rm -f "$MARKER_FILE"

if [ -z "$PACKED_FILE" ] || [ ! -f "$PACKED_FILE" ]; then
	echo "Error: could not locate generated package tarball in $REPO_ROOT ($PACKED_FILE)"
	exit 1
fi

PACKED_FILE_RELATIVE="${PACKED_FILE#$REPO_ROOT/}"
DOCKER_IMAGE="smm-publish-test:local"

echo "Building Docker image to test tarball install: $PACKED_FILE - docker build context: $REPO_ROOT - docker image: $DOCKER_IMAGE"
docker build \
	--no-cache \
	--build-arg "PACKED_FILE=$PACKED_FILE_RELATIVE" \
	-f "$SCRIPT_DIR/Dockerfile.publish-test" \
	-t "$DOCKER_IMAGE" \
	"$REPO_ROOT"

echo "Done. Package install simulation completed via Docker build."

docker run --rm "$DOCKER_IMAGE"
