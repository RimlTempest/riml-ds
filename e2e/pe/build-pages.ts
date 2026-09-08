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
import { dialogMarkup } from '../../library/elements/src/dialog/index.js'
import { disclosureMarkup } from '../../library/elements/src/disclosure/index.js'
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
  ['library/elements/src/disclosure/disclosure.css', 'disclosure.css'],
  ['library/elements/src/meter/meter.css', 'meter.css'],
  ['library/elements/src/radio-group/radio-group.css', 'radio-group.css'],
  ['library/elements/src/slider/slider.css', 'slider.css'],
  ['library/elements/src/window/window.css', 'window.css'],
  ['library/elements/src/tabs/tabs.css', 'tabs.css'],
  ['library/elements/src/menu/menu.css', 'menu.css'],
  ['library/elements/src/popover/popover.css', 'popover.css'],
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

const OPTIONS =
  '<option value="">選択してください</option>'
  + '<option value="jp">日本</option><option value="us">アメリカ</option>'

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
