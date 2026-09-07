/**
 * `skills/riml-ds/SKILL.md` §3 が利用側に約束している React の書き方を、そのまま型検査＋描画する。
 * ここが落ちたら skill の記述か API のどちらかが間違っている（skill を直す前に相談する）。
 */
import { render } from '@testing-library/react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RdButton as RdButtonClient, RdTextField as RdTextFieldClient } from '../src/client.js'
import { RdButton, RdTextField } from '../src/index.js'

const saveAction = async (): Promise<void> => {}
const save = (): void => {}

/** skill §3: サーバーコンポーネント（RSC）でも使える */
const ServerForm = (): ReactNode => (
  <form action={saveAction}>
    <RdTextField label="メール" name="email" type="email" required hint="確認メールを送ります" />
    <RdButton type="submit">保存</RdButton>
  </form>
)

/** skill §3: クライアントコンポーネント（controlled と独自イベント） */
const ClientForm = (): ReactNode => {
  const [email, setEmail] = useState('')
  return (
    <>
      <RdTextFieldClient
        label="メール"
        name="email"
        value={email}
        onInput={(e) => setEmail(e.currentTarget.value)}
      />
      <RdButtonClient onRdPress={() => save()}>保存</RdButtonClient>
    </>
  )
}

describe('skills/riml-ds §3 の API', () => {
  it('RSC 版の例がそのまま描ける', () => {
    const html = renderToString(<ServerForm />)
    expect(html).toContain('<rd-text-field hint="確認メールを送ります">')
    expect(html).toContain('<button type="submit">保存</button>')
  })

  it('client 版の例がそのまま描ける', () => {
    const { container } = render(<ClientForm />)
    expect(container.querySelector('input')?.value).toBe('')
    expect(container.querySelector('rd-button button')?.textContent).toBe('保存')
  })
})
