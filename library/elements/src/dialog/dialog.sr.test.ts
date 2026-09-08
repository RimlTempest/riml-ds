import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdDialog } from './dialog.element.js'
// rd-dialog を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './dialog.define.js'

const DIALOG = '<rd-dialog><h2 slot="label">削除の確認</h2><p>元に戻せません。</p></rd-dialog>'

/** phrase が読まれるまで順に進む（仮想 SR の移動は本質的に逐次なので再帰で書く） */
const advanceTo = async (phrase: string, remaining: number): Promise<string> => {
  const spoken = await virtual.lastSpokenPhrase()
  if (spoken.includes(phrase) || remaining === 0) {
    return spoken
  }
  await virtual.next()
  return advanceTo(phrase, remaining - 1)
}

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

it('開いたダイアログが slot のラベルつきで読まれる', async () => {
  const el = await fixtureOf(RdDialog, DIALOG)
  el.show()
  await el.updateComplete
  await virtual.start({ container: el })
  expect(await advanceTo('削除の確認', 8)).toContain('削除の確認')
})

it('本文が読み上げに含まれる', async () => {
  const el = await fixtureOf(RdDialog, DIALOG)
  el.show()
  await el.updateComplete
  await virtual.start({ container: el })
  expect(await advanceTo('元に戻せません。', 8)).toContain('元に戻せません。')
})

it('読み上げるダイアログの名前に「閉じる」が混ざらない（ADR-0014 決定 2）', async () => {
  const el = await fixtureOf(RdDialog, DIALOG)
  el.show()
  await el.updateComplete
  await virtual.start({ container: el })
  const spoken = await advanceTo('削除の確認', 8)
  expect(spoken).toContain('削除の確認')
  expect(spoken).not.toContain('閉じる')
})

/**
 * `alert`（plan 022）は `<dialog role="alertdialog">` にするだけで、読み上げの中身は変えない。
 * 役割そのものは shadow の `<dialog>` に付くので仮想 SR の走査には出ない（属性は `dialog.test.ts` が見る）。
 * ここで固定するのは「名前と本文が変わらないこと」＝ 帯の × が名前に混ざらないこと。
 */
it('alert でも名前は slot のラベルのまま（× が混ざらない）', async () => {
  const el = await fixtureOf(
    RdDialog,
    '<rd-dialog alert><h2 slot="label">削除の確認</h2><p>元に戻せません。</p></rd-dialog>',
  )
  el.show()
  await el.updateComplete
  await virtual.start({ container: el })
  const spoken = await advanceTo('削除の確認', 8)
  expect(spoken).toContain('削除の確認')
  expect(spoken).not.toContain('閉じる')
  expect(await advanceTo('元に戻せません。', 8)).toContain('元に戻せません。')
})
