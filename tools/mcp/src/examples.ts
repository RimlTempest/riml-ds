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
import { markup as disclosureMarkup } from '@rimltempest/riml-ds-elements/experimental/disclosure/contract'
import { markup as meterMarkup } from '@rimltempest/riml-ds-elements/experimental/meter/contract'
import { markup as selectMarkup } from '@rimltempest/riml-ds-elements/experimental/select/contract'
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
const DIALOG = {
  label: '削除の確認',
  children: '<p>削除すると元に戻せません。</p>',
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
const DISCLOSURE = {
  label: '送料について',
  children: '<p>5,000 円以上で無料です。</p>',
} as const

/**
 * ティア C は契約を持たない。`rd-toast` は空タグ（読み上げと表示は `show()` が出す）を載せ、
 * `rd-live-region` は載せない（core が同じ空タグに落とす）。
 */
const TOAST = {} as const

export const elementExamples = {
  'rd-button': { html: buttonMarkup(BUTTON), props: BUTTON },
  'rd-text-field': { html: textFieldMarkup(TEXT_FIELD), props: TEXT_FIELD },
  'rd-dialog': { html: dialogMarkup(DIALOG), props: DIALOG },
  'rd-select': { html: selectMarkup(SELECT), props: SELECT },
  'rd-checkbox': { html: checkboxMarkup(CHECKBOX), props: CHECKBOX },
  'rd-disclosure': { html: disclosureMarkup(DISCLOSURE), props: DISCLOSURE },
  'rd-meter': { html: meterMarkup(METER), props: METER },
  'rd-window': { html: windowMarkup(WINDOW), props: WINDOW },
  'rd-toast': { html: '<rd-toast></rd-toast>', props: TOAST },
} as const satisfies ElementExampleMap
