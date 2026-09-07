# @rimltempest/riml-ds-storybook

riml-ds の**唯一のショーケース**（ADR-0007）。story = テストケース = ドキュメント =
エージェントの参照面。React / Vue / Svelte 版の Storybook は作らない。

## 動かす

```bash
bun run storybook          # http://localhost:6006（--no-open）
bun run storybook:build    # apps/storybook/storybook-static/
bun run test -- --project storybook   # 全 story を Playwright Chromium で実行（axe AAA 込み）
```

`@rd-argtypes`（CEM から生成した `argTypes`）は `bun run gen` が作る。
`bun install` の postinstall でも作られるので、通常は意識しなくてよい。

## story を足す

story は部品の隣（`library/elements/src/<name>/<name>.stories.ts`）に置く。
Foundations（トークン・レイヤー・スキップリンク）だけ `stories/Foundations/` に置く。

最低 8 種：`Default`、`Variants`、`Disabled`、`Invalid` / `Loading`（該当時）、
`Dark`、`Dense`、`RTL`、`ForcedColors`、`ReducedMotion`
（`.claude/skills/riml-ds-element/SKILL.md` §5）。

- **ティア A/B は `markup()` から描く**（ADR-0012 §5）。HTML を手書きしない。
  `unsafeHTML(buttonMarkup(args))` の形。`markup()` の出力は自分のコードがエスケープ済みなので
  story に限って `unsafeHTML` に渡してよい（利用側に勧める書き方ではない）。
- `argTypes` は `import { argTypes } from '@rd-argtypes'` を spread する。手で書かない。
- `define` と `<name>.css` は **story が** import する（`preview.ts` では読まない）。
  dist と src の両方を読み込むと `customElements.define` が二重になって落ちる。
- shadow 内を見たいとき（ティア B/C）は `import { queryShadow } from '@rd-shadow'`。`!` は使わない。
- **`Escape` などブラウザ内蔵の動作は `play` では再現できない**（合成イベントは信頼済みでない）。
  そういう導線は `e2e/a11y/keyboard.spec.ts` に書く。

## モード（globals）

`.storybook/modes.ts` の decorator が `document.documentElement` に当てる。

| global     | 効き方                                |
| ---------- | ------------------------------------- |
| `scheme`   | `style="color-scheme: light \| dark"` |
| `density`  | `[data-density="compact"]`            |
| `dir`      | `dir="ltr" \| "rtl"`                  |
| `contrast` | **効かない**（下記）                  |
| `motion`   | **効かない**（下記）                  |

`prefers-contrast` / `prefers-reduced-motion` / `forced-colors` は CSS のメディア特性で、
ページの JS からは切り替えられない。だから `ForcedColors` / `ReducedMotion` story は
**Playwright のエミュレーション**（`e2e/vrt/forced.spec.ts` / `reduced.spec.ts`）でだけ検証する。
Storybook 上では見た目が変わらないので、各 story の `docs.description.story` にそう書く。

story は decorator が `<main>` で包む。自分でランドマークを持つ story は
`parameters.landmark: false` を付ける。

## a11y

`preview.ts` の `parameters.a11y = { test: 'error', ... }` が axe を
`wcag2a wcag2aa wcag2aaa wcag21a wcag21aa wcag22aa best-practice` で回す。
違反は `bun run test -- --project storybook` を落とす。

**除外は書かない。** どうしても要るときは理由を必ず添える：

```ts
parameters: {
  a11y: {
    config: {
      rules: [{ id: 'color-contrast-enhanced', reason: '…なぜ直せないのか…' }],
    },
  },
}
```

`scripts/guard.sh` が「理由なしの除外」と「除外の合計 > 部品数」を落とす（ADR-0007 §影響）。
除外を増やすくらいなら部品を直す。

## VRT（スクリーンショット）

ベースラインは `e2e/__screenshots__/<project>/<story-id>.png`（ADR-0007 決定 4、docs/testing.md）。
**更新は Docker の中でだけ**行う（ADR-0007 §影響）。macOS で撮った画像はフォントと
サブピクセル描画が違うのでコミットしない。ホストから `playwright test --update-snapshots` を
直接叩ける npm script は用意していない。

```bash
bun run vrt          # ライト/ダーク × 360/1024 + forced-colors + reduced-motion
bun run vrt:update   # ベースライン更新（docker run の中）
bun run a11y         # axe + キーボード導線
bun run pe           # JS 無し検証（ADR-0012 §7）
```

VRT から外したい story には **タグ `no-vrt`** を付け、なぜ外すかを同じ行のコメントに書く
（`index.json` に `parameters` は載らないのでタグで判定する）。

## 描画後 HTML の markuplint

```bash
bun run render      # storybook-static → apps/storybook/rendered/*.html
bun run lint:html   # tools/markuplint（描画後 DOM を検査）
```

`getHTML({ serializableShadowRoots: true })` で shadow root を
`<template shadowrootmode>` として書き出す。**shadow を `serializable: true` で attach していない
部品は中身が出ない**ので、新しいティア C 部品には
`static shadowRootOptions = { ...LitElement.shadowRootOptions, serializable: true }` を付ける。

### `.markuplintrc.json` の例外 2 つ（shadow DOM を平坦化したため）

描画後 HTML は、本来スコープが分かれている shadow root を **1 つの文書に平坦化**したもの。
markuplint はその境界を知らないので、平坦化そのものが原因の偽陽性が 2 種類出る。
どちらも実 DOM では起きない。**部品の側を直して消せる違反ではない**ので、設定で外している。

| 例外                                                            | なぜ要るか                                                                                                                                                                       |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `invalid-attr.allowAttrs` に `part` / `exportparts`             | どちらも CSS Shadow Parts が定める**グローバル属性**だが、markuplint の HTML spec がまだ持っていない。ティア A の強化ノード（`<p part="error">`）と `rd-dialog` の shadow に出る |
| `nodeRules: template[shadowrootmode] * → id-duplication: false` | shadow root の中の `id` は shadow ごとにスコープされる。`rd-dialog` を 2 つ置いた story では `id="rd-dialog-label"` が 2 回出るが、実 DOM では重複していない                     |

`id-duplication` は `<template shadowrootmode>` の**中だけ**外している。light DOM の
`id` 重複（`<label for>` が壊れる本物のバグ）は今までどおり落ちる。

## MCP（開発時）

`bun run storybook` を起こすと `http://localhost:6006/mcp` が生える（`@storybook/addon-mcp`）。
リポジトリ root の `.mcp.json` に登録済みなので、エージェントは story 一覧・docs・
`run-story-tests` を自分で引ける（ADR-0010、docs/agent-integration.md）。
MCP はサーバが起きているときだけ使える。
