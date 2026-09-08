import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, it } from 'vitest'
import { cleanupFixtures } from '../../test/fixture.js'
// rd-radio-group を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './radio-group.define.js'

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

// oxlint-disable-next-line vitest/warn-todo -- 雛形。実装のときに本物のテストへ置き換える
it.todo('TODO: 仮想スクリーンリーダーで読み上げ内容を固定する（対話部品は必須）')
