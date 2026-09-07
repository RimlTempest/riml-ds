import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdButton } from './button.element.js'
// rd-button を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './button.define.js'

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

it('button のロールとラベルが読まれる', async () => {
  const el = await fixtureOf(RdButton, '<rd-button><button type="button">保存</button></rd-button>')
  await virtual.start({ container: el })
  await virtual.next()
  expect(await virtual.lastSpokenPhrase()).toContain('button')
  expect(await virtual.lastSpokenPhrase()).toContain('保存')
})

it('loading のとき busy として読まれる', async () => {
  const el = await fixtureOf(
    RdButton,
    '<rd-button loading><button type="button">保存</button></rd-button>',
  )
  await virtual.start({ container: el })
  await virtual.next()
  expect(await virtual.lastSpokenPhrase()).toContain('busy')
})
