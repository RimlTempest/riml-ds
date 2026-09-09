import { describe, expect, it } from 'vitest'
import {
  computeStates,
  type ItemState,
  moveIndex,
  parseMode,
  parseOrientation,
  parseVariant,
  pressAt,
  selectedValues,
  tabStopIndex,
} from './toggle-group.logic.js'

const item = (value: string, pressed = false, disabled = false): ItemState => ({
  value,
  pressed,
  disabled,
})

describe('parseMode', () => {
  it('single だけが single。知らない値も null も multiple', () => {
    expect(parseMode('single')).toBe('single')
    expect(parseMode('multiple')).toBe('multiple')
    expect(parseMode('nope')).toBe('multiple')
    expect(parseMode(null)).toBe('multiple')
  })
})

describe('parseOrientation', () => {
  it('vertical だけが vertical。知らない値も null も horizontal', () => {
    expect(parseOrientation('vertical')).toBe('vertical')
    expect(parseOrientation('horizontal')).toBe('horizontal')
    expect(parseOrientation('nope')).toBe('horizontal')
    expect(parseOrientation(null)).toBe('horizontal')
  })
})

describe('parseVariant', () => {
  it('rd-toggle の正規化を再利用する。知らない値も null も outline', () => {
    expect(parseVariant('ghost')).toBe('ghost')
    expect(parseVariant('outline')).toBe('outline')
    expect(parseVariant('nope')).toBe('outline')
    expect(parseVariant(null)).toBe('outline')
  })
})

describe('pressAt', () => {
  const items = [item('b'), item('i'), item('u')]

  it('multiple では押した 1 個だけが反転し、他はそのまま', () => {
    expect(pressAt(items, 1, 'multiple')).toEqual([false, true, false])
    expect(pressAt([item('b', true), item('i'), item('u')], 1, 'multiple')).toEqual([
      true,
      true,
      false,
    ])
  })

  it('single では押した 1 個だけが true になり、他は false に戻る', () => {
    expect(pressAt([item('b', true), item('i'), item('u')], 1, 'single')).toEqual([
      false,
      true,
      false,
    ])
  })

  it('single で既に押されている項目を押すと解除される（0 個も許す）', () => {
    expect(pressAt([item('b', true), item('i'), item('u')], 0, 'single')).toEqual([
      false,
      false,
      false,
    ])
  })

  it('multiple でも押されている項目を押すと解除される', () => {
    expect(pressAt([item('b', true), item('i', true), item('u')], 0, 'multiple')).toEqual([
      false,
      true,
      false,
    ])
  })

  it('disabled な項目は押せない（そのまま返す）', () => {
    const withDisabled = [item('b', true), item('i', false, true), item('u')]
    expect(pressAt(withDisabled, 1, 'multiple')).toEqual([true, false, false])
    expect(pressAt(withDisabled, 1, 'single')).toEqual([true, false, false])
  })

  it('範囲外の index は何も変えない', () => {
    expect(pressAt(items, 9, 'single')).toEqual([false, false, false])
    expect(pressAt(items, -1, 'multiple')).toEqual([false, false, false])
  })
})

describe('selectedValues', () => {
  it('pressed な項目の value を DOM 順で返す', () => {
    expect(selectedValues([item('b', true), item('i'), item('u', true)])).toEqual(['b', 'u'])
  })

  it('1 個も押されていなければ空', () => {
    expect(selectedValues([item('b'), item('i')])).toEqual([])
  })
})

describe('tabStopIndex', () => {
  it('最初の pressed で enabled な項目', () => {
    expect(tabStopIndex([item('b'), item('i', true), item('u', true)])).toBe(1)
  })

  it('pressed が disabled なら次点として最初の enabled', () => {
    expect(tabStopIndex([item('b', true, true), item('i'), item('u')])).toBe(1)
  })

  it('1 個も押されていなければ最初の enabled', () => {
    expect(tabStopIndex([item('b', false, true), item('i'), item('u')])).toBe(1)
  })

  it('全部 disabled なら -1', () => {
    expect(tabStopIndex([item('b', true, true), item('i', false, true)])).toBe(-1)
  })

  it('項目が無ければ -1', () => {
    expect(tabStopIndex([])).toBe(-1)
  })
})

describe('moveIndex', () => {
  const items = [item('b'), item('i'), item('u')]

  it('→ で次へ、← で前へ（horizontal）', () => {
    expect(moveIndex(items, 0, 'ArrowRight', 'horizontal')).toBe(1)
    expect(moveIndex(items, 1, 'ArrowLeft', 'horizontal')).toBe(0)
  })

  it('端では折り返す', () => {
    expect(moveIndex(items, 2, 'ArrowRight', 'horizontal')).toBe(0)
    expect(moveIndex(items, 0, 'ArrowLeft', 'horizontal')).toBe(2)
  })

  it('Home は先頭、End は末尾', () => {
    expect(moveIndex(items, 1, 'Home', 'horizontal')).toBe(0)
    expect(moveIndex(items, 1, 'End', 'horizontal')).toBe(2)
  })

  it('向きの違う矢印は扱わない（呼び側は preventDefault しない）', () => {
    expect(moveIndex(items, 0, 'ArrowDown', 'horizontal')).toBeUndefined()
    expect(moveIndex(items, 0, 'ArrowRight', 'vertical')).toBeUndefined()
    expect(moveIndex(items, 0, 'a', 'horizontal')).toBeUndefined()
  })

  it('vertical では ↓ ↑ で動く', () => {
    expect(moveIndex(items, 0, 'ArrowDown', 'vertical')).toBe(1)
    expect(moveIndex(items, 0, 'ArrowUp', 'vertical')).toBe(2)
  })

  it('disabled を飛ばして次の enabled へ行く', () => {
    const gapped = [item('b'), item('i', false, true), item('u')]
    expect(moveIndex(gapped, 0, 'ArrowRight', 'horizontal')).toBe(2)
    expect(moveIndex(gapped, 2, 'ArrowRight', 'horizontal')).toBe(0)
    expect(moveIndex(gapped, 2, 'ArrowLeft', 'horizontal')).toBe(0)
  })

  it('End は disabled ではない最後の項目', () => {
    const gapped = [item('b'), item('i'), item('u', false, true)]
    expect(moveIndex(gapped, 0, 'End', 'horizontal')).toBe(1)
  })

  it('全部 disabled なら動けない', () => {
    expect(moveIndex([item('b', false, true)], 0, 'ArrowRight', 'horizontal')).toBeUndefined()
    expect(moveIndex([], 0, 'Home', 'horizontal')).toBeUndefined()
  })
})

describe('computeStates', () => {
  it('variant / mode / orientation がそのまま状態になる', () => {
    expect(
      [
        ...computeStates({
          mode: 'multiple',
          orientation: 'horizontal',
          variant: 'outline',
          malformed: false,
        }),
      ].toSorted(),
    ).toEqual(['horizontal', 'multiple', 'outline'])
    expect(
      [
        ...computeStates({
          mode: 'single',
          orientation: 'vertical',
          variant: 'ghost',
          malformed: false,
        }),
      ].toSorted(),
    ).toEqual(['ghost', 'single', 'vertical'])
  })

  it('契約の子が無ければ malformed だけを出す', () => {
    expect([
      ...computeStates({
        mode: 'single',
        orientation: 'vertical',
        variant: 'ghost',
        malformed: true,
      }),
    ]).toEqual(['malformed'])
  })
})
