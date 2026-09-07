import { describe, expect, it } from 'vitest'
import { escapeHtml, renderMarkup } from './markup.js'

describe('escapeHtml', () => {
  it('HTML の特殊文字を実体参照にする', () => {
    expect(escapeHtml(`<img src="x" onerror='y'>&`)).toBe(
      '&lt;img src=&quot;x&quot; onerror=&#39;y&#39;&gt;&amp;',
    )
  })
})

describe('renderMarkup', () => {
  it('boolean 属性は true なら属性名だけ、false なら省く', () => {
    expect(
      renderMarkup({ tag: 'input', attrs: { required: '$required' } }, { required: true }),
    ).toBe('<input required>')
    expect(
      renderMarkup({ tag: 'input', attrs: { required: '$required' } }, { required: false }),
    ).toBe('<input>')
  })

  it('$prop を props の値に置き換える', () => {
    expect(renderMarkup({ tag: 'button', attrs: { type: '$type' } }, { type: 'submit' })).toBe(
      '<button type="submit"></button>',
    )
  })

  it('未指定の $prop は属性ごと省く', () => {
    expect(renderMarkup({ tag: 'button', attrs: { type: '$type', name: 'save' } }, {})).toBe(
      '<button name="save"></button>',
    )
  })

  it('入れ子と { prop } のテキストを描き、値をエスケープする', () => {
    expect(
      renderMarkup(
        { tag: 'rd-button', children: [{ tag: 'button', children: [{ prop: 'label' }] }] },
        { label: '<b>保存</b>' },
      ),
    ).toBe('<rd-button><button>&lt;b&gt;保存&lt;/b&gt;</button></rd-button>')
  })

  it('{ raw } はエスケープせずそのまま差し込む（$prop も可）', () => {
    expect(
      renderMarkup({ tag: 'div', children: [{ raw: '$children' }] }, { children: '<p>本文</p>' }),
    ).toBe('<div><p>本文</p></div>')
    expect(renderMarkup({ tag: 'div', children: [{ raw: '<hr>' }] }, {})).toBe('<div><hr></div>')
    expect(renderMarkup({ tag: 'div', children: [{ raw: '$children' }] }, {})).toBe('<div></div>')
  })

  it('slot は slot 属性として出す', () => {
    expect(renderMarkup({ tag: 'h2', slot: 'label', children: [{ text: '削除の確認' }] }, {})).toBe(
      '<h2 slot="label">削除の確認</h2>',
    )
  })
})
