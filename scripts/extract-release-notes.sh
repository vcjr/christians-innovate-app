#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# extract-release-notes.sh
#
# Extracts the LATEST version section from CHANGELOG.md and prints it to stdout.
# Used by release-it as the GitHub release body so that the hand-curated,
# volunteer-friendly changelog entries become the release notes automatically.
#
# Usage:
#   ./scripts/extract-release-notes.sh              # latest released version
#   ./scripts/extract-release-notes.sh 0.3.0        # specific version
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

CHANGELOG="CHANGELOG.md"

if [[ ! -f "$CHANGELOG" ]]; then
  echo "CHANGELOG.md not found" >&2
  exit 1
fi

VERSION="${1:-}"

if [[ -z "$VERSION" ]]; then
  # Extract the first version heading that is NOT [Unreleased]
  # Pattern: ## [X.Y.Z] - YYYY-MM-DD
  VERSION=$(grep -oE '## \[[0-9]+\.[0-9]+\.[0-9]+\]' "$CHANGELOG" | head -1 | sed 's/## \[//;s/\]//')
fi

if [[ -z "$VERSION" ]]; then
  echo "No version found in $CHANGELOG" >&2
  exit 1
fi

# Extract everything between "## [VERSION]" and the next "## [" heading (or EOF)
awk -v ver="$VERSION" '
  /^## \[/ {
    if (found) exit
    if (index($0, "[" ver "]")) found=1
    next
  }
  found { print }
' "$CHANGELOG"
