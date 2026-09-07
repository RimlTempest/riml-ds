/** controlled の再同期を確かめるページ（React だけ）。親は 3 文字までしか受け付けない */
import { RdTextField } from '@rimltempest/riml-ds-react/client'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './defines.js'
import './styles.css'

const Limited = (): ReactNode => {
  const [value, setValue] = useState('abc')
  return (
    <main>
      <h1>controlled</h1>
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
    </main>
  )
}

const root = document.querySelector('#root')
if (root !== null) {
  createRoot(root).render(<Limited />)
}
