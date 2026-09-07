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

# 8. PE ティアの不変条件（ADR-0012 §影響）と *.element.ts の行数（ADR-0005）
for file in library/elements/src/*/*.element.ts; do
  [ -e "$file" ] || continue
  dir="$(dirname "$file")"
  name="$(basename "$file" .element.ts)"
  tier="$(sed -n 's/^[[:space:]]*\*[[:space:]]*@pe[[:space:]]\{1,\}\([ABC]\).*$/\1/p' "$file" | head -1)"
  lines="$(wc -l < "$file" | tr -d ' ')"

  if [ "$lines" -gt 150 ]; then
    report "$file" "*.element.ts must stay at or under 150 lines (ADR-0005); it has $lines"
  fi

  case "$tier" in
    A)
      # ティア A は light DOM。shadow を作らず、スタイルは <name>.css に置く
      if grep -qE 'static[[:space:]]+(override[[:space:]]+)?styles|shadowRootOptions|attachShadow' "$file"; then
        report "$file" "tier A renders into light DOM: no static styles / shadowRootOptions / attachShadow (ADR-0012)"
      fi
      [ -f "$dir/$name.css" ] || report "$file" "tier A needs $name.css in @layer rd.components (ADR-0012)"
      [ -f "$dir/$name.contract.ts" ] || report "$file" "tier A needs $name.contract.ts (markup contract, ADR-0012)"
      ;;
    B)
      [ -f "$dir/$name.css" ] || report "$file" "tier B needs $name.css for the :not(:defined) appearance (ADR-0012)"
      ;;
    C)
      if [ -f "$dir/$name.css" ]; then
        report "$dir/$name.css" "tier C is shadow-only: styles belong in $name.styles.ts (ADR-0012)"
      fi
      ;;
    *)
      report "$file" "missing JSDoc @pe A|B|C (ADR-0012)"
      ;;
  esac
done

# 9. フォーム参加要素・リンク・ボタンを包む契約はティア A 以外を選べない（ADR-0012 §1）
for contract_file in library/elements/src/*/*.contract.ts; do
  [ -e "$contract_file" ] || continue
  case "$contract_file" in *.test.ts) continue ;; esac
  dir="$(dirname "$contract_file")"
  name="$(basename "$contract_file" .contract.ts)"
  roles="$(grep -A6 -E '^[[:space:]]*roles:' "$contract_file" || true)"
  if printf '%s' "$roles" | grep -qE '(input|textarea|select|button|a\[href\])'; then
    if ! grep -qE '^[[:space:]]*\*[[:space:]]*@pe[[:space:]]+A' "$dir/$name.element.ts" 2>/dev/null; then
      report "$contract_file" "a contract wrapping form / link / button elements must be @pe A (ADR-0012)"
    fi
  fi
done

# 10. story の a11y 除外は理由付きで、合計が部品数を超えない（ADR-0007 §影響）
story_files=$(find library/elements/src apps/storybook/stories -name '*.stories.ts' 2>/dev/null || true)
if [ -n "$story_files" ] && [ -f tools/cem/registry.json ]; then
  # shellcheck disable=SC2086
  exclusions=$({ grep -hE '^[[:space:]]*rules:' $story_files 2>/dev/null || true; } | wc -l | tr -d ' ')
  # shellcheck disable=SC2086
  reasons=$({ grep -hE '^[[:space:]]*reason:' $story_files 2>/dev/null || true; } | wc -l | tr -d ' ')
  components=$(node -e 'const r=require("./tools/cem/registry.json");console.log(Array.isArray(r)?r.length:0)')
  if [ "$exclusions" -gt "$reasons" ]; then
    report "library/elements/src" "every parameters.a11y exclusion needs a reason (ADR-0007): $exclusions rules but $reasons reasons"
  fi
  if [ "$exclusions" -gt "$components" ]; then
    report "library/elements/src" "too many a11y exclusions: $exclusions > $components components (ADR-0007)"
  fi
fi

# 11. VRT のベースラインは Docker の中でだけ撮る（OS 名が付いた画像はホストで撮ったもの）
if git rev-parse --git-dir >/dev/null 2>&1; then
  host_shots=$(git ls-files 'e2e/vrt/__screenshots__/**' 2>/dev/null | grep -E -- '-(darwin|win32)' || true)
  for file in $host_shots; do
    report "$file" "screenshots must be taken inside Docker (bun run vrt:update); host-taken images are not committable"
  done

  # 12. JS 無し検証のページは生成物（e2e/pe/build-pages.ts が毎回作る）
  pe_pages=$(git ls-files 'e2e/pe/pages/**' 2>/dev/null || true)
  for file in $pe_pages; do
    report "$file" "generated output must not be committed (e2e/pe/build-pages.ts rebuilds it)"
  done
fi

# plan 002 以降が足す検査の予約席:
# - system/tokens/dist/tokens.css が生値を含まない（plan 002）
# - 公開パッケージの exports に dist 以外が現れない（plan 007）

exit "$failed"
