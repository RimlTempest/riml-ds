# テスト

## 層

| 層                    | ツール                                          | 場所                                  | 実行                   |
| --------------------- | ----------------------------------------------- | ------------------------------------- | ---------------------- |
| 純関数                | Vitest（node project）                          | `**/*.logic.test.ts`、`tools/**/*.test.ts` | pre-push / CI     |
| 実 DOM                | Vitest browser（Playwright Chromium）           | `library/elements/**/*.test.ts`       | CI                     |
| story                 | Storybook addon-vitest + addon-a11y             | `**/*.stories.ts`                     | CI                     |
| 読み上げ              | `@guidepup/virtual-screen-reader`（Vitest browser 内） | `**/*.sr.test.ts`              | CI                     |
| フレームワーク統合    | Playwright                                      | `e2e/<fw>/`                           | CI（affected のみ）    |
| a11y e2e              | Playwright + `@axe-core/playwright`             | `e2e/a11y/`                           | CI                     |
| VRT                   | Playwright `toHaveScreenshot`（Docker）         | `e2e/vrt/`、ベースライン `e2e/__screenshots__/` | CI（affected）|
| HTML                  | markuplint（描画後 DOM）                        | `apps/storybook/` の出力              | CI                     |
| パッケージ            | publint / attw / size-limit / knip / sherif     | 各 package                            | CI（publish 前）       |
| 不変条件              | `scripts/guard.sh`                              | —                                     | CI                     |

Vitest は**ルートの `vitest.config.ts` 1 つ**で `projects` を分ける（`node` / `browser` / `storybook`）。
パッケージごとに config を持たない。

## 書き方

- **先に落ちるテスト**（`riml-ds-tdd`）。部品は `*.logic.test.ts` → `*.logic.ts` → `*.test.ts` → `*.element.ts`。
- 実 DOM テストは `document.createElement('rd-button')` + `await el.updateComplete`。
  `fixture()` ヘルパは `library/elements/test/fixture.ts` に 1 つ。
- テストは日本語の `it('ラベルが無いと :state(unlabeled) になる')`。
- Storybook の interaction test は `play` 関数。`userEvent` でキーボード操作を書く。
- VRT は story の `parameters.vrt: false` で除外できるが、除外には理由コメント必須。

## CI 時間の予算

無料枠（ADR-0011）。目標：PR の CI 合計 **10 分以内**。

- `scripts/affected.sh` で変更パッケージを判定し、VRT と e2e はそこだけ回す。
  `system/tokens` が変わったら全部回す。
- Playwright は Docker イメージ（ブラウザ同梱）。`npx playwright install` を CI で走らせない。
- `bun install` は `~/.bun/install/cache` をキャッシュ。
