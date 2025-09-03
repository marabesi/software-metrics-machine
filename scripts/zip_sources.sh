#!/usr/bin/env bash
set -euo pipefail

# Zip repository source files while excluding everything listed in .gitignore.
# Preferred method: use `git ls-files` to get tracked + untracked (excluding ignored) files.
# Fallback: use .gitignore as a best-effort exclude list.

OUT="source.zip"
ROOT_DIR="."

usage() {
  cat <<EOF
Usage: $0 [-o out.zip] [path]

Creates a zip archive containing source files only (excludes patterns from .gitignore).

Options:
  -o FILE    Output zip file (default: source.zip)
  path       Path to repository root (default: current directory)
EOF
  exit 2
}

while getopts ":o:h" opt; do
  case "$opt" in
    o) OUT="$OPTARG" ;;
    h) usage ;;
    *) usage ;;
  esac
done
shift $((OPTIND-1))

if [ "$#" -ge 1 ]; then
  ROOT_DIR="$1"
fi

cd "$ROOT_DIR"

echo "Creating archive: $OUT from path: $(pwd)"

if git rev-parse --git-dir >/dev/null 2>&1; then
  # Use git to list files: tracked + untracked (but not ignored)
  echo "Using git to collect files (tracked + untracked, excluding .gitignored)..."
  # produce newline-separated list and pass to zip via stdin
  git ls-files --cached --others --exclude-standard -z | tr '\0' '\n' | \
    sed '/^$/d' | zip -@ "$OUT"
  echo "Wrote $OUT"
  exit 0
fi

# Fallback: no git repository detected. Use .gitignore patterns as -x for zip (best-effort)
if [ -f .gitignore ]; then
  echo "No git repo detected; using .gitignore (best-effort) to exclude files."
  # read non-empty, non-comment lines
  mapfile -t PATTERNS < <(grep -v -E '^\s*$|^\s*#' .gitignore || true)
  EXCLUDE_ARGS=()
  for p in "${PATTERNS[@]:-}"; do
    # skip negation patterns (can't easily represent them for zip)
    if [[ "$p" == !* ]]; then
      echo "  WARNING: skipping negation pattern in .gitignore: $p"
      continue
    fi
    # zip expects patterns relative to cwd; pass as-is
    EXCLUDE_ARGS+=("-x" "$p")
  done

  # ensure we don't include the output file itself
  EXCLUDE_ARGS+=("-x" "$OUT")

  zip -r "$OUT" . "${EXCLUDE_ARGS[@]}"
  echo "Wrote $OUT (note: exclusion based on .gitignore is best-effort)"
  exit 0
fi

# Last resort: zip everything except the output file
echo "No .gitignore found and not a git repo — zipping everything (except $OUT)"
zip -r "$OUT" . -x "$OUT"
echo "Wrote $OUT"
