#!/usr/bin/env bash
# 変更されたパッケージディレクトリ（system/tokens など）を 1 行 1 件で出す。
# plan 010 の CI が VRT / e2e の対象を絞るのに使う。
# 全部回すべきときは ALL だけを出す（docs/testing.md「system/tokens が変わったら全部回す」）。
set -euo pipefail

base="${BASE:-origin/main}"
if ! git rev-parse --verify --quiet "$base" >/dev/null; then
  base="main"
fi
if ! git rev-parse --verify --quiet "$base" >/dev/null; then
  echo "ALL"
  exit 0
fi

changed=$(git diff --name-only "$base"...HEAD || true)
[ -n "$changed" ] || exit 0

# トークンとツールチェーンは全レーンに効く
if echo "$changed" | grep -qE '^(system/tokens/|tsconfig\.base\.json$|package\.json$|bun\.lock$)'; then
  echo "ALL"
  exit 0
fi

echo "$changed" \
  | grep -E '^(system|library|tools|apps)/[^/]+/' \
  | cut -d/ -f1,2 \
  | sort -u || true

if echo "$changed" | grep -qE '^e2e/'; then
  echo "e2e"
fi
