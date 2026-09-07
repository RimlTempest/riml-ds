#!/usr/bin/env bash
# riml-ds の不変条件。CI（plan 010 が配線する）と手元で同じものを走らせる。
# 検査対象が存在しないときは黙って飛ばす（レーンごとに木の中身が違うため）。
set -euo pipefail

failed=0
report() {
  # GitHub Actions が注釈にする形式
  echo "::error file=$1::$2" >&2
  failed=1
}

# 1. class は library/elements/src/**/*.element.ts だけ（ADR-0005）
scan_dirs=""
for dir in system library tools scripts apps e2e; do
  [ -d "$dir" ] && scan_dirs="$scan_dirs $dir"
done
if [ -n "$scan_dirs" ]; then
  # shellcheck disable=SC2086
  offenders=$(grep -rlE '^[[:space:]]*(export[[:space:]]+)?(abstract[[:space:]]+)?class[[:space:]]' \
    --include='*.ts' --exclude='*.d.ts' \
    --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=generated --exclude-dir=fixtures \
    $scan_dirs 2>/dev/null | grep -v '\.element\.ts$' || true)
  for file in $offenders; do
    report "$file" "class is only allowed in *.element.ts (ADR-0005)"
  done
fi

# 2. system/** は library/** を知らない（依存の向き。docs/architecture.md §1）
if [ -d system ]; then
  leaks=$(grep -rlE '@rimltempest/riml-ds-(elements|react|vue|svelte|astro)' system 2>/dev/null || true)
  for file in $leaks; do
    report "$file" "system/** must not depend on library/** (dependency direction)"
  done
fi

# 3. library/elements の依存は lit / tslib / @rimltempest/riml-ds-tokens だけ
if [ -f library/elements/package.json ]; then
  extra=$(node -e '
    const fs = require("node:fs")
    const pkg = JSON.parse(fs.readFileSync("library/elements/package.json", "utf8"))
    const allowed = new Set(["lit", "tslib", "@rimltempest/riml-ds-tokens"])
    const names = Object.keys(pkg.dependencies || {})
    console.log(names.filter((name) => !allowed.has(name)).join(" "))
  ')
  if [ -n "$extra" ]; then
    report "library/elements/package.json" "unexpected dependencies: $extra"
  fi
fi

# 4. 生成物をコミットしない
if git rev-parse --git-dir >/dev/null 2>&1; then
  generated=$(git ls-files 'library/*/src/generated/**' '**/dist/**' 'system/tokens/dist/**' 2>/dev/null || true)
  for file in $generated; do
    report "$file" "generated output must not be committed"
  done
fi

# 5. このリポジトリは Worker を持たない（他リポジトリからの誤コピー防止）
wranglers=$(find . -name 'wrangler.jsonc' -not -path '*/node_modules/*' 2>/dev/null || true)
for file in $wranglers; do
  report "$file" "riml-ds has no Cloudflare Worker; remove wrangler.jsonc"
done

# 6. .npmrc にトークンを書かない（公開は Trusted Publishing だけ）
if [ -f .npmrc ] && grep -q '_authToken' .npmrc; then
  report ".npmrc" "_authToken must never be committed; publishing uses OIDC Trusted Publishing"
fi

# 7. ADR を足したら索引も更新する
if [ -f docs/adr/README.md ]; then
  adr_files=$(find docs/adr -maxdepth 1 -name '[0-9]*.md' 2>/dev/null | wc -l | tr -d ' ')
  adr_rows=$(grep -cE '^\| [0-9]{4} \|' docs/adr/README.md || true)
  if [ "$adr_files" != "$adr_rows" ]; then
    report "docs/adr/README.md" "index has $adr_rows rows but there are $adr_files ADR files"
  fi
fi

# plan 002 以降が足す検査の予約席:
# - system/tokens/dist/tokens.css が生値を含まない（plan 002）
# - library/elements/src/**/*.element.ts が 150 行を超えない（plan 004）
# - 公開パッケージの exports に dist 以外が現れない（plan 007）

exit "$failed"
