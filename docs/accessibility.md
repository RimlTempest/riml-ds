# アクセシビリティ

基準と部品の必須事項は [system/guidelines/accessibility.md](../system/guidelines/accessibility.md)。
この文書は**検査の配線**。

## 自動検査

| コマンド                        | 対象                                   | 基準                                        |
| ------------------------------- | -------------------------------------- | ------------------------------------------- |
| `bun run --filter @rimltempest/riml-ds-tokens check` | トークンの色の対                  | AAA 7:1 / 非テキスト 3:1                    |
| `bun run test:storybook`        | 全 story（addon-vitest + addon-a11y）  | axe タグ `wcag2a wcag2aa wcag2aaa wcag21a wcag21aa wcag22aa best-practice`、`test: 'error'` |
| `bun run test`（elements）      | 実 DOM の振る舞い、virtual screen reader | 読み上げ順・名前・状態                    |
| `bun run a11y`                  | e2e（Playwright + `@axe-core/playwright`）| フレームワーク別アプリで同じタグ         |
| `bun run lint:html`             | story 描画結果の HTML（markuplint）    | ラベル・見出し・ランドマーク               |

## 例外

`docs/accessibility-exceptions.md`（無ければ例外ゼロ）。行の形：

```
| rd-xxx | color-contrast-enhanced | 無効状態の文字色は 4.5:1（AA）。aria-disabled で理由を示す | 2027-03 まで |
```

CI の `guard` は例外の行数が部品数を超えたら落とす。

## 手動確認

リリース（minor 以上）ごとに [guidelines のチェックリスト](../system/guidelines/accessibility.md#検査の層)
を一巡し、`CHANGELOG` に「手動確認: VoiceOver 18 / NVDA 2026.1」の形で残す。
