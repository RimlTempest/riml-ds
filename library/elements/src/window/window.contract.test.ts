import { describe, expect, it } from 'vitest'
import { markup } from './window.contract.js'

describe('markup', () => {
  it('slot="title" の見出しと本文を持つ HTML を返す', () => {
    expect(markup({ title: '設定', children: '<p>本文</p>' })).toBe(
      '<rd-window><h2 slot="title">設定</h2><p>本文</p></rd-window>',
    )
  })

  it('操作の属性は指定したときだけ出る。title はエスケープする', () => {
    expect(markup({ title: '<b>x</b>', children: '', closable: true, expandable: false })).toBe(
      '<rd-window closable><h2 slot="title">&lt;b&gt;x&lt;/b&gt;</h2></rd-window>',
    )
  })

  it('3 つの操作と tone を同時に書ける', () => {
    expect(
      markup({
        title: '警告',
        children: '',
        closable: true,
        expandable: true,
        collapsible: true,
        tone: 'warning',
      }),
    ).toBe(
      '<rd-window closable expandable collapsible tone="warning">'
        + '<h2 slot="title">警告</h2></rd-window>',
    )
  })
})
