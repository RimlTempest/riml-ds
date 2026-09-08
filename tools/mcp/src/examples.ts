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
import { markup as checkboxMarkup } from '@rimltempest/riml-ds-elements/experimental/checkbox/contract'
import {
  checkboxOptionMarkup,
  markup as checkboxGroupMarkup,
} from '@rimltempest/riml-ds-elements/experimental/checkbox-group/contract'
import {
  comboboxOptionMarkup,
  markup as comboboxMarkup,
} from '@rimltempest/riml-ds-elements/experimental/combobox/contract'
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
import {
  markup as tabsMarkup,
  panelMarkup,
  tabMarkup,
} from '@rimltempest/riml-ds-elements/experimental/tabs/contract'
import { markup as toggleMarkup } from '@rimltempest/riml-ds-elements/experimental/toggle/contract'
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

const TOAST = {} as const

/**
 * `rd-tooltip` もティア C（契約を持たない）。対象の id と説明文だけを載せる。
 * 対象側に `title` を書くのが JS 無しのときの代替（ADR-0012 ティア C）。
 */
const TOOLTIP = { for: 'save', children: '⌘S で保存します' } as const

export const elementExamples = {
  'rd-button': { html: buttonMarkup(BUTTON), props: BUTTON },
  'rd-text-field': { html: textFieldMarkup(TEXT_FIELD), props: TEXT_FIELD },
  'rd-dialog': { html: dialogMarkup(DIALOG), props: DIALOG },
  'rd-select': { html: selectMarkup(SELECT), props: SELECT },
  'rd-checkbox': { html: checkboxMarkup(CHECKBOX), props: CHECKBOX },
  'rd-checkbox-group': { html: checkboxGroupMarkup(CHECKBOX_GROUP), props: CHECKBOX_GROUP },
  'rd-combobox': { html: comboboxMarkup(COMBOBOX), props: COMBOBOX },
  'rd-disclosure': { html: disclosureMarkup(DISCLOSURE), props: DISCLOSURE },
  'rd-input-otp': { html: inputOtpMarkup(INPUT_OTP), props: INPUT_OTP },
  'rd-menu': { html: menuMarkup(MENU), props: MENU },
  'rd-meter': { html: meterMarkup(METER), props: METER },
  'rd-popover': { html: popoverMarkup(POPOVER), props: POPOVER },
  'rd-radio-group': { html: radioGroupMarkup(RADIO_GROUP), props: RADIO_GROUP },
  'rd-slider': { html: sliderMarkup(SLIDER), props: SLIDER },
  'rd-window': { html: windowMarkup(WINDOW), props: WINDOW },
  'rd-tabs': { html: tabsMarkup(TABS), props: TABS },
  'rd-toast': { html: '<rd-toast></rd-toast>', props: TOAST },
  'rd-toggle': { html: toggleMarkup(TOGGLE), props: TOGGLE },
  'rd-tooltip': {
    html:
      '<button id="save" type="button" title="⌘S で保存します">保存</button>'
      + '<rd-tooltip for="save">⌘S で保存します</rd-tooltip>',
    props: TOOLTIP,
  },
} as const satisfies ElementExampleMap
