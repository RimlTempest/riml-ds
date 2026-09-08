// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * 視覚言語「まど」の**組み合わせ見本**（docs/brand.md §7）。
 * ここに出るのは **JS を使わない窓**（`.rd-window`）——
 * `@rimltempest/riml-ds-css` の `patterns.css` が出すクラスを、部品と一緒に組んで見せる。
 * 帯の左端の丸は本物の `<button>`（ADR-0014）で、**動作は利用側が書く**。
 * ここは見本なので押しても何も起きない。動作まで要るなら部品の `rd-window`。
 *
 * 部品の `define` と `.css` は `library/elements/src` から読む（dist と二重に登録しないため。
 * `.storybook/preview.ts` の先頭コメント）。
 *
 * `QrccWindow` / `NoterWindow` は `Form` に `globals.theme` を固定したもの。
 * 形・影・文字は全ブランド共通で、変わるのは色だけ（brand.md §10）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html, nothing, type TemplateResult } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { buttonMarkup } from '../../../../library/elements/src/button/index.js'
import '../../../../library/elements/src/button/button.define.js'
import '../../../../library/elements/src/button/button.css'
import { checkboxMarkup } from '../../../../library/elements/src/checkbox/index.js'
import '../../../../library/elements/src/checkbox/checkbox.define.js'
import '../../../../library/elements/src/checkbox/checkbox.css'
import { meterMarkup } from '../../../../library/elements/src/meter/index.js'
import '../../../../library/elements/src/meter/meter.define.js'
import '../../../../library/elements/src/meter/meter.css'
import { selectMarkup } from '../../../../library/elements/src/select/index.js'
import '../../../../library/elements/src/select/select.define.js'
import '../../../../library/elements/src/select/select.css'
import { textFieldMarkup } from '../../../../library/elements/src/text-field/index.js'
import '../../../../library/elements/src/text-field/text-field.define.js'
import '../../../../library/elements/src/text-field/text-field.css'
import './mado.css'

type Tone = 'accent' | 'warning' | 'danger'
type Action = 'close' | 'expand' | 'collapse'

/** 並びは左から 閉じる → 広げる → たたむ（brand.md §7.1）。使わない操作の丸は描かない */
const LABELS: Readonly<Record<Action, string>> = {
  close: '閉じる',
  expand: '広げる',
  collapse: 'たたむ',
}

const control = (action: Action): TemplateResult =>
  html`<button
    type="button"
    class="rd-window-control"
    data-action=${action}
    aria-label=${LABELS[action]}
  ></button>`

type BarOptions = {
  readonly id?: string
  readonly tone?: Tone
  readonly actions?: readonly Action[]
}

/** 帯 ⊃ 見出し（ADR-0014 決定 2）。tone は帯に付ける。操作が無いなら入れ物ごと省く */
const bar = (text: string, options: BarOptions = {}): TemplateResult =>
  html`<header class="rd-window-bar" data-tone=${options.tone ?? nothing}>
    ${
      options.actions === undefined || options.actions.length === 0
        ? nothing
        : html`<div class="rd-window-controls">${options.actions.map(control)}</div>`
    }
    <h2 class="rd-window-title" id=${options.id ?? nothing}>${text}</h2>
  </header>`

/** 見出しの `id` を持たない窓は見本なので、帯の見出しをそのまま名前にする */
const title = (text: string, tone?: Tone): TemplateResult => bar(text, { tone })

const actions = (): TemplateResult =>
  html`<div class="rd-cluster">
    ${unsafeHTML(buttonMarkup({ label: '保存する', variant: 'primary' }))}
    ${unsafeHTML(buttonMarkup({ label: 'やめる', variant: 'secondary' }))}
  </div>`

/** 帯 + 本体 + ボタン列。窓の骨格はこれだけ（brand.md §7.1） */
const plainWindow = (): TemplateResult =>
  html`<section class="rd-window" aria-labelledby="sb-mado-window">
    ${bar('設定', { id: 'sb-mado-window', actions: ['close'] })}
    <div class="rd-window-body rd-stack">
      <p>帯の中に操作と見出しが並ぶ。左端の丸は装飾ではなく、押せる本物のボタン。</p>
      ${actions()}
    </div>
  </section>`

const meta: Meta = {
  title: 'Foundations/Mado',
  render: () => html`<div class="sb-mado">${plainWindow()}</div>`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj

export const Window: Story = {}

/** 操作は使う分だけ描く。押せない丸は置かない（ADR-0014 決定 1） */
export const WindowControls: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">帯の操作の見本</h1>
      <div class="sb-mado rd-stack">
        <section class="rd-window" aria-labelledby="sb-mado-none">
          ${bar('操作なし', { id: 'sb-mado-none' })}
          <div class="rd-window-body">
            <p>丸が 1 つも無い窓。帯の左は空欄で、タイトルは中央のまま。</p>
          </div>
        </section>
        <section class="rd-window" aria-labelledby="sb-mado-close">
          ${bar('閉じるだけ', { id: 'sb-mado-close', actions: ['close'] })}
          <div class="rd-window-body"><p>閉じられる窓。ダイアログの帯もこれと同じ。</p></div>
        </section>
        <section class="rd-window" aria-labelledby="sb-mado-all">
          ${bar('閉じる・広げる・たたむ', {
            id: 'sb-mado-all',
            actions: ['close', 'expand', 'collapse'],
          })}
          <div class="rd-window-body">
            <p>3 つ全部。並びは左から 閉じる（×）・広げる（□）・たたむ（−）。</p>
          </div>
        </section>
      </div>`,
}

/** 帯の色は 4 通り。文字色は必ず対応する `on-*`（brand.md §7.1） */
export const WindowTones: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">帯の色の見本</h1>
      <div class="sb-mado rd-stack">
        <section class="rd-window">
          ${title('既定（chrome）')}
          <div class="rd-window-body"><p>ふつうの窓。帯はインク色。</p></div>
        </section>
        <section class="rd-window">
          ${title('accent', 'accent')}
          <div class="rd-window-body"><p>主役の窓。今いる場所を示すときだけ。</p></div>
        </section>
        <section class="rd-window">
          ${title('warning', 'warning')}
          <div class="rd-window-body"><p>注意。色だけで伝えず、本文にも理由を書く。</p></div>
        </section>
        <section class="rd-window">
          ${title('danger', 'danger')}
          <div class="rd-window-body"><p>失敗・破壊的操作。次の行動まで書く。</p></div>
        </section>
      </div>`,
}

/** 窓の中に入力を並べる。窪み・ピル・太いトラック・点線がひと目で揃う */
export const Form: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">窓の中のフォームの見本</h1>
      <div class="sb-mado">
        <section class="rd-window">
          ${title('バックアップの設定')}
          <div class="rd-window-body rd-stack">
            ${unsafeHTML(
              textFieldMarkup({
                id: 'sb-mado-name',
                name: 'name',
                label: 'バックアップ名',
                defaultValue: '毎晩のバックアップ',
                hint: '後から変えられる',
              }),
            )}
            ${unsafeHTML(
              selectMarkup({
                id: 'sb-mado-when',
                name: 'when',
                label: '実行する時刻',
                children:
                  '<option value="0">0 時</option><option value="3" selected>3 時</option><option value="6">6 時</option>',
              }),
            )}
            ${unsafeHTML(
              checkboxMarkup({
                id: 'sb-mado-verify',
                name: 'verify',
                label: '書き込み後に検証する',
                defaultChecked: true,
              }),
            )}
            ${unsafeHTML(
              checkboxMarkup({
                id: 'sb-mado-notify',
                name: 'notify',
                label: '終わったら通知する',
                asSwitch: true,
              }),
            )}
            ${unsafeHTML(
              meterMarkup({
                id: 'sb-mado-disk',
                label: '保存先の空き',
                value: '3.2',
                max: '10',
                text: '3.2 GB / 10 GB',
              }),
            )}
            <hr />
            ${actions()}
          </div>
        </section>
      </div>`,
}

/** 硬い影（ぼかし 0・右下）は、窓が積み重なったときにいちばん効く（brand.md §5） */
export const Stacked: Story = {
  render: () =>
    html`<h1 class="rd-visually-hidden">重なった窓の見本</h1>
      <div class="sb-mado sb-stacked">
        <section class="rd-window">
          ${title('後ろの窓')}
          <div class="rd-window-body"><p>影はぼかさない。右下にそのまま落ちる。</p></div>
        </section>
        <section class="rd-window">
          ${title('前の窓')}
          <div class="rd-window-body"><p>だから重ねると紙が積まれたように見える。</p></div>
        </section>
      </div>`,
}

/** qrcc テーマ。形・影・文字はそのままで、色だけ差し替わる */
export const QrccWindow: Story = { ...Form, globals: { theme: 'qrcc' } }

/**
 * noter テーマ（旧既定の青緑）。同上。
 *
 * **この story は今 axe（AAA）で落ちる**（riml-ds のどこにも a11y の除外は置かない方針なので、
 * 除外せずそのまま残す）。落ちるのは story ではなく **noter テーマのトークンの値**：
 * ライトの `text.muted`（`neutral.600` = `oklch(44% 0.02 200)`）が
 * `surface.raised`（`neutral.100`）の上で **6.87:1**、`surface.sunken` の上で **5.73:1** しかなく、
 * AAA の 7:1 を割る（riml 8.97 / qrcc 8.04）。窓の本体は `surface.raised` なので、
 * 窓の中の補助文字（`rd-text-field` の hint）が最初にそれを踏む。
 *
 * 直すのは `system/tokens/src/themes/noter/color.tokens.json` の `neutral.600` を暗くする側で、
 * レーン `feat/theme-scheme` / `feat/brand-tokens` の仕事（plan 016 のレーンは `system/**` を持たない）。
 * 併せて、テーマのコントラスト検査が `muted / surface.raised`・`muted / surface.sunken` を
 * 見ていないことも直す（`bun run lint:tokens` は今この 2 対を通してしまう）。
 */
export const NoterWindow: Story = { ...Form, globals: { theme: 'noter' } }
