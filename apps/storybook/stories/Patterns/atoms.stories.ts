/**
 * `atoms.css` の見本（plan 018）。JS が要らないので部品にしない（ADR-0012 §6）——
 * `@rimltempest/riml-ds-css` の `atoms.css` が出すクラスを、想定どおりのマークアップで並べる。
 *
 * ここが「契約が守られているか」を見る面でもある: `aria-label` の無いアイコンボタン、
 * ラベル文字の無い凡例、`aria-hidden` の付いていない装飾は、addon-a11y（AAA）が落とす。
 * a11y の除外は 1 つも置いていない。
 *
 * 窓（`.rd-window`）と組み合わせた合成は 017 のレーンが帯を作り替えている最中なので、
 * このファイルでは使わない（合成 story は 017 マージ後に足す）。
 * アイコンはすべて自作の幾何（丸・線・四角）で、絵は持ち込まない。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html, type TemplateResult } from 'lit'

/** 見本用の「写真」。自作の幾何だけで描いた人影の代わり */
const PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">'
    + '<rect width="40" height="40" fill="rgb(150 152 160)"/>'
    + '<circle cx="20" cy="15" r="7" fill="rgb(232 232 236)"/>'
    + '<circle cx="20" cy="40" r="14" fill="rgb(232 232 236)"/>'
    + '</svg>',
)}`

const svg = (body: TemplateResult): TemplateResult =>
  html`<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    aria-hidden="true"
  >
    ${body}
  </svg>`

const circleIcon = (): TemplateResult => svg(html`<circle cx="12" cy="12" r="7" />`)
const squareIcon = (): TemplateResult =>
  svg(html`<rect x="5" y="5" width="14" height="14" rx="3" />`)
const linesIcon = (): TemplateResult => svg(html`<path d="M5 8h14M5 12h14M5 16h14" />`)
const plusIcon = (): TemplateResult => svg(html`<path d="M12 5v14M5 12h14" />`)
const crossIcon = (): TemplateResult => svg(html`<path d="M6 6l12 12M18 6L6 18" />`)

/** 見本の入口。バッジの 6 通り */
const badges = (): TemplateResult =>
  html`<h1 class="rd-visually-hidden">バッジの見本</h1>
    <div class="rd-cluster">
      <span class="rd-badge">下書き</span>
      <span class="rd-badge" data-tone="accent">選択中</span>
      <span class="rd-badge" data-tone="success">同期済み</span>
      <span class="rd-badge" data-tone="warning">残り 2 GB</span>
      <span class="rd-badge" data-tone="danger">失敗 3 件</span>
      <span class="rd-badge" data-tone="info">ベータ</span>
    </div>`

const meta: Meta = {
  title: 'Patterns/Atoms',
  render: badges,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj

/** 色は補助。意味は必ず語が持つ（「成功」を緑だけで伝えない） */
export const Badge: Story = {}

/** 点は装飾。件数と意味は `aria-label` が読み上げる */
export const Dot: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">通知の点の見本</h1>
      <div class="rd-cluster">
        <button type="button" class="rd-icon-button rd-has-dot" aria-label="通知（3 件）">
          ${circleIcon()}
          <span class="rd-dot" aria-hidden="true"></span>
        </button>
        <p>点だけでは件数が伝わらないので、名前に「3 件」を入れる。</p>
      </div>`,
}

/** 写真は `alt=""`（名前は隣の文字が持つ）、頭文字は装飾なので `aria-hidden` */
export const Avatar: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">アバターの見本</h1>
      <div class="rd-stack">
        <div class="rd-cluster">
          <span class="rd-avatar"><img src=${PHOTO} alt="" /></span>
          <span class="rd-avatar" aria-hidden="true">RT</span>
          <span class="rd-avatar" aria-hidden="true" style="--rd-avatar-size: 4rem">RT</span>
        </div>
        <p>
          <span class="rd-avatar-group">
            <span class="rd-avatar"><img src=${PHOTO} alt="" /></span>
            <span class="rd-avatar" aria-hidden="true">AK</span>
            <span class="rd-avatar" aria-hidden="true">MY</span>
          </span>
          りむる、あきら、みゆ の 3 人が編集中
        </p>
      </div>`,
}

/** 点線の区切り。縦線は `role="separator"` と `aria-orientation` を書く */
export const Separator: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">区切りの見本</h1>
      <div class="rd-stack">
        <p>上の段。</p>
        <hr class="rd-separator" />
        <p>下の段。面の切り替えで区切れるときは線を引かない。</p>
        <div class="rd-cluster">
          <span>左</span>
          <span class="rd-separator" role="separator" aria-orientation="vertical"></span>
          <span>右</span>
        </div>
      </div>`,
}

/** 骨組みは読み上げに出さず、親の `aria-busy` が「読み込み中」を伝える */
export const Skeleton: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">読み込み中の骨組みの見本</h1>
      <div class="rd-stack" aria-busy="true">
        <div class="rd-cluster">
          <div class="rd-skeleton" data-shape="circle" aria-hidden="true"></div>
          <div class="rd-skeleton" aria-hidden="true" style="--rd-skeleton-width: 18ch"></div>
        </div>
        <div class="rd-skeleton" aria-hidden="true" style="--rd-skeleton-width: 28ch"></div>
        <div class="rd-skeleton" data-shape="block" aria-hidden="true"></div>
      </div>`,
}

/** 押すキーそのものを書く。「+」は文字で並べる */
export const Kbd: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">キーキャップの見本</h1>
      <p>
        <kbd class="rd-kbd">⌘</kbd> + <kbd class="rd-kbd">K</kbd> で検索、
        <kbd class="rd-kbd">Esc</kbd> で閉じる。
      </p>`,
}

/** 押せるタイルは `a` / `button` にして名前を付ける。塗りは変えず輪郭で応える */
export const Tile: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">タイルの見本</h1>
      <div class="rd-cluster">
        <span class="rd-tile" aria-hidden="true">${circleIcon()}</span>
        <span class="rd-tile" data-tone="accent" aria-hidden="true">${squareIcon()}</span>
        <a class="rd-tile" href="#sb-atoms-tile" aria-label="設定を開く">${linesIcon()}</a>
        <span class="rd-tile" aria-hidden="true" style="--rd-tile-size: 4rem"> ${plusIcon()} </span>
      </div>
      <p id="sb-atoms-tile">
        タイルは入れ物。中の絵は装飾なので <code>aria-hidden</code> を付ける。
      </p>`,
}

/** `aria-label` が無いと、何をするボタンか読み上げに出ない */
export const IconButton: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">アイコンボタンの見本</h1>
      <div class="rd-cluster">
        <button type="button" class="rd-icon-button" aria-label="追加する">${plusIcon()}</button>
        <button type="button" class="rd-icon-button" aria-label="一覧を開く">${linesIcon()}</button>
        <button type="button" class="rd-icon-button" aria-label="閉じる">${crossIcon()}</button>
      </div>`,
}

/** `role="toolbar"` と名前は利用側が付ける（並べただけの入れ物にも使えるように） */
export const Toolbar: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">ツールバーの見本</h1>
      <div class="rd-toolbar" data-position="top" role="toolbar" aria-label="書式">
        <button type="button" class="rd-icon-button" aria-label="追加する">${plusIcon()}</button>
        <button type="button" class="rd-icon-button" aria-label="一覧を開く">${linesIcon()}</button>
        <span class="rd-separator" role="separator" aria-orientation="vertical"></span>
        <button type="button" class="rd-icon-button" aria-label="閉じる">${crossIcon()}</button>
      </div>
      <p>帯の位置は <code>data-position="top"</code> で上下が入れ替わる。</p>`,
}

/** 選ばれている行は `aria-current` が持つ。沈んだ色は補助でしかない */
export const List: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">一覧の見本</h1>
      <ul class="rd-list">
        <li class="rd-list-row" aria-current="true">
          <span class="rd-avatar" aria-hidden="true">RT</span>
          <span>りむる（選択中）</span>
          <span class="rd-list-meta">3 分前</span>
        </li>
        <li class="rd-list-row">
          <span class="rd-avatar" aria-hidden="true">AK</span>
          <span>あきら</span>
          <span class="rd-list-meta">1 時間前</span>
        </li>
        <li class="rd-list-row">
          <span class="rd-avatar" aria-hidden="true">MY</span>
          <span>みゆ</span>
          <span class="rd-list-meta">昨日</span>
        </li>
      </ul>`,
}

/** 表題は `caption`、見出しセルは `scope`。数の列は `data-numeric` で桁を揃えて行末へ */
export const Table: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">表の見本</h1>
      <div class="rd-table-scroll">
        <table class="rd-table">
          <caption>
            種類ごとの使用量
          </caption>
          <thead>
            <tr>
              <th scope="col">種類</th>
              <th scope="col">最終更新</th>
              <th scope="col" data-numeric>容量</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">写真</th>
              <td>3 分前</td>
              <td data-numeric>12.4 GB</td>
            </tr>
            <tr>
              <th scope="row">動画</th>
              <td>1 時間前</td>
              <td data-numeric>8.0 GB</td>
            </tr>
            <tr>
              <th scope="row">書類</th>
              <td>昨日</td>
              <td data-numeric>0.9 GB</td>
            </tr>
          </tbody>
        </table>
      </div>`,
}

/** `role` は利用側が決める。手を止めさせたいときだけ `role="alert"` */
export const Alert: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">注意書きの見本</h1>
      <div class="rd-stack">
        <div class="rd-alert" role="status">
          <span class="rd-alert-icon" aria-hidden="true">${circleIcon()}</span>
          <div>
            <p class="rd-alert-title">同期は 3 分前に終わった</p>
            <p>次の同期は 1 時間後。</p>
          </div>
        </div>
        <div class="rd-alert" data-tone="success" role="status">
          <span class="rd-alert-icon" aria-hidden="true">${circleIcon()}</span>
          <div>
            <p class="rd-alert-title">バックアップが終わった</p>
            <p>12.4 GB を保存した。</p>
          </div>
        </div>
        <div class="rd-alert" data-tone="warning" role="status">
          <span class="rd-alert-icon" aria-hidden="true">${squareIcon()}</span>
          <div>
            <p class="rd-alert-title">残り 2 GB</p>
            <p>いらない動画を消すと空きが増える。</p>
          </div>
        </div>
        <div class="rd-alert" data-tone="danger">
          <span class="rd-alert-icon" aria-hidden="true">${crossIcon()}</span>
          <div>
            <p class="rd-alert-title">保存できなかった</p>
            <p>接続を確かめて、もう一度試す。</p>
          </div>
        </div>
      </div>`,
}

/** 色だけでは伝わらないので、項目には必ずラベル文字を書く */
export const Legend: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">凡例の見本</h1>
      <ul class="rd-legend">
        <li class="rd-legend-item" data-series="1">写真 12.4 GB</li>
        <li class="rd-legend-item" data-series="2">動画 8.0 GB</li>
        <li class="rd-legend-item" data-series="3">書類 0.9 GB</li>
        <li class="rd-legend-item" data-series="4">空き 2.7 GB</li>
      </ul>`,
}

/** 一覧・ツールバー・凡例・注意書きを 1 画面に置いたところ */
export const Composition: Story = {
  render: () =>
    html`<div class="rd-stack">
      <h1 class="rd-heading-2">バックアップ</h1>
      <p class="rd-caption">2026-09-08 12:04 更新</p>
      <div class="rd-alert" data-tone="warning" role="status">
        <span class="rd-alert-icon" aria-hidden="true">${squareIcon()}</span>
        <div>
          <p class="rd-alert-title">残り 2.7 GB</p>
          <p>このままだと次の同期で足りなくなる。</p>
        </div>
      </div>
      <ul class="rd-legend">
        <li class="rd-legend-item" data-series="1">写真 12.4 GB</li>
        <li class="rd-legend-item" data-series="2">動画 8.0 GB</li>
        <li class="rd-legend-item" data-series="3">書類 0.9 GB</li>
        <li class="rd-legend-item" data-series="4">空き 2.7 GB</li>
      </ul>
      <ul class="rd-list">
        <li class="rd-list-row" aria-current="true">
          <span class="rd-avatar" aria-hidden="true">RT</span>
          <span>りむる（選択中）<span class="rd-badge" data-tone="success">同期済み</span></span>
          <span class="rd-list-meta">3 分前</span>
        </li>
        <li class="rd-list-row">
          <span class="rd-avatar" aria-hidden="true">AK</span>
          <span>あきら <span class="rd-badge" data-tone="danger">失敗 1 件</span></span>
          <span class="rd-list-meta">1 時間前</span>
        </li>
      </ul>
      <div class="rd-toolbar" role="toolbar" aria-label="バックアップの操作">
        <button type="button" class="rd-icon-button" aria-label="追加する">${plusIcon()}</button>
        <button type="button" class="rd-icon-button rd-has-dot" aria-label="通知（3 件）">
          ${circleIcon()}
          <span class="rd-dot" aria-hidden="true"></span>
        </button>
        <span class="rd-separator" role="separator" aria-orientation="vertical"></span>
        <button type="button" class="rd-icon-button" aria-label="閉じる">${crossIcon()}</button>
      </div>
    </div>`,
}

export const Dark: Story = { ...Composition, globals: { scheme: 'dark' } }

export const RTL: Story = { ...Composition, globals: { dir: 'rtl' } }

export const ForcedColors: Story = {
  ...Composition,
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

export const ReducedMotion: Story = {
  ...Skeleton,
  parameters: {
    docs: {
      description: {
        story:
          'Playwright の `reducedMotion: "reduce"` でだけ検証する（`e2e/vrt/reduced.spec.ts`）。'
          + '`.rd-skeleton` の明滅が止まる。Storybook 上では見た目が変わらない。',
      },
    },
  },
}
