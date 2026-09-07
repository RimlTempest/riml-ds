#!/usr/bin/env bash
# `.github/workflows/ci.yml` を手元で再現する（plan 010）。
# **CI にゲートを足したらここにも足す。** 手元で再現できない CI は作らない。
#
#   bash scripts/ci-local.sh              # ホスト + Docker（CI と同じ全ジョブ）
#   bash scripts/ci-local.sh --host       # ホストで回るジョブだけ
#   bash scripts/ci-local.sh --container  # Docker の中で回るジョブだけ
#
# ホスト側は ci.yml の ubuntu ジョブ（guard / fmt-lint / typecheck / test-node /
# release-check / agent-surface）、Docker 側は container ジョブ（test-browser /
# markuplint / a11y-vrt-pe / frameworks）に対応する。
# Docker イメージは `e2e/Dockerfile`（Playwright と同じタグ + 日本語フォント + bun）。
# CI の `container:` は素の Playwright イメージにその 2 つを apt で足したもので、中身は同じ。
set -euo pipefail

cd "$(dirname "$0")/.."

run_host=1
run_container=1
case "${1:-}" in
  --host) run_container=0 ;;
  --container) run_host=0 ;;
  '') ;;
  *)
    echo "usage: bash scripts/ci-local.sh [--host|--container]" >&2
    exit 2
    ;;
esac

started=$(date +%s)
stage() {
  echo "" >&2
  echo "==> $1" >&2
}
elapsed() {
  local now
  now=$(date +%s)
  printf '%dm%02ds' $(((now - started) / 60)) $(((now - started) % 60))
}

if [ "$run_host" = 1 ]; then
  stage 'guard: 不変条件'
  bash scripts/guard.sh

  stage 'fmt-lint: oxfmt / oxlint / stylelint'
  bun run fmt:check
  bun run lint
  bun run lint:css

  stage 'typecheck'
  bun run typecheck

  stage 'test-node: node + react project'
  bun run test -- --project node --project react

  stage 'release-check: publint / attw / size-limit / knip'
  bun run release:check

  stage 'agent-surface: 生成物の鮮度 / design.md lint / MCP'
  bun run gen
  git diff --exit-code
  bunx @google/design.md@0.4.0 lint DESIGN.md
  bun run test -- --project node tools/mcp

  echo "" >&2
  echo "==> ホスト側 OK（$(elapsed)）" >&2
fi

if [ "$run_container" = 1 ]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "==> docker が無いので container ジョブを飛ばす（CI では必ず走る）" >&2
    exit 0
  fi

  stage 'docker build（e2e/Dockerfile）'
  IMAGE=riml-ds-e2e
  docker build -t "$IMAGE" -f e2e/Dockerfile e2e

  stage 'container: test-browser / markuplint / a11y-vrt-pe / frameworks'
  # node_modules はホスト（macOS）のバイナリが入っているので名前付きボリュームで覆う。
  # ボリューム名は scripts/vrt.sh と共有してキャッシュを使い回す。
  docker run --rm \
    -v "$PWD":/work \
    -v riml-ds-e2e-node-modules:/work/node_modules \
    -v riml-ds-e2e-storybook-node-modules:/work/apps/storybook/node_modules \
    -v riml-ds-e2e-markuplint-node-modules:/work/tools/markuplint/node_modules \
    -v riml-ds-e2e-bun-cache:/root/.bun/install/cache \
    -w /work "$IMAGE" \
    bash -euc '
      echo "==> bun install" >&2
      bun install --frozen-lockfile --ignore-scripts
      bun install --cwd tools/markuplint --frozen-lockfile
      bun run gen:argtypes

      echo "==> build" >&2
      bun run build

      echo "==> test-browser: browser + storybook project" >&2
      bun run test -- --project browser --project storybook

      # input[type=checkbox][role=switch] は HTML-AAM で checked が aria-checked に写るので
      # wai-aria を外している（ARIA in HTML。.markuplintrc.json の nodeRules）
      echo "==> markuplint: 描画後の HTML" >&2
      bun run render
      bun run lint:html

      echo "==> a11y-vrt-pe: playwright.config.ts の全 project" >&2
      bunx playwright test -c e2e/playwright.config.ts

      echo "==> frameworks: react / vue / svelte / astro" >&2
      bun run e2e:frameworks
    '

  echo "" >&2
  echo "==> container 側 OK（$(elapsed)）" >&2
fi

echo "" >&2
echo "==> ci:local OK（$(elapsed)）" >&2
