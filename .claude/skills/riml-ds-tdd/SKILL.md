---
name: riml-ds-tdd
description: riml-ds のテスト規約。部品・トークン・ツールの実装を書き始める前に読む。必ず失敗するテストから始め（red→green→refactor）、テストの層（純関数 / 実 DOM / story / e2e / VRT）で置き場所とツールを選ぶ。「テストをどこに置くか」「Shadow DOM をどうテストするか」「a11y をどう自動化するか」「VRT が落ちた」「遅い・不安定なテスト」で発火。
---

# riml-ds テスト規約

## 1. red → green → refactor を飛ばさない

1. **red**: 失敗するテストを書く。実行して**期待どおりに失敗すること**を確認する。
2. **green**: 通す最小の実装。
3. **refactor**: 緑のまま構造を直す。ここで初めて抽象を入れる。

バグ修正も同じ。再現するテストを先に書く。「テストなしの実装コミット」は作らない。

部品の順序：`*.logic.test.ts` → `*.logic.ts` → `*.test.ts`（実 DOM） → `*.element.ts` → `*.stories.ts`。
ロジックを先に純関数で固めると、DOM テストは「反映されているか」だけになる。

## 2. 層

| 層            | 依存してよいもの                       | ツール                                  | 場所                          | 目標   |
| ------------- | -------------------------------------- | --------------------------------------- | ----------------------------- | ------ |
| **純関数**    | メモリのみ。時計・`matchMedia` は注入  | Vitest（`node` project）                | `*.logic.test.ts`、`tools/**` | < 50ms |
| **実 DOM**    | Chromium（Playwright）                 | Vitest browser（`browser` project）     | `library/elements/**/*.test.ts` | < 1s |
| **story**     | Storybook のレンダリング + axe         | addon-vitest + addon-a11y               | `*.stories.ts`（`play`）      | < 2s   |
| **読み上げ**  | 仮想スクリーンリーダー                 | `@guidepup/virtual-screen-reader`       | `*.sr.test.ts`（browser）     | < 2s   |
| **e2e**       | フレームワーク別アプリ                 | Playwright                              | `e2e/<fw>/`                   | < 30s  |
| **VRT**       | Docker 固定イメージ                    | Playwright `toHaveScreenshot`           | `e2e/vrt/`                    | —      |

**比率の目安 60 : 25 : 15（純関数 : 実 DOM + story : e2e）。** 実 DOM が増えたら logic に
出せていないサイン。

## 3. 何をテストするか

- **振る舞い**を検証する。`render()` の内部呼び出しや private 状態を見ない。
- 取得は**ロールとアクセシブル名**：`within(el.shadowRoot).getByRole('button', { name: '保存' })`。
  取れないなら a11y のバグ。テストを緩めずマークアップを直す。
- **`Result` の err 枝**、**union のメンバーごと**、**境界値**（空ラベル・最長文言・RTL・
  `disabled` と `loading` の同時指定）。
- 部品ごとに必ず：
  - [ ] ラベル無しで `:state(unlabeled)` と `console.error`
  - [ ] キーボードで操作できる（Enter / Space / Esc）
  - [ ] `delegatesFocus` で `el.focus()` が内部に届く
  - [ ] form-associated なら `form.checkValidity()` / `FormData` に載る / `reset` で戻る
  - [ ] `:state()` が属性・プロパティと同期する
  - [ ] タッチターゲット ≥ 44px（`getBoundingClientRect`）
  - [ ] `prefers-reduced-motion: reduce` で `getAnimations()` が空
- 生成器（`tools/cem`、`tools/design-md`）は**スナップショット**ではなく、入力 CEM → 期待出力の
  フィクスチャで検証する（スナップショットは更新が無思考になる）。

## 4. 実 DOM テストの書き方

```ts
import { fixture } from '../test/fixture.js'
import '../button/define.js'

it('loading のとき aria-busy を出し、フォーカス可能なまま', async () => {
  const el = await fixture<RdButton>(html`<rd-button loading>保存</rd-button>`)
  const btn = within(el.shadowRoot).getByRole('button', { name: '保存' })
  expect(btn).toHaveAttribute('aria-busy', 'true')
  expect(btn).not.toHaveAttribute('disabled')
  expect(el.matches(':state(loading)')).toBe(true)
})
```

- `fixture()` は `library/elements/test/fixture.ts` に 1 つ。`updateComplete` を待って返す。
- `:state()` の検査は `el.matches(':state(x)')`。未対応環境は考えない（Chromium で回す）。
- イベントは `await new Promise(r => el.addEventListener('rd-change', r, { once: true }))` ではなく
  `vi.fn()` を listener にして `toHaveBeenCalledWith(expect.objectContaining({ detail: … }))`。

## 5. story の `play`

```ts
export const Invalid: Story = {
  args: { label: 'メール', required: true },
  play: async ({ canvasElement, step }) => {
    const el = canvasElement.querySelector('rd-text-field')
    await step('空で送信すると :user-invalid', async () => {
      await userEvent.click(within(el.shadowRoot).getByRole('textbox'))
      await userEvent.tab()
      await expect(el.matches(':state(invalid)')).toBe(true)
    })
  },
}
```

a11y 検査は addon-a11y が全 story に自動で当てる。除外は `parameters.a11y.config.rules` に
`reason` 付きで。

## 6. 不安定なテストを作らない

- `sleep` を書かない。`await el.updateComplete`、`expect.poll`、`waitFor`。
- アニメーションは既定で無い（`prefers-reduced-motion` 既定 off）ので待つ必要がない。
  VRT でも `animations: 'disabled'`。
- テストごとに新しい要素を作る。`document.body` に残さない（`fixture` が cleanup を登録）。
- VRT の差分が出たら、**まず意図した変更か**を見る。意図どおりなら `bun run vrt:update`
  （Docker 内）。macOS で撮った画像はコミットしない（guard が落とす）。

flaky は skip せずその日のうちに直す。

## 7. コマンド

```
bun run test                     # node + browser の Vitest
bun run test:storybook           # story（addon-vitest + a11y）
bun run test --project node      # 純関数だけ高速に
bun run a11y                     # e2e axe（AAA）
bun run vrt                      # スクリーンショット比較（Docker）
bun run vrt:update               # ベースライン更新（Docker）
```
