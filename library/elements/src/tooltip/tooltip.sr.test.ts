import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdTooltip } from './tooltip.element.js'
// rd-tooltip を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './tooltip.define.js'

const FIXTURE =
  '<div><button id="save" type="button" title="保存（⌘S）">保存</button>'
  + '<rd-tooltip for="save">⌘S で保存します</rd-tooltip></div>'

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

it('対象にフォーカスすると説明として読まれる（aria-describedby に任せる）', async () => {
  const host = await fixtureOf(HTMLDivElement, FIXTURE)
  const tip = host.querySelector('rd-tooltip')
  if (tip instanceof RdTooltip) {
    await tip.updateComplete
  }
  await virtual.start({ container: host })
  const spoken = await virtual.lastSpokenPhrase()
  expect(spoken).toContain('保存')
  expect(spoken).toContain('⌘S で保存します')
})
