#!/usr/bin/env bash
# Playwright を Docker の中で走らせる（ADR-0007 §影響）。
# スクリーンショットの更新も a11y も PE もこの入口を通す：ホストで撮った画像を
# コミットさせないため、`playwright test --update-snapshots` を直接叩く npm script は用意しない。
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f apps/storybook/storybook-static/index.json ]; then
  echo "==> storybook-static が無いので先にビルドする" >&2
  bun run storybook:build
fi

IMAGE=riml-ds-e2e
docker build -t "$IMAGE" -f e2e/Dockerfile e2e

# node_modules はホスト（macOS）のバイナリが入っているので名前付きボリュームで覆う。
# ホストの node_modules は書き換えない。
exec docker run --rm \
  -v "$PWD":/work \
  -v riml-ds-e2e-node-modules:/work/node_modules \
  -v riml-ds-e2e-storybook-node-modules:/work/apps/storybook/node_modules \
  -v riml-ds-e2e-markuplint-node-modules:/work/tools/markuplint/node_modules \
  -v riml-ds-e2e-bun-cache:/root/.bun/install/cache \
  -w /work "$IMAGE" \
  bash -c 'bun install --frozen-lockfile && bunx playwright test -c e2e/playwright.config.ts "$@"' -- "$@"
