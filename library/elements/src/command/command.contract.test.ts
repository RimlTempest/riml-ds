import { describe, expect, it } from 'vitest'
import { checkContract, type ContractHost } from '../_shared/contract.js'
import { commandGroupMarkup, commandItemMarkup, contract, markup } from './command.contract.js'

/** DOM を立てずに querySelector だけを差し替える（node project で回すため） */
const hostWith = (present: readonly string[]): ContractHost<string> => ({
  querySelector: (selector) => (present.includes(selector) ? selector : null),
})

const ALL = [contract.roles.label, contract.roles.control, contract.roles.list]

const GROUPS = '<ul><li><a href="/">ホーム</a></li></ul>'

describe('markup', () => {
  it('<label for> と <input type="search"> を対にし、groups をそのまま入れる', () => {
    expect(markup({ id: 'cmd', label: 'コマンド', groups: GROUPS })).toBe(
      '<rd-command><label for="cmd">コマンド</label>'
        + `<input id="cmd" type="search" autocomplete="off">${GROUPS}</rd-command>`,
    )
  })

  it('filter / empty-text / placeholder / defaultValue は指定したときだけ出る', () => {
    expect(
      markup({
        id: 'cmd',
        label: 'コマンド',
        groups: GROUPS,
        filter: 'prefix',
        emptyText: '該当なし',
        placeholder: '打って絞る',
        defaultValue: 'ノート',
      }),
    ).toBe(
      '<rd-command filter="prefix" empty-text="該当なし"><label for="cmd">コマンド</label>'
        + '<input id="cmd" type="search" autocomplete="off" placeholder="打って絞る" value="ノート">'
        + `${GROUPS}</rd-command>`,
    )
  })

  it('label はエスケープし、groups（信頼済みの断片）はエスケープしない', () => {
    const html = markup({ id: 'a', label: '<b>x</b>', groups: GROUPS })
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(html).toContain(GROUPS)
  })
})

describe('commandGroupMarkup', () => {
  it('label があれば aria-label 付きの <ul>、無ければ素の <ul>', () => {
    expect(commandGroupMarkup({ label: 'ページ', items: '<li></li>' })).toBe(
      '<ul aria-label="ページ"><li></li></ul>',
    )
    expect(commandGroupMarkup({ items: '<li></li>' })).toBe('<ul><li></li></ul>')
  })

  it('見出しをエスケープする', () => {
    expect(commandGroupMarkup({ label: '"x"', items: '' })).toBe(
      '<ul aria-label="&quot;x&quot;"></ul>',
    )
  })
})

describe('commandItemMarkup', () => {
  it('href があればリンク、無ければ button', () => {
    expect(commandItemMarkup({ label: 'ホーム', href: '/' })).toBe(
      '<li><a href="/">ホーム</a></li>',
    )
    expect(commandItemMarkup({ label: '新規' })).toBe(
      '<li><button type="button">新規</button></li>',
    )
  })

  it('value はリンクなら data-value、ボタンなら value 属性になる', () => {
    expect(commandItemMarkup({ label: 'ホーム', href: '/', value: 'home' })).toBe(
      '<li><a href="/" data-value="home">ホーム</a></li>',
    )
    expect(commandItemMarkup({ label: '新規', value: 'new' })).toBe(
      '<li><button type="button" value="new">新規</button></li>',
    )
  })

  it('keywords は空白区切りの別名、shortcut は <kbd> で出す', () => {
    expect(
      commandItemMarkup({
        label: '設定',
        href: '/settings',
        keywords: 'preferences config',
        shortcut: '⌘,',
      }),
    ).toBe(
      '<li><a href="/settings" data-keywords="preferences config">'
        + '設定<kbd class="rd-kbd">⌘,</kbd></a></li>',
    )
  })

  it('文言・値・href をすべてエスケープする', () => {
    expect(commandItemMarkup({ label: '<b>x</b>', href: '/?a="b"', shortcut: '<' })).toBe(
      '<li><a href="/?a=&quot;b&quot;">&lt;b&gt;x&lt;/b&gt;<kbd class="rd-kbd">&lt;</kbd></a></li>',
    )
  })
})

describe('contract', () => {
  it('必須の役割が揃っていれば ok', () => {
    expect(contract.required).toEqual(['label', 'control', 'list'])
    expect(checkContract(hostWith(ALL), contract).kind).toBe('ok')
  })

  it('必須の役割が無ければ missing になり、無い役割名が返る', () => {
    expect(checkContract(hostWith([]), contract)).toEqual({
      kind: 'missing',
      roles: ['label', 'control', 'list'],
    })
  })

  it('<ul> だけ欠けても missing（項目の一覧が無ければ絞り込めない）', () => {
    expect(checkContract(hostWith(ALL.slice(0, 2)), contract)).toEqual({
      kind: 'missing',
      roles: ['list'],
    })
  })
})
