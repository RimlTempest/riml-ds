# @rimltempest/riml-ds-lint

riml-ds の共有 lint 設定。oxlint の JS プラグイン（`riml-ds/*`）、stylelint 設定、
browserslist を配る。利用側は次のように読み込む。

```jsonc
// .oxlintrc.json
{ "jsPlugins": ["@rimltempest/riml-ds-lint/oxlint-plugin"] }
```

```js
// stylelint.config.js
export { default } from '@rimltempest/riml-ds-lint/stylelint'
```

## oxlint プラグイン `riml-ds/*`

| ルール                       | 何を落とすか                                         | 根拠                                      |
| ---------------------------- | ---------------------------------------------------- | ----------------------------------------- |
| `riml-ds/no-class`           | `class`。ただし `*.element.ts` は免除                | ADR-0005（Custom Elements は class 必須） |
| `riml-ds/no-type-assertion`  | `as`（`as const` は許可）、`<T>x`、`!`               | ADR-0006 / `riml-ds-typescript`           |
| `riml-ds/no-enum`            | `enum`。`as const` オブジェクト + 値のユニオンを使う | ADR-0006 / `riml-ds-typescript`           |
| `riml-ds/no-throw-in-domain` | ドメイン層の `throw`。失敗は `Result<T, E>` で返す   | `riml-ds-typescript` §3                   |

`no-throw-in-domain` はルート `.oxlintrc.json` の `overrides` が指すパス
（`library/elements/src/**/*.logic.ts`、`system/tokens/src/**/*.ts`、`tools/*/src/core/**/*.ts`）
でだけ有効。

`no-class` の免除は **ファイル名**（`.element.ts`）だけで判定する。ディレクトリでは判定しない。
新しい種類の class が要るなら、まず ADR を起こし、`oxlint-plugin/index.js` と
`scripts/guard.sh` の両方を直す。

## stylelint

ADR-0004（プレーン CSS + `@layer` + Baseline）を機械的に強制する。

- `scale-unlimited/declaration-strict-value` — 色・寸法・字・影・時間・角丸の**生値を禁止**し、
  `var(--rd-*)` だけを通す。ルール名の接頭辞 `scale-unlimited/` は
  `stylelint-declaration-strict-value` が登録する名前で、`riml-ds/` ではない。
- `property-disallowed-list` — 物理プロパティ（`margin-left` など）を禁止し論理プロパティに寄せる。
  `width` / `height` も禁止（`inline-size` / `block-size`）。
- `custom-property-pattern` — CSS 変数は `--rd-` で始める。
- `overrides` の `customSyntax: 'postcss-lit'` で `*.styles.ts` の `` css`…` `` の中も検査する。
- 強制配色モード（`@media (forced-colors: active)`）ではシステム色（`ButtonText` など）を許可する。

`ignoreValues` を緩めるときは `test/stylelint-config.test.ts` に「通る」ケースを 1 つ足し、
緩めた理由をコミット本文に書く。

## browserslist

`baseline widely available`（ADR-0004）。ビルドツールと stylelint が読む。

## 無効化の手順

ルールを無効化するコメント（`// oxlint-disable-next-line …`、`/* stylelint-disable … */`）は
**理由を同じ行かひとつ上の行に書く**。PR ではその理由をレビューする。恒久的に緩めるなら
ADR を起こし、この README とテストを同時に直す。

## テスト

`tools/lint/test/` は oxlint / stylelint を**設定込みで実際に走らせて**出力を検査する
（ルール実装の単体テストより、設定の壊れに気づける）。`bun run test` で回る。

`test/fixtures/**` は意図的に規約を破る検体なので、既定の実行からは外している
（`package.json` の `lint` / `lint:fix` と `lefthook.yml` の oxlint ジョブに
`--ignore-pattern 'tools/lint/test/fixtures/**'`、`tools/lint/tsconfig.json` の `exclude`）。
テストだけが `.oxlintrc.json` を渡して明示的に検査する。fixture は
`.oxlintrc.json` の `overrides` で「test の緩和」を打ち消してあるので、
実ソースと同じ厳しさで判定される。
