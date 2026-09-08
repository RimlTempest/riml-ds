// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * `navigation.css` の見本（plan 026）。移動のための形は JS が要らないので部品にしない
 * （ADR-0012 §6）——`@rimltempest/riml-ds-css` の `navigation.css` が出すクラスを、
 * 想定どおりのマークアップで並べる。
 *
 * ここが「契約が守られているか」を見る面でもある: `aria-label` の無い `<nav>`、
 * `aria-current` の無い現在地、ラベル文字の無いアイコンリンクは addon-a11y（AAA）が落とす。
 * a11y の除外は 1 つも置いていない。
 *
 * 落ちるメニューが要る項目だけ `rd-menu` を入れる（開閉は `rd-menu` が持つ）。
 * `define` と `<name>.css` は `library/elements/src` から読む——`dist` と両方を読むと
 * `customElements.define` が二重になって落ちる（`.storybook/preview.ts`）。
 *
 * アイコンはすべて自作の幾何（丸・線・四角）で、絵は持ち込まない。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html, svg, type SVGTemplateResult, type TemplateResult } from 'lit'
import '../../../../library/elements/src/button/button.define.js'
import '../../../../library/elements/src/button/button.css'
import '../../../../library/elements/src/menu/menu.define.js'
import '../../../../library/elements/src/menu/menu.css'

/**
 * 中身は lit の `svg` タグで作る。`html` タグで書いた `<circle>` は HTML として
 * 解釈され、SVG 名前空間の要素にならない（＝何も描かれない）。
 */
const icon = (body: SVGTemplateResult): TemplateResult =>
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

const homeIcon = (): TemplateResult => icon(svg`<path d="M4 11l8-7 8 7v9H4z" />`)
const listIcon = (): TemplateResult => icon(svg`<path d="M5 8h14M5 12h14M5 16h14" />`)
const circleIcon = (): TemplateResult => icon(svg`<circle cx="12" cy="12" r="7" />`)

/** 現在地までの道すじ。区切りは CSS の生成コンテンツで、読み上げには出さない */
const breadcrumb = (): TemplateResult =>
  html`<h1 class="rd-visually-hidden">パンくずの見本</h1>
    <nav class="rd-breadcrumb" aria-label="現在地">
      <ol>
        <li><a href="/">ホーム</a></li>
        <li><a href="/docs">ドキュメント</a></li>
        <li><a href="/docs/navigation" aria-current="page">移動</a></li>
      </ol>
    </nav>`

/** ページ送り。現在のページだけ面が上がる。前後は文字の代わりに名前を持つ */
const pagination = (): TemplateResult =>
  html`<h1 class="rd-visually-hidden">ページ送りの見本</h1>
    <nav class="rd-pagination" aria-label="ページ">
      <ul>
        <li><a href="/list?p=1" aria-label="前へ">‹</a></li>
        <li><a href="/list?p=1">1</a></li>
        <li><a href="/list?p=2" aria-current="page">2</a></li>
        <li><a href="/list?p=3">3</a></li>
        <li><a href="/list?p=3" aria-label="次へ">›</a></li>
      </ul>
    </nav>`

/** 縦のレール。文言は視覚的にだけ隠す（読み上げには残す） */
const navRail = (): TemplateResult =>
  html`<h1 class="rd-visually-hidden">ナビゲーションレールの見本</h1>
    <nav class="rd-nav-rail" aria-label="主要">
      <ul>
        <li>
          <a href="/" aria-current="page">${homeIcon()}<span>ホーム</span></a>
        </li>
        <li>
          <a href="/files">${listIcon()}<span>ファイル</span></a>
        </li>
        <li>
          <a href="/settings">${circleIcon()}<span>設定</span></a>
        </li>
      </ul>
    </nav>`

/** 窓の帯に敷くメニュー。色は chrome（`.rd-nav-menu` とはここが違う） */
const menubar = (): TemplateResult =>
  html`<h1 class="rd-visually-hidden">窓のメニュー帯の見本</h1>
    <nav class="rd-menubar" aria-label="メニュー">
      <ul>
        <li><a href="/file">ファイル</a></li>
        <li><a href="/edit">編集</a></li>
        <li><a href="/view">表示</a></li>
      </ul>
    </nav>`

/**
 * ページの主要ナビ。面が surface で、落ちるメニューが要る項目にだけ `rd-menu` を入れる。
 * 閉じたまま撮る（開いた姿は `Components/Menu` が持つ）。
 */
const navMenu = (): TemplateResult =>
  html`<h1 class="rd-visually-hidden">主要ナビの帯の見本</h1>
    <nav class="rd-nav-menu" aria-label="主要">
      <ul>
        <li><a href="/" aria-current="page">ホーム</a></li>
        <li><a href="/docs">ドキュメント</a></li>
        <li>
          <rd-menu label="作る">
            <rd-button slot="trigger" variant="ghost">
              <button type="button" popovertarget="sb-nav-make">作る</button>
            </rd-button>
            <div popover id="sb-nav-make">
              <a href="/new/document">新しい書類</a>
              <a href="/new/folder">新しいフォルダ</a>
            </div>
          </rd-menu>
        </li>
        <li><a href="/help">ヘルプ</a></li>
      </ul>
    </nav>`

/**
 * レイアウトの器。親が `container-type: inline-size` を宣言していることが条件。
 * 実際のページでは `<aside class="rd-sidebar">` にする（`navigation.css` の契約）——
 * ここで `<div>` にしているのは、見本を包む器の中では `complementary` が
 * 最上位に来ず markuplint の `landmark-roles` が落ちるため。
 */
const sidebar = (): TemplateResult =>
  html`<h1 class="rd-visually-hidden">サイドバーの見本</h1>
    <div style="container-type: inline-size; display: flex; min-block-size: 14rem">
      <div class="rd-sidebar">${navRailOnly()}</div>
      <p style="padding: 1rem">幅が足りない親の中では、文言を隠したレールまで縮む。</p>
    </div>`

const navRailOnly = (): TemplateResult =>
  html`<nav class="rd-nav-rail" aria-label="サイドバー">
    <ul>
      <li>
        <a href="/" aria-current="page">${homeIcon()}<span>ホーム</span></a>
      </li>
      <li>
        <a href="/files">${listIcon()}<span>ファイル</span></a>
      </li>
    </ul>
  </nav>`

const meta: Meta = {
  title: 'Patterns/Navigation',
  render: navMenu,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj

/** 区切りは生成コンテンツ。現在地は太字で、下線を外して「押せない」ことを形で示す */
export const Breadcrumb: Story = { render: breadcrumb }

/** 前後の矢印は記号だけでは名前にならないので `aria-label` を付ける */
export const Pagination: Story = { render: pagination }

/** 現在地は「点の色 + 左の縦罫 + 面」の 3 つで示す（色だけに頼らない） */
export const NavRail: Story = { render: navRail }

/** 窓の帯。`role="menubar"` は付けない——リンクの列で足りる（APG のメニューバーは別物） */
export const Menubar: Story = { render: menubar }

/** 現在地は太字 + 下の縦罫。`.rd-menubar` とは用途で色が分かれる（こちらは surface） */
export const NavMenu: Story = { render: navMenu }

/** 幅が足りない親の中では、`@container` でレールまで縮む */
export const Sidebar: Story = { render: sidebar }

export const Dark: Story = { render: navMenu, globals: { scheme: 'dark' } }

export const RTL: Story = {
  render: () => html`${breadcrumb()}${navMenu()}`,
  globals: { dir: 'rtl' },
}

export const ForcedColors: Story = {
  render: navMenu,
  parameters: {
    docs: {
      description: {
        story:
          'Playwright の `forcedColors: "active"` でだけ検証する（`e2e/vrt/forced.spec.ts`）。'
          + 'CSS のメディア特性はページの JS から切り替えられないので、Storybook 上では見た目が変わらない。'
          + '現在地の縦罫は消え、代わりに下線が付く。',
      },
    },
  },
}
