#!/usr/bin/env bash
# publish 前のパッケージ検査（ADR-0009 / docs/publishing.md）。
# `publint`（exports / files / type の不整合）と `attw`（型解決）を公開パッケージ全部に当てる。
# size-limit / knip / sherif / gen-diff は `bun run release:check` の側で回す。
#
# knip.json の除外の理由（JSON にコメントが書けないのでここに残す。ADR-0009 のゲート）:
#   - ignoreExportsUsedInFile: 同じファイルの中だけで使う export（テスト用に切り出した純関数）を
#     未使用としない。パッケージの外に出ていない export は公開 API ではない
#   - root の publint / @arethetypeswrong/cli / http-server / @axe-core/playwright:
#     このシェルスクリプトと Playwright の webServer から `bunx` で呼ぶ。knip は
#     .sh とテンプレートリテラルの中までは読まない
#   - library/elements の @rd-argtypes / @rd-shadow / @storybook/*: story が使う Vite の別名と、
#     apps/storybook 側で宣言している依存
#   - e2e の @axe-core/playwright / http-server: e2e/{a11y,pe,vrt,frameworks} は root の
#     workspaces で除外されているので knip の解析対象に入らない
#   - e2e/* の @rimltempest/riml-ds-css: src/styles.css の @import から使う（CSS は解析されない）
#   - library/svelte の svelte: 生成物の *.svelte から使う
#   - ignoreIssues の tools/cem/src/wrappers/core/common.ts: CONTROL_ID が未使用。
#     feat/frameworks レーンの所有ファイルなのでこのレーンでは消せない（報告済み）
set -euo pipefail

cd "$(dirname "$0")/.."

failed=0
report() {
  # GitHub Actions が注釈にする形式
  echo "::error file=$1::$2" >&2
  failed=1
}

# 公開パッケージ = `private: true` が無い package.json。ワークスペースの深さは最大 2。
packages=$(
  find system library tools apps -maxdepth 2 -name package.json -not -path '*/node_modules/*' |
    sort
)

for pkg in $packages; do
  dir="$(dirname "$pkg")"
  [ "$(jq -r '.private // false' "$pkg")" = "true" ] && continue
  name="$(jq -r '.name' "$pkg")"
  echo "==> $name ($dir)"

  bunx publint --strict "$dir" || report "$pkg" "publint --strict failed"

  # attw は TypeScript の解決器なので、型を持たない入口（CSS・.astro）は必ず
  # 「Resolution failed」になる。これは型の問題ではないので入口ごと外す。
  # ルール自体（no-resolution）は消さない：JS の入口で起きたら落ちてほしい。
  assets=$(
    jq -r '(.exports // {}) | to_entries[] | select((.value | tostring) | test("\\.(css|astro)")) | .key' "$pkg"
  )
  # shellcheck disable=SC2086
  if [ -n "$assets" ]; then
    bunx attw --pack "$dir" --profile esm-only --exclude-entrypoints $assets \
      || report "$pkg" "attw --profile esm-only failed"
  else
    bunx attw --pack "$dir" --profile esm-only || report "$pkg" "attw --profile esm-only failed"
  fi
done

exit "$failed"
