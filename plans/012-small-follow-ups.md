# 012: 小さな追随（mcp の lit 混入ゲート・リンクの underline-offset トークン・印刷の改ページ制御）

**優先度**: P3　**規模**: S　**依存**: 011（マージ済み）　**レーン**: `chore/follow-ups-012`
**計画時の main**: `06f164e`

> **Drift check（最初に実行）**:
> `git diff --stat 06f164e..HEAD -- scripts/release-check.sh tools/mcp system/tokens/src system/css/src system/css/test system/tokens/test`
> 差分が出たら、その内容を読んでから進める。`tools/mcp/src` や `system/css/src/base.css` の構造が変わっていたら STOP して報告。

## なぜ

plan 003 / 009 / 011 で「後で」にした 3 件を片付ける。どれも小さいが、放置すると再発・忘却する類のもの。

1. **mcp に `lit` が再混入しても気付けない。** plan 011 で `tools/mcp/dist/cli.js` から `LitElement` を消した
   （契約サブパス経由）。しかし守っているのは人の目だけ。例を 1 つ `@rimltempest/riml-ds-elements/<name>`（index）から
   import すれば元に戻る。テストで固定する。
2. **リンクの下線が文字に近すぎる。** plan 003 で `a { text-underline-offset: 0.15em }` を書こうとして、
   `--rd-*` のトークンが無いので stylelint（strict-value）に落ち、見送った（`plans/003-foundation-css.md` L185–187）。
   トークンを足して base.css で使う。
3. **印刷で見出しの直後や表の途中で改ページする。** `system/css/src/print.css` は URL の書き出しと `nav` の非表示だけ。
   `break-inside` / `break-after` を足す（Baseline Widely available）。

## リポジトリの決まり（守る）

- `any` / `as` / `!` / `enum` を書かない。`class` は `*.element.ts` だけ。oxlint `riml-ds/*` が落とす
- CSS の値はトークン `var(--rd-*)` だけ（stylelint `declaration-strict-value`）。キーワード値（`avoid` など）は対象外
- 失敗するテストを先に書く（red → green）。テストはパッケージごとの `test/` に置き、`vitest run --root ../.. --project node <path>` で走る
- `bun run gen` / `bun run design-md` は決定的で、実行後に `git status` が汚れないこと
- `.changeset/*.md` は手書きで置く（対話 CLI は使わない）。fixed group なので 9 パッケージが一緒に上がる
- 触ってよいパス（`scripts/lanes.tsv` の `chore/follow-ups-012`）: `tools/mcp/test`, `system/tokens/src/semantic/typography.tokens.json`,
  `system/tokens/test`, `system/css/src/base.css`, `system/css/src/print.css`, `system/css/test`, `e2e/__screenshots__`, `.changeset`,
  そして生成物の再出力 `DESIGN.md`（**フロントマターのみ**。本文は触らない）。
  `docs/**`, `plans/README.md`, `skills/**`, `.claude/**`, `scripts/*.sh`, `.github/**` は触らない

## Step 1 — mcp の `lit` 混入をテストで固定

**red**: `tools/mcp/test/bundle.test.ts` を新規作成。

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// tools/mcp/dist は `bun run build` の生成物。CI は test の前に build を回す（ci.yml）
const here = resolve(import.meta.dirname, '..')
const read = (rel: string): string => readFileSync(resolve(here, rel), 'utf8')

describe('@rimltempest/riml-ds-mcp の配布物', () => {
  it('dist/cli.js に Lit が入っていない（例は契約サブパスから作る。plan 011）', () => {
    const bundle = read('dist/cli.js')
    expect(bundle).not.toContain('LitElement')
    expect(bundle).not.toMatch(/from\s+["']lit["']/)
  })

  it('実行時依存に lit / elements が無い（elements は devDependencies でバンドルに取り込む）', () => {
    const pkg: unknown = JSON.parse(read('package.json'))
    const deps = typeof pkg === 'object' && pkg !== null && 'dependencies' in pkg ? pkg.dependencies : {}
    expect(deps).not.toHaveProperty('lit')
    expect(deps).not.toHaveProperty('@rimltempest/riml-ds-elements')
  })
})
```

（`pkg.dependencies` の取り出しは `as` を使わず型を絞る。上のコードが typecheck に通らなければ
`tools/mcp/test/core/elements.test.ts` にある JSON の読み方に揃える。）

**green**: 現状の main で両方通るはず（plan 011 済み）。通らなければ **STOP** — 011 の成果が壊れているので報告。

**赤になることの確認**（テストが本当に守っているか）: 一時的に `tools/mcp/src/examples.ts` の import を 1 つ
`@rimltempest/riml-ds-elements/button`（index）に変えて `bun run build && bun run test -- --project node tools/mcp/test/bundle.test.ts`
→ 1 件 fail することを確認し、**元に戻す**（`git checkout tools/mcp/src/examples.ts`。examples.ts はこのレーンの所有外なので変更を残さない）。

**Verify**: `bun run test -- --project node tools/mcp` → 40 passed（38 + 2）。

## Step 2 — `type.link.underline-offset` トークンと base.css

**red**: `system/css/test/build.test.ts` に追加（既存の `it('使っている var(--rd-*) が…')` の隣）:

```ts
  it('a の下線は text-underline-offset をトークンで指定する（plan 003 の見送りを回収）', () => {
    expect(base).toMatch(/a\s*\{[^}]*text-underline-offset:\s*var\(--rd-type-link-underline-offset\)/)
  })
```

`base` が無ければ、同ファイルの他のテストが `src/base.css` をどう読んでいるかに揃える（`readFileSync(... 'src/base.css')`）。

**トークン**: `system/tokens/src/semantic/typography.tokens.json` の `type` の下に追加。既存の `type.body` などは
`$type: typography` の複合値だが、これは寸法なので `$type: dimension` を葉に付ける:

```json
    "link": {
      "underline-offset": {
        "$type": "dimension",
        "$value": { "value": 0.15, "unit": "em" },
        "$description": "リンクの下線と文字の隙間。ディセンダーに重ならない最小値"
      }
    }
```

（`type` グループに `$type: typography` が付いているので、葉で `$type` を上書きする。Terrazzo はこれを許す。
`terrazzo check` が拒否したら、`system/tokens/src/semantic/space.tokens.json` の書き方に揃えて
`link` を `type` の外の独立グループにするのではなく、**STOP して報告**。命名 `type.link.*` は plan 003 で決めた名前。）

**base.css**:

```css
  a {
    color: var(--rd-color-accent-text);
    text-decoration: underline;
    text-underline-offset: var(--rd-type-link-underline-offset);
  }
```

**再生成**: `bun run build`（tokens → css）→ `bun run design-md`（DESIGN.md フロントマターにトークンが 1 つ増える）→
`bun run gen`。`git status` に出るのは `typography.tokens.json`, `base.css`, `build.test.ts`, `DESIGN.md`（フロントマター）だけ。

**Verify**:
- `bun run --filter @rimltempest/riml-ds-tokens check` → exit 0（terrazzo check: 説明・命名・重複）
- `grep -c "rd-type-link-underline-offset" system/tokens/dist/tokens.css` → 1 以上
- `bun run test -- --project node system` → 全部 green（`invariants.test.ts` の「トークン数が src の葉の数と一致」が自動で追随する）
- `bun run lint:css` → exit 0

## Step 3 — print.css の改ページ制御

**red**: `system/css/test/build.test.ts` に追加:

```ts
  it('print.css は見出し直後と表・図・コードの途中で改ページしない', () => {
    expect(print).toMatch(/break-after:\s*avoid/)
    expect(print).toMatch(/break-inside:\s*avoid/)
  })
```

**print.css**（`@layer rd.base { @media print { … } }` の中、既存の `body` の後に）:

```css
    /* 見出しの直後・表や図やコードの途中で紙を割らない（system/guidelines/motion-and-responsive.md §印刷） */
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      break-after: avoid;
    }

    table,
    figure,
    pre,
    blockquote,
    img,
    tr,
    li {
      break-inside: avoid;
    }
```

`system/guidelines/motion-and-responsive.md` に §印刷 が無ければコメントの参照先を `docs/responsive-and-motion.md` にする（ファイルの中を見て実在する方を書く。どちらも無ければ参照を書かない）。

**Verify**: `bun run lint:css` → exit 0（`break-*` は Baseline Widely available。`stylelint-plugin` の baseline ルールが落としたら **STOP**）。
`bun run test -- --project node system/css` → green。

## Step 4 — VRT の確認

リンクの下線位置が変わるので、story にリンクがあればスクリーンショットが変わる。

```bash
bun run storybook:build
bun run vrt          # Docker。差分が出たら結果の画像を見る
```

- 差分ゼロ → 何もしない
- 差分が **リンクの下線位置だけ** → `bun run vrt:update` で `e2e/__screenshots__` を更新してコミット（差分画像の枚数を報告に書く）
- それ以外の差分 → **STOP** して報告（この plan の変更で起きるはずがない）

## Step 5 — changeset

`.changeset/link-underline-offset-and-print-breaks.md`:

```md
---
'@rimltempest/riml-ds-tokens': minor
'@rimltempest/riml-ds-css': patch
---

- tokens: `type.link.underline-offset`（`--rd-type-link-underline-offset`、0.15em）を追加
- css: `a` の下線を `text-underline-offset` でディセンダーから離した。`print.css` に見出し直後（`break-after: avoid`）と
  表・図・コード・リスト項目の途中（`break-inside: avoid`）で改ページしない指定を足した
```

mcp はテスト追加のみなので changeset 不要。

## Done criteria（全部 exit 0 / 一致）

| コマンド | 期待 |
| --- | --- |
| `bun run check` | exit 0 |
| `bun run test` | 486 + 1 skipped → **490 passed + 1 skipped**（+4: mcp 2、css 2） |
| `bun run gen && bun run design-md && git status --short` | 空 |
| `bash scripts/guard.sh` | exit 0 |
| `bun run release:check` | exit 0 |
| `grep -c rd-type-link-underline-offset system/tokens/dist/tokens.css` | ≥ 1 |
| `grep -c "break-inside" system/css/dist/index.css` | ≥ 1 |
| `bun run vrt` | 全 pass（更新した場合は更新後に再実行して pass） |

## STOP 条件

- Step 1 のテストが main で最初から落ちる（011 の退行）
- `terrazzo check` が `type.link.underline-offset` を拒否する
- stylelint が `break-*` を落とす
- VRT にリンク以外の差分が出る

## 保守メモ

- `bundle.test.ts` は `dist/cli.js` を読むので **build 後にしか通らない**。CI の test-node / agent-surface は build 済み（ci.yml）。
  ローカルで落ちたら `bun run build` を先に
- experimental → stable 昇格で契約サブパスの位置が `./experimental/<name>/contract` → `./<name>/contract` に動く。
  `tools/mcp/src/examples.ts` の import 先を同じ PR で直す（このテストは lit 混入は捕まえるが、パス間違いは
  typecheck / `elements.test.ts` が捕まえる）
- 印刷は VRT の対象外（Playwright は `media: 'print'` で撮っていない）。目視で確認するなら Storybook の任意の story で
  `Cmd+P` のプレビュー
