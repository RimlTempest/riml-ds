/**
 * `get_element` / `riml-ds://elements/{tag}` の使用例（composition root）。
 * ティア A/B はマークアップ契約の `markup()` が出す HTML をそのまま使う。ここで props を
 * 決めるだけで、文字列を手で書かない（ADR-0012。契約と例がずれない）。
 *
 * import 先は**契約専用サブパス**（`.../<name>/contract`）に限る。`.../<name>` の index は
 * Lit の class を re-export するので、単一ファイルの CLI バンドルに lit が丸ごと入る。
 * `experimental` の部品は `.../experimental/<name>/contract` から読む（ADR-0009）。
 */
import { markup as buttonMarkup } from '@rimltempest/riml-ds-elements/button/contract'
import { markup as dialogMarkup } from '@rimltempest/riml-ds-elements/dialog/contract'
import {
  itemMarkup as carouselItemMarkup,
  markup as carouselMarkup,
} from '@rimltempest/riml-ds-elements/experimental/carousel/contract'
import { markup as checkboxMarkup } from '@rimltempest/riml-ds-elements/experimental/checkbox/contract'
import {
  checkboxOptionMarkup,
  markup as checkboxGroupMarkup,
} from '@rimltempest/riml-ds-elements/experimental/checkbox-group/contract'
import {
  comboboxOptionMarkup,
  markup as comboboxMarkup,
} from '@rimltempest/riml-ds-elements/experimental/combobox/contract'
import {
  commandGroupMarkup,
  commandItemMarkup,
  markup as commandMarkup,
} from '@rimltempest/riml-ds-elements/experimental/command/contract'
import {
  dataTableBodyMarkup,
  dataTableHeadMarkup,
  markup as dataTableMarkup,
  dataTableRowMarkup,
} from '@rimltempest/riml-ds-elements/experimental/data-table/contract'
import { markup as disclosureMarkup } from '@rimltempest/riml-ds-elements/experimental/disclosure/contract'
import {
  markup as inputOtpMarkup,
  otpCellsMarkup,
} from '@rimltempest/riml-ds-elements/experimental/input-otp/contract'
import { markup as meterMarkup } from '@rimltempest/riml-ds-elements/experimental/meter/contract'
import { markup as popoverMarkup } from '@rimltempest/riml-ds-elements/experimental/popover/contract'
import {
  markup as radioGroupMarkup,
  radioOptionMarkup,
} from '@rimltempest/riml-ds-elements/experimental/radio-group/contract'
import {
  markup as menuMarkup,
  menuItemMarkup,
} from '@rimltempest/riml-ds-elements/experimental/menu/contract'
import { markup as selectMarkup } from '@rimltempest/riml-ds-elements/experimental/select/contract'
import { markup as sliderMarkup } from '@rimltempest/riml-ds-elements/experimental/slider/contract'
import { markup as splitterMarkup } from '@rimltempest/riml-ds-elements/experimental/splitter/contract'
import {
  markup as tabsMarkup,
  panelMarkup,
  tabMarkup,
} from '@rimltempest/riml-ds-elements/experimental/tabs/contract'
import { markup as toggleMarkup } from '@rimltempest/riml-ds-elements/experimental/toggle/contract'
import {
  markup as toggleGroupMarkup,
  toggleItemMarkup,
} from '@rimltempest/riml-ds-elements/experimental/toggle-group/contract'
import { markup as windowMarkup } from '@rimltempest/riml-ds-elements/experimental/window/contract'
import { markup as textFieldMarkup } from '@rimltempest/riml-ds-elements/text-field/contract'
import type { ElementExampleMap } from './core/elements.js'

const BUTTON = { label: '保存', type: 'submit' } as const
const TEXT_FIELD = {
  id: 'email',
  label: 'メール',
  name: 'email',
  type: 'email',
  required: true,
} as const
/**
 * `placement`（plan 022）で帯（Sheet / Drawer）にもできる。既定の `center` は属性を省くだけなので、
 * 例では珍しい方（行末側の帯）を見せる。返事を求める窓にする `alert` は CEM の attributes に出る。
 */
const DIALOG = {
  label: '絞り込み',
  children: '<p>条件を選ぶとすぐに反映されます。</p>',
  placement: 'end',
} as const
const SELECT = {
  id: 'country',
  label: '国',
  name: 'country',
  children:
    '<option value="">選択してください</option><option value="jp">日本</option>'
    + '<option value="us">アメリカ</option>',
} as const
const CHECKBOX = {
  id: 'news',
  label: 'お知らせを受け取る',
  name: 'news',
  defaultValue: 'yes',
} as const
const METER = {
  id: 'disk',
  label: 'ディスク使用量',
  value: '3.2',
  max: '10',
  text: '3.2 GB / 10 GB',
} as const
const WINDOW = {
  title: 'バックアップの設定',
  children: '<p>毎晩 3 時に実行します。</p>',
  closable: true,
  collapsible: true,
} as const
/** `required` は最初の 1 個にだけ付ける（HTML の仕様で group 全体が必須になる） */
const RADIO_GROUP = {
  label: 'プラン',
  children:
    radioOptionMarkup({
      id: 'plan-free',
      name: 'plan',
      value: 'free',
      label: '無料',
      required: true,
    }) + radioOptionMarkup({ id: 'plan-pro', name: 'plan', value: 'pro', label: '有料' }),
} as const
const SLIDER = {
  id: 'volume',
  label: '音量',
  name: 'volume',
  defaultValue: '3',
  min: '0',
  max: '10',
  step: '1',
} as const
/** 「1 つ以上」は `min`。ネイティブの検証には出ないので部品が見る（JS が無いと効かない） */
const CHECKBOX_GROUP = {
  label: 'タグ',
  min: '1',
  children:
    checkboxOptionMarkup({ id: 'tag-work', name: 'tags', value: 'work', label: '仕事' })
    + checkboxOptionMarkup({ id: 'tag-private', name: 'tags', value: 'private', label: '私用' }),
} as const
/**
 * 候補は `<datalist>` に書く（部品は生成しない）。**自由入力を許す**ので、候補に無い値も送れる。
 * 候補限定にしたいときは `pattern` / `required` を足す（ネイティブ検証）。
 */
const COMBOBOX = {
  id: 'reading',
  listId: 'reading-list',
  label: '読み',
  name: 'reading',
  hint: '候補から選ぶか、そのまま入力できます',
  children:
    comboboxOptionMarkup({ value: 'kana', label: 'かな' })
    + comboboxOptionMarkup({ value: 'kanji', label: 'かんじ' })
    + comboboxOptionMarkup({ value: 'katakana', label: 'カナ' }),
} as const
/**
 * 項目は**リンクとボタンのまま**（部品は生成しない）。グループは `<ul>` を分けるだけで、
 * 見出しは `aria-label` から CSS が描く。⌘K で開く窓は利用側が `rd-dialog` で作る。
 */
const COMMAND = {
  id: 'palette',
  label: 'コマンド',
  placeholder: '打って絞り込む',
  groups:
    commandGroupMarkup({
      label: 'ページ',
      items:
        commandItemMarkup({ label: 'ホーム', href: '/', keywords: 'home top' })
        + commandItemMarkup({
          label: '設定',
          href: '/settings',
          keywords: 'せってい preferences config',
          shortcut: '⌘,',
        }),
    })
    + commandGroupMarkup({
      label: '操作',
      items: commandItemMarkup({
        label: '新しいノート',
        value: 'new-note',
        keywords: 'あたらしい new note',
        shortcut: '⌘N',
      }),
    }),
} as const

/**
 * 並べ替えだけを持つ表（ページ送り・行の選択・絞り込みは外側で既存の部品と組み合わせる）。
 * 表そのものは利用側が書く。表示と比較キーが違う列（「1,234」「2026/01/02」）は機械が読める形を
 * `data-value` に書く。属性は文字列なので `column` は `'1'` の形で渡す（0 始まり）。
 */
const DATA_TABLE = {
  caption: '保存したコード',
  head: dataTableHeadMarkup([
    { label: '名前', sort: 'text', key: 'name' },
    { label: 'サイズ', sort: 'number', key: 'size', numeric: true },
    { label: '更新', sort: 'date', key: 'updated' },
  ]),
  body: dataTableBodyMarkup([
    dataTableRowMarkup([
      { text: 'レジ横の QR' },
      { text: '1,234', value: '1234', numeric: true },
      { text: '2026/01/02', value: '2026-01-02' },
    ]),
    dataTableRowMarkup([
      { text: '会員証バーコード' },
      { text: '820', value: '820', numeric: true },
      { text: '2025/12/31', value: '2025-12-31' },
    ]),
    dataTableRowMarkup([
      { text: '展示のカタログ' },
      { text: '12,000', value: '12000', numeric: true },
      { text: '2026/02/14', value: '2026-02-14' },
    ]),
    dataTableRowMarkup([
      { text: '社内 Wi-Fi' },
      { text: '96', value: '96', numeric: true },
      { text: '2025/08/09', value: '2025-08-09' },
    ]),
  ]),
  column: '1',
  direction: 'descending',
} as const
/** 値は `code-1..N` の N フィールドで送信される。連結した値は `el.value` で読む */
const INPUT_OTP = {
  label: '確認コード',
  hint: '6 桁の数字',
  children: otpCellsMarkup({ name: 'code' }),
} as const
const TABS = {
  label: '設定',
  tabs:
    tabMarkup({ href: '#overview', label: '概要' })
    + tabMarkup({ href: '#usage', label: '使い方' }),
  panels:
    panelMarkup({ id: 'overview', children: '<p>この製品の概要。</p>' })
    + panelMarkup({ id: 'usage', children: '<p>使い方の説明。</p>' }),
} as const
const MENU = {
  id: 'row-actions',
  label: '操作',
  items:
    menuItemMarkup({ label: '複製', href: '/items/1/duplicate' })
    + menuItemMarkup({ label: '削除', separated: true }),
} as const
const POPOVER = {
  id: 'filters',
  label: '絞り込み',
  children: '<p>条件を選ぶと一覧がその場で変わる。</p>',
} as const
const DISCLOSURE = {
  label: '送料について',
  children: '<p>5,000 円以上で無料です。</p>',
} as const

/**
 * ティア C は契約を持たない。`rd-toast` は空タグ（読み上げと表示は `show()` が出す）を載せ、
 * `rd-live-region` は載せない（core が同じ空タグに落とす）。
 */
/** 押下の真実は `aria-pressed`。既定は `'false'`（属性ごと消えると toggle でなくなる） */
const TOGGLE = { label: '太字', pressed: 'false' } as const

/**
 * 押下ボタンの列。**送信には載らない**（載せるなら `rd-radio-group segmented` /
 * `rd-checkbox-group segmented`）。項目は `<button>` 直書きだけで、`rd-toggle` は中に入れない。
 */
const TOGGLE_GROUP = {
  label: '書式',
  mode: 'multiple',
  children:
    toggleItemMarkup({ label: '太字', value: 'bold', pressed: 'true' })
    + toggleItemMarkup({ label: '斜体', value: 'italic' }),
} as const

const TOAST = {} as const

/**
 * 2 面の割合を変えるつまみ（plan 030）。`position` / `min` / `max` は整数の %。
 * `start` / `end` は**エスケープされない**生 HTML なので、信頼済みの断片だけを渡す。
 */
const SPLITTER = {
  label: 'サイドバーの幅',
  start: '<h2>一覧</h2><p>条件で絞った結果がここに出る。</p>',
  end: '<h2>本文</h2><p>選んだものの中身がここに出る。</p>',
  position: 40,
  min: 30,
  max: 70,
} as const

/** `props` は属性の見本なので文字列で持つ（`ElementExample` の型。数値は `markup()` が文字列にする） */
const SPLITTER_PROPS = {
  ...SPLITTER,
  position: String(SPLITTER.position),
  min: String(SPLITTER.min),
  max: String(SPLITTER.max),
} as const

/**
 * `rd-tooltip` もティア C（契約を持たない）。対象の id と説明文だけを載せる。
 * 対象側に `title` を書くのが JS 無しのときの代替（ADR-0012 ティア C）。
 */
const TOOLTIP = { for: 'save', children: '⌘S で保存します' } as const

/**
 * 枚（`<li>`）は利用側が書く。`carouselItemMarkup` で 1 枚ずつ組み、
 * 中身にはカードなどの既存のマークアップをそのまま入れる。自動再生は無い（AAA 2.3.3）。
 */
const CAROUSEL = {
  label: 'おすすめ',
  children: ['秋の便り', '冬の支度', '春の準備']
    .map((title) =>
      carouselItemMarkup({
        children: `<article class="rd-card"><div class="rd-card-body"><h3 class="rd-card-title">${title}</h3></div></article>`,
      }),
    )
    .join(''),
} as const

export const elementExamples = {
  'rd-button': { html: buttonMarkup(BUTTON), props: BUTTON },
  'rd-text-field': { html: textFieldMarkup(TEXT_FIELD), props: TEXT_FIELD },
  'rd-dialog': { html: dialogMarkup(DIALOG), props: DIALOG },
  'rd-select': { html: selectMarkup(SELECT), props: SELECT },
  'rd-carousel': { html: carouselMarkup(CAROUSEL), props: CAROUSEL },
  'rd-checkbox': { html: checkboxMarkup(CHECKBOX), props: CHECKBOX },
  'rd-checkbox-group': { html: checkboxGroupMarkup(CHECKBOX_GROUP), props: CHECKBOX_GROUP },
  'rd-combobox': { html: comboboxMarkup(COMBOBOX), props: COMBOBOX },
  'rd-command': { html: commandMarkup(COMMAND), props: COMMAND },
  'rd-data-table': { html: dataTableMarkup(DATA_TABLE), props: DATA_TABLE },
  'rd-disclosure': { html: disclosureMarkup(DISCLOSURE), props: DISCLOSURE },
  'rd-input-otp': { html: inputOtpMarkup(INPUT_OTP), props: INPUT_OTP },
  'rd-menu': { html: menuMarkup(MENU), props: MENU },
  'rd-meter': { html: meterMarkup(METER), props: METER },
  'rd-popover': { html: popoverMarkup(POPOVER), props: POPOVER },
  'rd-radio-group': { html: radioGroupMarkup(RADIO_GROUP), props: RADIO_GROUP },
  'rd-slider': { html: sliderMarkup(SLIDER), props: SLIDER },
  'rd-splitter': { html: splitterMarkup(SPLITTER), props: SPLITTER_PROPS },
  'rd-window': { html: windowMarkup(WINDOW), props: WINDOW },
  'rd-tabs': { html: tabsMarkup(TABS), props: TABS },
  'rd-toast': { html: '<rd-toast></rd-toast>', props: TOAST },
  'rd-toggle': { html: toggleMarkup(TOGGLE), props: TOGGLE },
  'rd-toggle-group': { html: toggleGroupMarkup(TOGGLE_GROUP), props: TOGGLE_GROUP },
  'rd-tooltip': {
    html:
      '<button id="save" type="button" title="⌘S で保存します">保存</button>'
      + '<rd-tooltip for="save">⌘S で保存します</rd-tooltip>',
    props: TOOLTIP,
  },
} as const satisfies ElementExampleMap
