// oxlint-disable import/no-unassigned-import -- CSS は副作用 import が正しい形
/**
 * ブランドの見本（docs/brand.md）。**値は書かない** — `var(--rd-*)` を当てて、
 * 「名前」と「使ってよい場所」だけを並べる。実値の真実源は `system/tokens/src`、
 * 一覧は `Foundations/Tokens`（生成物 `tokens.md`）が持つ。
 *
 * `Qrcc` / `Noter` は `Palette` と同じ描画に `globals.theme` を固定したもの。
 * テーマは `color.palette.*` だけを差し替える（brand.md §10）ので、
 * この 3 つを見比べると「意味は同じで実色だけ変わる」ことが分かる。
 * VRT（light / dark × 360 / 1024）にも載るので、テーマ × スキームの回帰検査でもある。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html, type TemplateResult } from 'lit'
import './brand.css'

type Swatch = {
  /** semantic トークンの CSS 変数名 */
  readonly token: string
  /** 使ってよい場所（brand.md §3 の 1 行） */
  readonly use: string
}

const SWATCHES: readonly Swatch[] = [
  { token: '--rd-color-surface-default', use: '既定の面（紙）' },
  { token: '--rd-color-surface-raised', use: '窓・カード・ダイアログ' },
  { token: '--rd-color-surface-sunken', use: '入力の窪み・リスト見出し' },
  { token: '--rd-color-text-default', use: '本文（インク）。この色以外で本文を書かない' },
  { token: '--rd-color-text-muted', use: '補助の文字' },
  { token: '--rd-color-accent-default', use: '主役の塗り（primary ボタン・選択中）' },
  { token: '--rd-color-accent-hover', use: '主役の hover' },
  { token: '--rd-color-accent-text', use: 'リンクなど accent の文字' },
  {
    token: '--rd-color-brand-primary',
    use: '装飾用のブランド青（髪）。文字を載せない・文字色にしない',
  },
  {
    token: '--rd-color-brand-signature',
    use: '装飾用のブランド赤（印章）。文字を載せない・danger の代わりにしない',
  },
  { token: '--rd-color-chrome-default', use: '窓のタイトルバーの帯' },
  { token: '--rd-color-chrome-text', use: '帯の上の文字' },
  { token: '--rd-color-status-danger-default', use: '失敗・破壊的操作の塗り' },
  { token: '--rd-color-status-warning-default', use: '注意の塗り' },
  { token: '--rd-color-status-success-default', use: '成功の塗り' },
  { token: '--rd-color-status-info-default', use: '情報の塗り' },
  { token: '--rd-color-border-default', use: '既定の境界線' },
  { token: '--rd-color-border-strong', use: '強い境界線・高コントラスト時の境界' },
  { token: '--rd-color-focus-ring', use: 'フォーカスリング（3px / 2px オフセット）' },
]

/** 意味色の一覧。色見本は `::before` の装飾（DOM に置かない）で、名前は `<code>` が読み上げる */
const palette = (): TemplateResult =>
  html`<h1 class="rd-visually-hidden">意味色の見本</h1>
    <dl class="sb-swatches">
      ${SWATCHES.map(
        (row) =>
          html`<dt class="sb-swatch-name" style="--rd-sb-swatch: var(${row.token})">
              <code>${row.token}</code>
            </dt>
            <dd class="sb-swatch-use">${row.use}</dd>`,
      )}
    </dl>`

const meta: Meta = {
  title: 'Foundations/Brand',
  render: palette,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj

export const Palette: Story = {}

/** 見出しは display スタック（丸ゴシック系。入っていなければシステム UI に落ちる。brand.md §6） */
export const Type: Story = {
  render: () =>
    html`<div class="sb-type">
      <h1>見出し 1（type.heading.1）</h1>
      <h2>見出し 2（type.heading.2）。窓のタイトルもこれ</h2>
      <p>本文（type.body）。1rem / 1.6 のシステムスタックで、常に「インク on 紙」で読む。</p>
      <p><small>補助の文字（type.small）。注記や単位に使う。</small></p>
      <p><code>--rd-type-mono</code> は等幅（type.mono）。コードとトークン名に使う。</p>
    </div>`,
}

/** 角丸 4 段と硬い影 2 段（brand.md §4 / §5）。影はぼかし 0 で右下に落ちる */
export const ShapeAndShadow: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">形と影の見本</h1>
      <ul class="sb-shapes">
        <li class="sb-shape-sm"><code>radius.sm</code></li>
        <li class="sb-shape-md"><code>radius.md</code></li>
        <li class="sb-shape-lg"><code>radius.lg</code></li>
        <li class="sb-shape-full"><code>radius.full</code></li>
      </ul>
      <ul class="sb-shapes sb-shadows">
        <li class="sb-shape-raised"><code>shadow.raised</code></li>
        <li class="sb-shape-overlay"><code>shadow.overlay</code></li>
      </ul>`,
}

/** qrcc テーマ。意味と名前は同じで、`color.palette.*` だけが差し替わる */
export const Qrcc: Story = { globals: { theme: 'qrcc' } }

/** noter テーマ（旧既定の青緑）。同上 */
export const Noter: Story = { globals: { theme: 'noter' } }
