/**
 * 文字の見本（docs/brand.md §6、system/guidelines/typography.md）。
 * `typography.css` が出すのは**見た目のクラス**で、見出しレベル（`h1`..`h6`）とは独立している。
 * だから見本は `<p class="rd-heading-2">` のように「構造を持たない要素」に当てて並べる
 * （見出しの階層を崩さずに大きさだけを見せるため）。
 *
 * 素の `h1`..`h6` は `base.css` の責務なので、この story では触らない。
 * サンプル文はすべて自作（参考画面の文言は持ち込まない）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html, type TemplateResult } from 'lit'

/** 和文と欧文と数字が 1 行に混ざる見本。字面の噛み合わせはここで見る */
const SAMPLE = 'まどの向こうに雨。Windows of rain, 12 の灯り。'

const LONG =
  'まどの向こうで雨が降っている。ひとつ、またひとつと灯りがつき、'
  + '濡れた道が光を返す。読み終える前に切れてしまう行を、どこで畳むかを決めるのが組版の仕事だ。'

const scale = (): TemplateResult =>
  html`<h1 class="rd-visually-hidden">文字の大きさの見本</h1>
    <div class="rd-stack">
      <p class="rd-display">まどの光</p>
      <p class="rd-heading-1">見出し 1 — ページに 1 つ</p>
      <p class="rd-heading-2">見出し 2 — 節のはじまり</p>
      <p class="rd-heading-3">見出し 3 — 小節のはじまり</p>
      <p class="rd-heading-4">見出し 4 — 窓やカードの中</p>
      <p class="rd-body">本文（rd-body）。${SAMPLE}</p>
      <p class="rd-small">補助（rd-small）。${SAMPLE}</p>
      <p class="rd-label">ラベル（rd-label）</p>
      <p class="rd-caption">CAPTION 2026-09-08 12 GB</p>
      <p class="rd-mono">rd-mono 0123456789 --rd-type-mono</p>
    </div>`

const meta: Meta = {
  title: 'Foundations/Typography',
  render: scale,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj

/** display から caption まで。`display` は 1 画面に 1 つだけ置く */
export const Scale: Story = {}

/**
 * 流し込み本文の入れ物。CMS や Markdown の出力をそのまま包む。
 * 中の要素セレクタは `:where()` なので詳細度 0 ＝ 利用側のクラスが必ず勝つ。
 */
export const Prose: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">流し込み本文の見本</h1>
      <article class="rd-prose">
        <h2>雨の日の窓</h2>
        <p>${LONG}</p>
        <h3>決めること</h3>
        <ul>
          <li>行長は <code>--rd-sizing-measure-max</code>（80ch）で止める</li>
          <li>見出しの直後だけ間を詰める</li>
          <li>区切りは点線</li>
        </ul>
        <blockquote>引用は点線の縦線と補助色で、本文と地の色を変えずに区別する。</blockquote>
        <pre><code>.rd-prose :where(h2) {
  font: var(--rd-type-heading-2);
}</code></pre>
        <hr />
        <p>詳しくは<a href="#sb-typography-prose">この節</a>を見る。</p>
        <table id="sb-typography-prose">
          <caption>
            クラスと役割
          </caption>
          <thead>
            <tr>
              <th scope="col">クラス</th>
              <th scope="col">役割</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row"><code>.rd-display</code></th>
              <td>ヒーロー。1 画面に 1 つ</td>
            </tr>
            <tr>
              <th scope="row"><code>.rd-caption</code></th>
              <td>補助文。字間を広げる短い語だけ</td>
            </tr>
          </tbody>
        </table>
      </article>`,
}

/** 省略と桁揃え。行数は `--rd-clamp-lines`（既定 3） */
export const Utilities: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">省略と桁揃えの見本</h1>
      <div class="rd-stack">
        <p class="rd-label">1 行で切る（rd-truncate）</p>
        <p class="rd-truncate" style="max-inline-size: 24ch">${LONG}</p>
        <p class="rd-label">2 行で切る（rd-clamp + --rd-clamp-lines）</p>
        <p class="rd-clamp" style="--rd-clamp-lines: 2; max-inline-size: 24ch">${LONG}</p>
        <p class="rd-label">桁を揃える（rd-numeric）</p>
        <p class="rd-numeric">1,204 ／ 88 ／ 30,911</p>
        <p>1,204 ／ 88 ／ 30,911（tabular-nums 無し）</p>
      </div>`,
}

export const Dark: Story = { globals: { scheme: 'dark' } }

export const Dense: Story = { globals: { density: 'compact' } }

export const RTL: Story = { globals: { dir: 'rtl' } }

export const ForcedColors: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Playwright の `forcedColors: "active"` でだけ検証する（`e2e/vrt/forced.spec.ts`）。'
          + 'CSS のメディア特性はページの JS から切り替えられないので、Storybook 上では見た目が変わらない。',
      },
    },
  },
}
