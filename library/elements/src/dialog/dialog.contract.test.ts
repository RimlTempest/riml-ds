import { describe, expect, it } from 'vitest'
import { markup } from './dialog.contract.js'

describe('markup', () => {
  it('slot="label" の見出しと本文を持つ HTML を返す', () => {
    expect(markup({ label: '削除の確認', children: '<p>元に戻せません。</p>' })).toBe(
      '<rd-dialog><h2 slot="label">削除の確認</h2><p>元に戻せません。</p></rd-dialog>',
    )
  })

  it('open / persistent は指定したときだけ属性に出る。label はエスケープする', () => {
    expect(markup({ label: '<b>x</b>', children: '', open: true, persistent: false })).toBe(
      '<rd-dialog open><h2 slot="label">&lt;b&gt;x&lt;/b&gt;</h2></rd-dialog>',
    )
  })

  it('persistent は属性として書ける（既定 false なので存在で true）', () => {
    expect(markup({ label: '確定', children: '', persistent: true })).toBe(
      '<rd-dialog persistent><h2 slot="label">確定</h2></rd-dialog>',
    )
  })
})
