import { expect, test } from '@playwright/test'
import { frameworkSuite, meterAndWindowSuite } from './shared.js'

frameworkSuite('react')
meterAndWindowSuite('react')

test.describe('react: controlled の再同期', () => {
  test('親が拒否した文字は入力欄から消える（<input> と同じ意味論）', async ({ page }) => {
    await page.goto('/controlled.html')
    const input = page.getByLabel('メール')
    await expect(input).toHaveValue('abc')
    await input.pressSequentially('d')
    await expect(input).toHaveValue('abc')
  })
})
