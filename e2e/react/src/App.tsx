import { RdButton, RdDialog, RdTextField } from '@rimltempest/riml-ds-react'
import type { ReactNode } from 'react'

/** 4 フレームワークで同じ 1 ページ。既定 export（'use client' 無し）だけで組む */
export const App = (): ReactNode => (
  <main>
    <h1>お問い合わせ</h1>
    <form id="contact" method="get" action="/thanks.html">
      <RdTextField label="メール" name="email" type="email" required hint="確認メールを送ります" />
      <RdButton type="submit">送信</RdButton>
    </form>
    <RdDialog label="送信しました">
      <p>確認メールを送りました。</p>
    </RdDialog>
    <rd-live-region />
  </main>
)
