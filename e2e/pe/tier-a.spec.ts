import { expect, test } from '@playwright/test'

/**
 * ティア A は **JS 無しで動く**（ADR-0012）。送信・検証・ラベル関連付けはブラウザが素で行う。
 * この project は `javaScriptEnabled: false`。axe は別 project（`pe-axe`）が見る
 * （axe 自身がページに JS を注入するため。ページに `<script>` は 1 つも無いので DOM は同じ）。
 */
test('button: JS 無しでも押せて、フォームがネイティブに送信される', async ({ page }) => {
  await page.goto('/button.html')
  const submit = page.getByRole('button', { name: '送信' })
  await expect(submit).toBeVisible()
  await submit.click()
  await expect(page).toHaveURL(/\/echo\.html/u)
  await expect(page.getByRole('heading', { name: '送信済み' })).toBeVisible()
})

test('button: JS 無しでも <name>.css が当たる（タップ標的 44px）', async ({ page }) => {
  await page.goto('/button.html')
  // --rd-sizing-target-min: 2.75rem = 44px（WCAG 2.2 Target Size）
  await expect(page.locator('rd-button > button')).toHaveCSS('min-block-size', '44px')
})

test('text-field: JS 無しでも入力が送信される', async ({ page }) => {
  await page.goto('/text-field.html')
  await page.getByLabel('メール').fill('name@example.com')
  await page.getByRole('button', { name: '送信' }).click()
  await expect(page).toHaveURL(/email=name%40example\.com/u)
})

test('text-field: required が空なら遷移しない（ネイティブ検証）', async ({ page }) => {
  await page.goto('/text-field.html')
  await page.getByRole('button', { name: '送信' }).click()
  await expect(page).toHaveURL(/\/text-field\.html$/u)
  await expect(page.getByLabel('メール')).toBeFocused()
})

test('skip link: JS 無しでも Tab で現れ、Enter で本文へ飛ぶ', async ({ page }) => {
  await page.goto('/button.html')
  const link = page.getByRole('link', { name: '本文へ' })
  await page.keyboard.press('Tab')
  await expect(link).toBeFocused()
  await expect(link).toBeInViewport()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#main$/u)
})
