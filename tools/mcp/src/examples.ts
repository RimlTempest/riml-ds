/**
 * `get_element` / `riml-ds://elements/{tag}` の使用例（composition root）。
 * ティア A/B はマークアップ契約の `markup()` が出す HTML をそのまま使う。ここで props を
 * 決めるだけで、文字列を手で書かない（ADR-0012。契約と例がずれない）。
 */
import { buttonMarkup } from '@rimltempest/riml-ds-elements/button'
import { dialogMarkup } from '@rimltempest/riml-ds-elements/dialog'
import { textFieldMarkup } from '@rimltempest/riml-ds-elements/text-field'
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

/** ティア C（`rd-live-region`）は契約を持たないので載せない。core が空タグに落とす */
export const elementExamples = {
  'rd-button': { html: buttonMarkup(BUTTON), props: BUTTON },
  'rd-text-field': { html: textFieldMarkup(TEXT_FIELD), props: TEXT_FIELD },
  'rd-dialog': { html: dialogMarkup(DIALOG), props: DIALOG },
} as const satisfies ElementExampleMap
