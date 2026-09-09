#!/usr/bin/env bash
# CI と同じ Linux の Chromium（e2e/Dockerfile）で Vitest を回す。
# 「手元の macOS では通るのに CI の test (browser + storybook) だけ落ちる」ときの再現用。
# フォント（Noto CJK）と描画の端数が違うので、axe の scrollable-region-focusable や
# color-contrast はこの中でしか再現しないことがある。
#
#   bash scripts/test-in-docker.sh --project storybook splitter
#   bash scripts/test-in-docker.sh --project browser --project storybook
#
# 引数はそのまま `bun run test --` に渡る。node_modules は scripts/vrt.sh と同じ名前付き
# ボリュームで覆うのでホストのものは書き換えない。build は毎回この中でやり直す。
set -euo pipefail

cd "$(dirname "$0")/.."

IMAGE=riml-ds-e2e
docker build -q -t "$IMAGE" -f e2e/Dockerfile e2e >/dev/null

exec docker run --rm \
  -v "$PWD":/work \
  -v riml-ds-e2e-node-modules:/work/node_modules \
  -v riml-ds-e2e-storybook-node-modules:/work/apps/storybook/node_modules \
  -v riml-ds-e2e-markuplint-node-modules:/work/tools/markuplint/node_modules \
  -v riml-ds-e2e-bun-cache:/root/.bun/install/cache \
  -w /work "$IMAGE" \
  bash -euc 'bun install --frozen-lockfile --ignore-scripts >/dev/null \
    && bun run gen:argtypes >/dev/null \
    && bun run build >/dev/null \
    && bun run test -- "$@"' -- "$@"
