import { expect, test } from '@playwright/test'

/** ティア C は **JS 無しでは何も起きない**（害が無い）。読み上げ用のノードも出ない */
test('live-region: JS 無しでは何も出ない', async ({ page }) => {
  await page.goto('/live-region.html')
  const region = page.locator('rd-live-region')
  await expect(region).toHaveCount(1)
  await expect(region).toHaveText('')
})
