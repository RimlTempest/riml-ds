import { expect, test } from '@playwright/test'
import {
  calendarSuite,
  carouselSuite,
  comboboxSuite,
  commandSuite,
  dataTableSuite,
  formWave4Suite,
  frameworkSuite,
  meterAndWindowSuite,
  navigationSuite,
  radioGroupAndSliderSuite,
  splitterSuite,
  toggleGroupSuite,
  toggleSuite,
} from './shared.js'

frameworkSuite('react')
meterAndWindowSuite('react')
radioGroupAndSliderSuite('react')
navigationSuite('react')
formWave4Suite('react')
toggleSuite('react')
comboboxSuite('react')
splitterSuite('react')
commandSuite('react')
dataTableSuite('react')
calendarSuite('react')
carouselSuite('react')
toggleGroupSuite('react')

test.describe('react: controlled の再同期', () => {
  test('親が拒否した文字は入力欄から消える（<input> と同じ意味論）', async ({ page }) => {
    await page.goto('/controlled.html')
    const input = page.getByLabel('メール')
    await expect(input).toHaveValue('abc')
    await input.pressSequentially('d')
    await expect(input).toHaveValue('abc')
  })
})
