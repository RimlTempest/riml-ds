#!/usr/bin/env bash
# GitHub Pages に出すものを `pages/` に集める（plan 010、ADR-0011 決定 2）。
#
#   pages/index.html …… Storybook の静的出力をそのまま root に
#   pages/r/registry.json …… 部品の索引（tools/cem が生成）
#   pages/r/<name>.json …… shadcn 互換の registry-item（ADR-0010 §5）。dist の中身を埋め込む
#   pages/DESIGN.md、pages/custom-elements.json、pages/tokens.json …… エージェント向けの面
#   pages/.nojekyll …… `_` で始まるファイル（Storybook の出力）を Jekyll に消させない
#
# **Pages に出すものを増やすときはこのファイルだけを直す。** `r/<name>.json` の形は
# ADR-0010 §5（shadcn 互換）を崩さない。
set -euo pipefail

cd "$(dirname "$0")/.."

OUT=pages

bun run build
bun run gen
bun run storybook:build

rm -rf "$OUT"
mkdir -p "$OUT/r"

# Storybook（storybook-static は相対パスで資産を参照するので、サブパス配信でもそのまま動く）
cp -R apps/storybook/storybook-static/. "$OUT"/

cp tools/cem/registry.json "$OUT/r/registry.json"
cp DESIGN.md "$OUT/DESIGN.md"
cp library/elements/custom-elements.json "$OUT/custom-elements.json"
cp system/tokens/dist/tokens.json "$OUT/tokens.json"
touch "$OUT/.nojekyll"

node -e '
  const fs = require("node:fs")
  const path = require("node:path")
  const registry = JSON.parse(fs.readFileSync("tools/cem/registry.json", "utf8"))
  const base = "https://www.riml.work/riml-ds/r"
  const typeOf = (file) => (file.endsWith(".css") ? "registry:style" : "registry:file")
  for (const entry of registry) {
    const files = entry.files.map((file) => ({
      path: `dist/${file}`,
      type: typeOf(file),
      target: `components/riml-ds/${file}`,
      content: fs.readFileSync(path.join("library/elements/dist", file), "utf8"),
    }))
    const item = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: entry.name,
      type: "registry:component",
      title: entry.tag,
      description: entry.summary,
      dependencies: ["@rimltempest/riml-ds-elements"],
      registryDependencies: entry.dependsOn.map((dep) => `${base}/${dep}.json`),
      files,
      meta: { tag: entry.tag, pe: entry.pe, status: entry.status },
    }
    fs.writeFileSync(path.join("pages/r", `${entry.name}.json`), `${JSON.stringify(item, null, 2)}\n`)
  }
  process.stdout.write(`pages: ${registry.length} 部品 -> pages/r/<name>.json\n`)
'

echo "==> pages/ を作った（Pages の上限は 1 GB / 1 サイト 10 ビルド per hour）" >&2
