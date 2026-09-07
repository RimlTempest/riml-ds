import { fireEvent, render } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { RdButton, RdTextField } from '../src/client.js'

/** 親が `abc` までしか受け付けない controlled。ADR-0012 §5 の「拒否されたら戻る」 */
const Limited = (): React.ReactNode => {
  const [value, setValue] = useState('abc')
  return (
    <RdTextField
      label="メール"
      name="email"
      value={value}
      onInput={(event) => {
        if (event.currentTarget.value.length <= 3) {
          setValue(event.currentTarget.value)
        }
      }}
    />
  )
}

const Uncontrolled = (): React.ReactNode => (
  <RdTextField label="メール" name="email" defaultValue="abc" />
)

describe('client ラッパー', () => {
  it('controlled で親が値を拒否すると入力欄の値が戻る', () => {
    const { container } = render(<Limited />)
    const input = container.querySelector('input')
    expect(input?.value).toBe('abc')
    fireEvent.input(input ?? document.createElement('input'), { target: { value: 'abcd' } })
    expect(input?.value).toBe('abc')
  })

  it('uncontrolled は入力した値が残る', () => {
    const { container } = render(<Uncontrolled />)
    const input = container.querySelector('input')
    fireEvent.input(input ?? document.createElement('input'), { target: { value: 'abcd' } })
    expect(input?.value).toBe('abcd')
  })

  it('onRdPress が rd-press を受ける', () => {
    const onRdPress = vi.fn<(event: CustomEvent) => void>()
    const { container } = render(<RdButton onRdPress={onRdPress}>保存</RdButton>)
    const host = container.querySelector('rd-button')
    host?.dispatchEvent(new CustomEvent('rd-press', { detail: {}, bubbles: true }))
    expect(onRdPress).toHaveBeenCalledTimes(1)
  })

  it('ref はホスト要素（ティア A はネイティブ要素が子）', () => {
    const seen: HTMLElement[] = []
    render(
      <RdTextField
        ref={(element) => {
          if (element !== null) {
            seen.push(element)
          }
        }}
        label="メール"
        name="email"
      />,
    )
    expect(seen[0]?.tagName.toLowerCase()).toBe('rd-text-field')
    expect(seen[0]?.querySelector('input')).not.toBeNull()
  })
})
