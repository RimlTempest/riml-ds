/**
 * JS 無し検証（ADR-0012 §7）のための静的ページを作る。`markup()` の出力 + CSS だけを配り、
 * **`<script>` を 1 つも含まない**（下の `assertNoScript` が保証する）。
 * Storybook は JS 無しでは動かないので、ティア A/B の「JS 無しでどう見えるか」はここが唯一の検証面。
 *
 * 生成物は `e2e/pe/pages/`（gitignore）。`playwright.config.ts` の webServer が毎回作り直す。
 * 部品を足したら PAGES に足す（plan 006 以降は registry.json の `pe` から自動列挙に置き換える）。
 */
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buttonMarkup } from '../../library/elements/src/button/index.js'
import { checkboxMarkup } from '../../library/elements/src/checkbox/index.js'
import {
  checkboxGroupMarkup,
  checkboxOptionMarkup,
} from '../../library/elements/src/checkbox-group/index.js'
import { comboboxMarkup, comboboxOptionMarkup } from '../../library/elements/src/combobox/index.js'
import {
  commandGroupMarkup,
  commandItemMarkup,
  commandMarkup,
} from '../../library/elements/src/command/index.js'
import { dialogMarkup } from '../../library/elements/src/dialog/index.js'
import { disclosureMarkup } from '../../library/elements/src/disclosure/index.js'
import { inputOtpMarkup, otpCellsMarkup } from '../../library/elements/src/input-otp/index.js'
import {
  markup as menuMarkup,
  menuItemMarkup,
} from '../../library/elements/src/menu/menu.contract.js'
import { meterMarkup } from '../../library/elements/src/meter/index.js'
import { markup as popoverMarkup } from '../../library/elements/src/popover/popover.contract.js'
import {
  radioGroupMarkup,
  radioOptionMarkup,
} from '../../library/elements/src/radio-group/index.js'
import { selectMarkup } from '../../library/elements/src/select/index.js'
import { sliderMarkup } from '../../library/elements/src/slider/index.js'
import {
  markup as tabsMarkup,
  panelMarkup,
  tabMarkup,
} from '../../library/elements/src/tabs/tabs.contract.js'
import { textFieldMarkup } from '../../library/elements/src/text-field/index.js'
import { toggleMarkup } from '../../library/elements/src/toggle/index.js'
import { windowMarkup } from '../../library/elements/src/window/index.js'

const root = fileURLToPath(new URL('../../', import.meta.url))
const outDir = fileURLToPath(new URL('pages/', import.meta.url))
const cssDir = join(outDir, 'css')

/** 読み込む順は skills/riml-ds/SKILL.md §import order と同じ。layers.css が最初 */
const CSS_SOURCES: readonly (readonly [string, string])[] = [
  ['system/css/dist/layers.css', 'layers.css'],
  ['system/tokens/dist/tokens.css', 'tokens.css'],
  ['system/css/dist/index.css', 'index.css'],
  ['library/elements/src/button/button.css', 'button.css'],
  ['library/elements/src/text-field/text-field.css', 'text-field.css'],
  ['library/elements/src/dialog/dialog.css', 'dialog.css'],
  ['library/elements/src/select/select.css', 'select.css'],
  ['library/elements/src/checkbox/checkbox.css', 'checkbox.css'],
  ['library/elements/src/checkbox-group/checkbox-group.css', 'checkbox-group.css'],
  ['library/elements/src/combobox/combobox.css', 'combobox.css'],
  ['library/elements/src/command/command.css', 'command.css'],
  ['library/elements/src/disclosure/disclosure.css', 'disclosure.css'],
  ['library/elements/src/input-otp/input-otp.css', 'input-otp.css'],
  ['library/elements/src/meter/meter.css', 'meter.css'],
  ['library/elements/src/radio-group/radio-group.css', 'radio-group.css'],
  ['library/elements/src/slider/slider.css', 'slider.css'],
  ['library/elements/src/window/window.css', 'window.css'],
  ['library/elements/src/tabs/tabs.css', 'tabs.css'],
  ['library/elements/src/menu/menu.css', 'menu.css'],
  ['library/elements/src/popover/popover.css', 'popover.css'],
  ['library/elements/src/toggle/toggle.css', 'toggle.css'],
]

const STYLESHEETS = CSS_SOURCES.map(
  ([, name]) => `    <link rel="stylesheet" href="/css/${name}" />`,
).join('\n')

const page = (title: string, body: string): string =>
  `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>${title}</title>
${STYLESHEETS}
  </head>
  <body>
    <a class="rd-skip-link" href="#main">本文へ</a>
    <main id="main">
      <h1>${title}</h1>
${body}
    </main>
  </body>
</html>
`

const submit = buttonMarkup({ label: '送信', type: 'submit' })

/** 1x1 の透明 SVG。外部ファイルを配らずに `.rd-card-media` / `.rd-aspect` の枠だけを見る */
const PIXEL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3C/svg%3E"

/** `atoms.css` / `utilities.css` の面と待ち（plan 022）。JS を 1 行も使わない */
const SURFACES = `      <h2>カード</h2>
      <article class="rd-card">
        <img class="rd-card-media" src="${PIXEL}" alt="" />
        <div class="rd-card-body">
          <h3 class="rd-card-title"><a class="rd-card-link" href="/echo.html">送料のはなし</a></h3>
          <p>全国一律 500 円です。</p>
        </div>
        <div class="rd-card-footer"><span class="rd-badge">新着</span></div>
      </article>

      <h2>空のとき</h2>
      <div class="rd-empty">
        <span class="rd-empty-icon" aria-hidden="true"></span>
        <p class="rd-empty-title">まだありません</p>
        <p>最初の 1 つを作ると、ここに出ます。</p>
        <div class="rd-empty-actions">${buttonMarkup({ label: '作る', type: 'button' })}</div>
      </div>

      <h2>待っているとき</h2>
      <span class="rd-spinner" role="status"><span class="rd-visually-hidden">読み込み中</span></span>

      <h2>よくある質問</h2>
      <div class="rd-accordion">
        ${disclosureMarkup({ label: '送料について', children: '<p>全国一律 500 円です。</p>', group: 'faq' })}
        ${disclosureMarkup({ label: '返品について', children: '<p>7 日以内なら受け付けます。</p>', group: 'faq' })}
      </div>

      <h2>新着</h2>
      <div class="rd-carousel" role="region" aria-roledescription="carousel" aria-label="新着" tabindex="0">
        <ul class="rd-carousel-track">
          <li class="rd-carousel-item">
            <article class="rd-card">
              <div class="rd-aspect" data-ratio="4-3"><img src="${PIXEL}" alt="" /></div>
              <div class="rd-card-body"><h3 class="rd-card-title">秋の便り</h3></div>
            </article>
          </li>
          <li class="rd-carousel-item">
            <article class="rd-card">
              <div class="rd-aspect" data-ratio="1"><img src="${PIXEL}" alt="" /></div>
              <div class="rd-card-body"><h3 class="rd-card-title">冬の支度</h3></div>
            </article>
          </li>
        </ul>
      </div>

      <h2>記録</h2>
      <div class="rd-scroll-area" role="region" aria-label="記録" tabindex="0">
        <p>2026-09-08 03:00 バックアップを開始した。</p>
        <p>2026-09-08 03:04 バックアップが終わった。</p>
      </div>`

const OPTIONS =
  '<option value="">選択してください</option>'
  + '<option value="jp">日本</option><option value="us">アメリカ</option>'

/** 候補は `<datalist>` に書く。JS が無ければネイティブの吹き出しがこれを出す */
const READINGS = [
  { value: 'kana', label: 'かな' },
  { value: 'kanji', label: 'かんじ' },
  { value: 'katakana', label: 'カナ' },
  { value: 'romaji', label: 'ローマ字' },
  { value: 'eisuji', label: '英数字' },
]
  .map((option) => comboboxOptionMarkup(option))
  .join('')

/** `required` は最初の 1 個にだけ付ける（HTML の仕様で group 全体が必須になる） */
const plans = (name: string, required: boolean): string =>
  [
    radioOptionMarkup({
      id: `${name}-free`,
      name,
      value: 'free',
      label: '無料',
      ...(required ? { required: true } : {}),
    }),
    radioOptionMarkup({ id: `${name}-pro`, name, value: 'pro', label: '有料' }),
  ].join('')

/** 同じ `name` を並べると `?tags=a&tags=b` の形で送信される */
const tags = (name: string): string =>
  [
    checkboxOptionMarkup({ id: `${name}-work`, name, value: 'a', label: '仕事' }),
    checkboxOptionMarkup({ id: `${name}-private`, name, value: 'b', label: '私用' }),
  ].join('')

const PAGES: Readonly<Record<string, string>> = {
  'button.html': page(
    'ボタン',
    `      <form method="get" action="/echo.html">
        ${submit}
      </form>`,
  ),
  'text-field.html': page(
    'テキスト入力',
    `      <form method="get" action="/echo.html">
        ${textFieldMarkup({
          id: 'email',
          label: 'メール',
          name: 'email',
          type: 'email',
          required: true,
        })}
        ${submit}
      </form>`,
  ),
  'select.html': page(
    '選択',
    `      <form method="get" action="/echo.html">
        ${selectMarkup({
          id: 'country',
          label: '国',
          name: 'country',
          required: true,
          children: OPTIONS,
        })}
        ${submit}
      </form>`,
  ),
  'combobox.html': page(
    '候補つき入力',
    `      <form method="get" action="/echo.html">
        ${comboboxMarkup({
          id: 'reading',
          listId: 'reading-list',
          label: '読み',
          name: 'reading',
          hint: '候補から選ぶか、そのまま入力できます',
          children: READINGS,
        })}
        ${submit}
      </form>`,
  ),
  /**
   * ティア A。JS が無ければ入力欄は飾りになるが、**一覧はそのまま辿れる**
   * （項目は本物のリンクとボタン。部品が `role` を書き換えない理由がここにある）。
   */
  'command.html': page(
    'コマンドパレット',
    `      ${commandMarkup({
      id: 'palette',
      label: 'コマンド',
      placeholder: '打って絞り込む',
      groups:
        commandGroupMarkup({
          label: 'ページ',
          items:
            commandItemMarkup({
              label: 'ホーム',
              href: '/echo.html?item=home',
              keywords: 'home top',
              shortcut: '⌘1',
            })
            + commandItemMarkup({
              label: '設定',
              href: '/echo.html?item=settings',
              keywords: 'せってい preferences',
            })
            + commandItemMarkup({ label: '下書き', href: '/echo.html?item=drafts' }),
        })
        + commandGroupMarkup({
          label: '操作',
          items:
            commandItemMarkup({ label: '新しいノート', value: 'new', shortcut: '⌘N' })
            + commandItemMarkup({ label: '共有', value: 'share' }),
        }),
    })}`,
  ),
  'checkbox.html': page(
    'チェックボックス',
    `      <form method="get" action="/echo.html">
        ${checkboxMarkup({
          id: 'terms',
          label: '規約に同意する',
          name: 'terms',
          defaultValue: 'yes',
          required: true,
        })}
        ${submit}
      </form>`,
  ),
  'disclosure.html': page(
    '折りたたみ',
    `      ${disclosureMarkup({
      label: '送料について',
      children: '<p>全国一律 500 円です。</p>',
    })}`,
  ),
  'dialog.html': page(
    'ダイアログ',
    `      ${dialogMarkup({ label: '確認', children: '<p>保存しますか？</p>' })}`,
  ),
  // plan 022。帯（Sheet）と返事を求める窓は属性が増えるだけで、JS 無しの見え方は同じ
  'dialog-sheet.html': page(
    'ダイアログの帯',
    `      ${dialogMarkup({ label: '絞り込み', children: '<p>条件を選ぶ。</p>', placement: 'end' })}
      ${dialogMarkup({ label: '削除の確認', children: '<p>元に戻せません。</p>', alert: true })}`,
  ),
  'card.html': page('面と待ち', SURFACES),
  'meter.html': page(
    'メーター',
    `      ${meterMarkup({
      id: 'disk',
      label: 'ディスク使用量',
      value: '3.2',
      max: '10',
      text: '3.2 GB / 10 GB',
    })}`,
  ),
  'window.html': page(
    '窓',
    `      ${windowMarkup({
      title: 'バックアップの設定',
      children: '<p>毎晩 3 時に実行します。</p>',
      closable: true,
      collapsible: true,
    })}`,
  ),
  'tabs.html': page(
    'タブ',
    `      ${tabsMarkup({
      label: '設定',
      tabs:
        tabMarkup({ href: '#overview', label: '概要' })
        + tabMarkup({ href: '#usage', label: '使い方' }),
      panels:
        panelMarkup({ id: 'overview', children: '<p>この部品の概要。</p>' })
        + panelMarkup({ id: 'usage', children: '<p>使い方の説明。</p>' }),
    })}`,
  ),
  /**
   * ティア B。**HTML だけで開閉する**（`popovertarget`）。JS が来る前は
   * `:not(:defined)` が受けて項目をその場に開いたまま見せる（内容が見える）。
   */
  'menu.html': page(
    'メニュー',
    `      ${menuMarkup({
      id: 'row-actions',
      label: '操作',
      items:
        menuItemMarkup({ label: '複製', href: '/echo.html' })
        + menuItemMarkup({ label: '削除', separated: true }),
    })}`,
  ),
  'popover.html': page(
    '重ね物',
    `      ${popoverMarkup({
      id: 'filters',
      label: '絞り込み',
      children: '<p>条件を選ぶと一覧がその場で変わる。</p>',
    })}`,
  ),
  /**
   * Hover Card（plan 026）。`hover` はホバーという**近道**を足すだけで、
   * JS 無しでは今までどおり `popovertarget` のボタンだけが働く。
   */
  'hover-card.html': page(
    'ホバーカード',
    `      ${popoverMarkup({
      id: 'profile',
      label: 'riml',
      children: '<p>デザインシステムを作っている。</p>',
      hover: true,
    })}`,
  ),
  /**
   * Context Menu（plan 026）。`context` は右クリックという**近道**を足すだけで、
   * JS 無しでは目に見えるボタンだけが働く（APG: 常に見える代替を用意する）。
   */
  'context-menu.html': page(
    'コンテキストメニュー',
    `      ${menuMarkup({
      id: 'row-context',
      label: '操作',
      items:
        menuItemMarkup({ label: '複製', href: '/echo.html' })
        + menuItemMarkup({ label: '削除', separated: true }),
      context: true,
    })}`,
  ),
  /** 主要ナビの帯（plan 026）。落ちるメニューが要る項目にだけ `rd-menu` を入れる */
  'nav-menu.html': page(
    '主要ナビの帯',
    `      <nav class="rd-nav-menu" aria-label="主要">
        <ul>
          <li><a href="/" aria-current="page">ホーム</a></li>
          <li><a href="/docs">ドキュメント</a></li>
          <li>
            ${menuMarkup({
              id: 'nav-make',
              label: '作る',
              items:
                menuItemMarkup({ label: '新しい書類', href: '/echo.html' })
                + menuItemMarkup({ label: '新しいフォルダ', href: '/echo.html' }),
            })}
          </li>
          <li><a href="/help">ヘルプ</a></li>
        </ul>
      </nav>`,
  ),
  /** ティア C。JS が無ければ吹き出しは出ず、対象の `title` が代わりに説明する */
  'tooltip.html': page(
    'ツールチップ',
    `      <button id="save" type="button" title="⌘S で保存します">保存</button>
      <rd-tooltip for="save">⌘S で保存します</rd-tooltip>`,
  ),
  /** `navigation.css` の 5 クラス。**ARIA は利用側の責務**なので、ここが正しい見本になる */
  'navigation.html': page(
    'ナビゲーション',
    `      <nav class="rd-breadcrumb" aria-label="現在地">
        <ol>
          <li><a href="/">ホーム</a></li>
          <li><a href="/docs">ドキュメント</a></li>
          <li><a href="/docs/nav" aria-current="page">ナビゲーション</a></li>
        </ol>
      </nav>
      <nav class="rd-menubar" aria-label="メニュー">
        <ul>
          <li><a href="/file">ファイル</a></li>
          <li><a href="/edit">編集</a></li>
          <li><a href="/view">表示</a></li>
        </ul>
      </nav>
      <aside class="rd-sidebar">
        <nav class="rd-nav-rail" aria-label="主要">
          <ul>
            <li>
              <a href="/" aria-current="page">
                <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 8 8 3 14 8" /><path d="M4 8 4 13 12 13 12 8" /></svg>
                <span>ホーム</span>
              </a>
            </li>
            <li>
              <a href="/settings">
                <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="3" /><path d="M8 1 8 3" /><path d="M8 13 8 15" /></svg>
                <span>設定</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      <nav class="rd-pagination" aria-label="ページ">
        <ul>
          <li><a href="?p=1" aria-label="前のページ">‹</a></li>
          <li><a href="?p=1">1</a></li>
          <li><a href="?p=2" aria-current="page">2</a></li>
          <li><a href="?p=3">3</a></li>
          <li><a href="?p=3" aria-label="次のページ">›</a></li>
        </ul>
      </nav>`,
  ),
  'live-region.html': page('ライブリージョン', '      <rd-live-region></rd-live-region>'),
  'radio-group.html': page(
    '択一',
    `      <form method="get" action="/echo.html">
        ${radioGroupMarkup({ label: 'プラン', children: plans('plan', true) })}
        ${radioGroupMarkup({ label: '表示', children: plans('view', false), segmented: true })}
        ${submit}
      </form>`,
  ),
  'slider.html': page(
    '連続値',
    `      <form method="get" action="/echo.html">
        ${sliderMarkup({
          id: 'volume',
          label: '音量',
          name: 'volume',
          defaultValue: '3',
          min: '0',
          max: '10',
          step: '1',
        })}
        ${submit}
      </form>`,
  ),
  'checkbox-group.html': page(
    '複数選択',
    `      <form method="get" action="/echo.html">
        ${checkboxGroupMarkup({ label: 'タグ', children: tags('tags'), min: '1' })}
        ${checkboxGroupMarkup({
          label: '表示',
          children: tags('view'),
          segmented: true,
        })}
        ${submit}
      </form>`,
  ),
  'input-otp.html': page(
    'ワンタイムコード',
    `      <form method="get" action="/echo.html">
        ${inputOtpMarkup({
          label: '確認コード',
          children: otpCellsMarkup({ name: 'code', length: 4 }),
          hint: '4 桁の数字',
        })}
        ${submit}
      </form>`,
  ),
  'button-group.html': page(
    'ボタンの枕',
    `      <div class="rd-button-group" role="group" aria-label="表示">
        ${toggleMarkup({ label: '一覧', pressed: 'true' })}
        ${toggleMarkup({ label: '格子' })}
      </div>`,
  ),
  'toggle.html': page(
    '押下状態を持つボタン',
    `      ${toggleMarkup({ label: '太字' })}
      ${toggleMarkup({ label: '斜体', variant: 'ghost' })}
      ${toggleMarkup({ label: '下線', pressed: 'true' })}
      <rd-toggle><button type="button" aria-pressed="false" disabled>取り消し線</button></rd-toggle>`,
  ),
  'input-group.html': page(
    '入力の枕',
    `      <form method="get" action="/echo.html">
        <div class="rd-input-group">
          <label class="rd-visually-hidden" for="q">検索</label>
          <input id="q" name="q" type="search" />
          ${buttonMarkup({ label: '検索', type: 'submit' })}
        </div>
      </form>`,
  ),
  'echo.html': page('送信済み', '      <p>フォームはネイティブに送信された。</p>'),
}

const assertNoScript = (name: string, html: string): void => {
  if (html.includes('<script')) {
    throw new Error(`pe: ${name} に <script> が入っている。JS 無しの検証面には置けない`)
  }
}

const main = async (): Promise<void> => {
  await rm(outDir, { recursive: true, force: true })
  await mkdir(cssDir, { recursive: true })
  await Promise.all(CSS_SOURCES.map(async ([from, to]) => cp(join(root, from), join(cssDir, to))))
  await Promise.all(
    Object.entries(PAGES).map(async ([name, html]) => {
      assertNoScript(name, html)
      await writeFile(join(outDir, name), html)
    }),
  )
  process.stdout.write(`pe: ${Object.keys(PAGES).length} ページ → e2e/pe/pages/\n`)
}

await main()
