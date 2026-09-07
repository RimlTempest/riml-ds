# `@rimltempest/riml-ds-tokens`

riml-ds のデザイントークン。正は `src/**/*.tokens.json`（DTCG 2025.10）、ビルドは Terrazzo。
書き方・命名・変更手順は [docs/tokens.md](../../docs/tokens.md) と
[ADR-0003](../../docs/adr/0003-tokens-dtcg-terrazzo.md) にある（ここでは繰り返さない）。

## 入れる

```bash
bun add @rimltempest/riml-ds-tokens
```

```ts
import '@rimltempest/riml-ds-tokens/tokens.css'
```

`tokens.css` は `@layer rd.tokens` に入る。アプリ側のレイヤ順より先に宣言しておくと、
利用側の CSS が常に勝つ。

## モードの切替

| モード          | 切替                                             |
| --------------- | ------------------------------------------------ |
| ライト / ダーク | `color-scheme`。既定は `light dark`（OS に追従） |
| 高コントラスト  | `prefers-contrast: more`（自動）                 |
| 密度            | `[data-density="compact"]` を付けた要素以下      |

```html
<html style="color-scheme: dark"></html>
```

```js
document.documentElement.style.colorScheme = 'dark'
```

`[data-theme]` は使わない。色は 1 変数 = 1 `light-dark()` に畳んである。

## TypeScript から使う

```ts
import { tokens, cssVar } from '@rimltempest/riml-ds-tokens'

element.style.color = tokens.color.text.default // "var(--rd-color-text-default)"
element.style.padding = cssVar('space.4')
```

配るのは**値ではなく変数参照**。値が要る用途（canvas 描画など）は `tokens.json` を読む。

## ブランドテーマ

```ts
import '@rimltempest/riml-ds-tokens/tokens.css'
import '@rimltempest/riml-ds-tokens/themes/qrcc.css'
```

`themes/*.css` は既定値との差分だけを持つ。移行のためだけに存在する
（[docs/migration.md](../../docs/migration.md)）。qrcc は実色が入っている。noter は
まだ riml-ds と同値のプレースホルダ。

**テーマが上書きできるのは `color.palette.*` だけ。** semantic と `modes/*` は palette を
参照しているので、palette を差し替えればライト・ダーク・高コントラストが一緒に追随する。
semantic を直接上書きするテーマはモードの組み合わせごとに値を持つことになり保守できない
（`test/invariants.test.ts` が固定している）。

テーマはライトとダークの両方で解決され、両者が違えば `themes/*.css` の 1 変数が
`light-dark()` に畳まれる。新しいブランドを足すときは 5 か所を 1 PR で:
`src/themes/<brand>/color.tokens.json`・`src/riml-ds.resolver.json` の `theme.contexts`・
`terrazzo.config.ts` の permutation 2 件（light / dark）・`scripts/postbuild.ts` の `modes` 2 件・
`test/tokens-json.ts` の `MODES`。

## 生成物

| ファイル            | 中身                                                           |
| ------------------- | -------------------------------------------------------------- |
| `dist/tokens.css`   | `@layer rd.tokens`。`light-dark()` + `prefers-contrast` + 密度 |
| `dist/themes/*.css` | ブランド差分                                                   |
| `dist/tokens.js`    | `var(--rd-…)` のリテラル                                       |
| `dist/tokens.d.ts`  | `TokenPath` と `tokens` の型                                   |
| `dist/tokens.json`  | 解決済み DTCG。モード差分は `$extensions["riml-ds"].modes`     |
| `dist/tokens.md`    | 一覧表（Storybook Docs 用）                                    |

## コントラストの検査は 2 段

`terrazzo check` の `a11y/min-contrast`（AAA・7:1）は**既定のモード（light）にしか走らない**。
ダーク・高コントラストは `test/contrast.test.ts` が `dist/tokens.json` を読んで固定する
（非テキストの 3:1 も同じテストが見る。Terrazzo の AAA lint では表せないため）。

```bash
bun run --filter @rimltempest/riml-ds-tokens check   # DTCG / 命名 / 重複 / description / AAA
bun run --filter @rimltempest/riml-ds-tokens build   # dist/*
bun run test                                          # コントラスト・不変条件・変換の純関数
bun run design-md                                     # DESIGN.md のフロントマターを作り直す
```

## `postbuild.ts` は暫定

Terrazzo は `light-dark()` を直接出せないので、`scripts/postbuild.ts` が
`:root` と `@media (prefers-color-scheme: dark)` を畳んでいる。`clamp()`（流動タイポグラフィ）も
DTCG に表現が無いため `$extensions["riml-ds"].fluid` から合成している。
どちらも標準側が追いついたら消せる。受け入れテストは `test/postbuild-core.test.ts`。
