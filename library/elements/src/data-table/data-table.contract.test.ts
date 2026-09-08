import { describe, expect, it } from 'vitest'
import { checkContract, type ContractHost } from '../_shared/contract.js'
import {
  contract,
  dataTableBodyMarkup,
  dataTableHeadMarkup,
  dataTableRowMarkup,
  markup,
  SORTABLE_SELECTOR,
} from './data-table.contract.js'

/** DOM を立てずに querySelector だけを差し替える（node project で回すため） */
const hostWith = (present: readonly string[]): ContractHost<string> => ({
  querySelector: (selector) => (present.includes(selector) ? selector : null),
})

const ALL_ROLES = ['table', 'caption', 'head', 'body'] as const

const roles: Readonly<Record<string, string>> = contract.roles

const selectorsOf = (names: readonly string[]): readonly string[] =>
  names.map((name) => roles[name] ?? '')

const HEAD = dataTableHeadMarkup([
  { label: '名前', sort: 'text', key: 'name' },
  { label: 'サイズ', sort: 'number', key: 'size', numeric: true },
])

const BODY = dataTableBodyMarkup([
  dataTableRowMarkup([{ text: 'a.png' }, { text: '1,234', value: '1234', numeric: true }]),
])

describe('markup', () => {
  it('契約の tree どおりの HTML を返す', () => {
    expect(markup({ caption: '保存したコード', head: HEAD, body: BODY })).toBe(
      `<rd-data-table><table class="rd-table"><caption>保存したコード</caption>${HEAD}${BODY}</table></rd-data-table>`,
    )
  })

  it('caption の文言をエスケープする', () => {
    expect(markup({ caption: '<b>x</b>', head: HEAD, body: BODY })).toContain(
      '&lt;b&gt;x&lt;/b&gt;',
    )
  })

  it('head / body は生 HTML なのでエスケープしない', () => {
    expect(markup({ caption: '表', head: HEAD, body: BODY })).toContain('<th scope="col"')
  })

  it('column / direction / manual をホストの属性として出す', () => {
    const html = markup({
      caption: '表',
      head: HEAD,
      body: BODY,
      column: '1',
      direction: 'descending',
      manual: true,
    })
    expect(html.startsWith('<rd-data-table column="1" direction="descending" manual>')).toBe(true)
  })

  it('column / direction / manual を省くと属性ごと出ない', () => {
    expect(markup({ caption: '表', head: HEAD, body: BODY }).startsWith('<rd-data-table>')).toBe(
      true,
    )
  })
})

describe('dataTableHeadMarkup', () => {
  it('並べ替えられる列に data-sort / data-key / data-numeric を書く', () => {
    expect(HEAD).toBe(
      '<thead><tr>'
        + '<th scope="col" data-sort="text" data-key="name">名前</th>'
        + '<th scope="col" data-sort="number" data-key="size" data-numeric>サイズ</th>'
        + '</tr></thead>',
    )
  })

  it('sort を書かない列は並べ替えの印を持たない', () => {
    expect(dataTableHeadMarkup([{ label: '操作' }])).toBe(
      '<thead><tr><th scope="col">操作</th></tr></thead>',
    )
  })

  it('見出しの文言をエスケープする', () => {
    expect(dataTableHeadMarkup([{ label: '<b>x</b>' }])).toContain('&lt;b&gt;x&lt;/b&gt;')
  })
})

describe('dataTableRowMarkup / dataTableBodyMarkup', () => {
  it('比較キーは data-value に書く', () => {
    expect(dataTableRowMarkup([{ text: '1,234', value: '1234', numeric: true }])).toBe(
      '<tr><td data-value="1234" data-numeric>1,234</td></tr>',
    )
  })

  it('data-value が要らないセルは文言だけ', () => {
    expect(dataTableRowMarkup([{ text: 'a.png' }])).toBe('<tr><td>a.png</td></tr>')
  })

  it('セルの文言をエスケープする', () => {
    expect(dataTableRowMarkup([{ text: '<b>x</b>' }])).toContain('&lt;b&gt;x&lt;/b&gt;')
  })

  it('行をまとめて <tbody> にする', () => {
    expect(dataTableBodyMarkup([dataTableRowMarkup([{ text: 'a' }])])).toBe(
      '<tbody><tr><td>a</td></tr></tbody>',
    )
  })
})

describe('contract', () => {
  it('table / caption / thead / tbody が揃っていれば ok', () => {
    expect(contract.required).toEqual([...ALL_ROLES])
    expect(checkContract(hostWith(selectorsOf(ALL_ROLES)), contract).kind).toBe('ok')
  })

  it('必須の役割が無ければ missing になり、無い役割名が返る', () => {
    expect(checkContract(hostWith([]), contract)).toEqual({
      kind: 'missing',
      roles: [...ALL_ROLES],
    })
  })

  it('<caption> だけ欠けても missing になる（読み上げに表の名前が要る）', () => {
    const present = selectorsOf(['table', 'head', 'body'])
    expect(checkContract(hostWith(present), contract)).toEqual({
      kind: 'missing',
      roles: ['caption'],
    })
  })

  it('並べ替えられる列は th[data-sort] で印を付ける', () => {
    expect(SORTABLE_SELECTOR).toBe(':scope > table > thead > tr > th[data-sort]')
  })
})
