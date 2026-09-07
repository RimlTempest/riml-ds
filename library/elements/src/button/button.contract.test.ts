import { describe, expect, it } from 'vitest'
import { markup } from './button.contract.js'

describe('markup', () => {
  it('ネイティブの <button> を包んだ HTML を返す', () => {
    expect(markup({ label: '保存', type: 'submit' })).toBe(
      '<rd-button><button type="submit">保存</button></rd-button>',
    )
  })

  it('variant と loading は指定したときだけ属性に出る', () => {
    expect(markup({ label: '削除', variant: 'danger', loading: true })).toBe(
      '<rd-button variant="danger" loading><button>削除</button></rd-button>',
    )
  })

  it('label をエスケープする', () => {
    expect(markup({ label: '<script>x</script>' })).toBe(
      '<rd-button><button>&lt;script&gt;x&lt;/script&gt;</button></rd-button>',
    )
  })
})
