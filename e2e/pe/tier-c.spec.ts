import { expect, test } from '@playwright/test'

/** ティア C は **JS 無しでは何も起きない**（害が無い）。読み上げ用のノードも出ない */
test('live-region: JS 無しでは何も出ない', async ({ page }) => {
  await page.goto('/live-region.html')
  const region = page.locator('rd-live-region')
  await expect(region).toHaveCount(1)
  await expect(region).toHaveText('')
})

/**
 * `rd-tooltip` も同じ約束。JS が無ければ**吹き出しを出さず**、説明は対象の `title` が持つ。
 *
 * 文言そのものは素のテキストとして流れる——ティア C は `<name>.css` を持てない
 * （`scripts/guard.sh` 検査 8）ので、`rd-tooltip:not(:defined)` を隠す先が無い。
 * 「害が無い」の範囲だが、回帰に気づけるようにここで固定しておく（plan 020 の報告事項）。
 */
test('tooltip: JS 無しでは吹き出しを作らず、title が説明を持つ', async ({ page }) => {
  await page.goto('/tooltip.html')
  await expect(page.locator('rd-tooltip [popover]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '保存' })).toHaveAttribute(
    'title',
    '⌘S で保存します',
  )
  await expect(page.locator('rd-tooltip')).toHaveText('⌘S で保存します')
})
