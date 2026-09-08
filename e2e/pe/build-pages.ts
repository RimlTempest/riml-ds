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
import { meterMarkup } from '../../library/elements/src/meter/index.js'
import {
  radioGroupMarkup,
  radioOptionMarkup,
} from '../../library/elements/src/radio-group/index.js'
import { selectMarkup } from '../../library/elements/src/select/index.js'
import { sliderMarkup } from '../../library/elements/src/slider/index.js'
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
          <li class="rd-carousel-item"><div class="rd-aspect"><img src="${PIXEL}" alt="" /></div></li>
          <li class="rd-carousel-item"><div class="rd-aspect" data-ratio="1"><img src="${PIXEL}" alt="" /></div></li>
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
