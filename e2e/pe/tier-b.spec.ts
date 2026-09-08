import { expect, test } from '@playwright/test'

/**
 * ティア B は **JS 無しで内容が見える**（ADR-0012）。`rd-dialog:not(:defined)` の CSS が受け、
 * 見出しと本文が inline のセクションとして読める。隠れていたら fail。
 */
test('dialog: JS 無しでも見出しと本文が読める', async ({ page }) => {
  await page.goto('/dialog.html')
  await expect(page.getByRole('heading', { name: '確認' })).toBeVisible()
  await expect(page.getByText('保存しますか？')).toBeVisible()
})

test('dialog: JS 無しでも枠の見た目が当たる（:not(:defined)）', async ({ page }) => {
  await page.goto('/dialog.html')
  await expect(page.locator('rd-dialog')).toHaveCSS('display', 'block')
})

/**
 * `rd-window` も同じ約束。JS 無しでは帯だけを描き、**ボタンは出さない**
 * （押せない丸を置かない。ADR-0014 決定 1）。
 */
test('window: JS 無しでも見出しと本文が読める', async ({ page }) => {
  await page.goto('/window.html')
  await expect(page.getByRole('heading', { name: 'バックアップの設定' })).toBeVisible()
  await expect(page.getByText('毎晩 3 時に実行します。')).toBeVisible()
})

test('window: JS 無しでは操作の丸が 1 つも出ない', async ({ page }) => {
  await page.goto('/window.html')
  await expect(page.locator('rd-window')).toHaveCSS('display', 'block')
  await expect(page.locator('rd-window button')).toHaveCount(0)
})
