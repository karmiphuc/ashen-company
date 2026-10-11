#!/usr/bin/env bash
set -euo pipefail
: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
mode=$(gh api "repos/$GITHUB_REPOSITORY/pages" --jq .build_type)
if [ "$mode" != workflow ]; then
  echo "::error::Pages is publishing raw source without production version metadata. A repository administrator must select GitHub Actions under Settings > Pages > Build and deployment > Source: https://github.com/$GITHUB_REPOSITORY/settings/pages"
  exit 1
fi
