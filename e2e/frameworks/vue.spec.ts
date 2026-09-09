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

frameworkSuite('vue')
meterAndWindowSuite('vue')
radioGroupAndSliderSuite('vue')
navigationSuite('vue')
formWave4Suite('vue')
toggleSuite('vue')
comboboxSuite('vue')
splitterSuite('vue')
commandSuite('vue')
dataTableSuite('vue')
calendarSuite('vue')
carouselSuite('vue')
toggleGroupSuite('vue')

test.describe('vue: <select> の v-model', () => {
  test('選択すると v-model の値が変わる', async ({ page }) => {
    await page.goto('/')
    const echo = page.locator('#country-echo')
    await expect(echo).toHaveText('')
    await page.getByLabel('国').selectOption('jp')
    await expect(echo).toHaveText('jp')
  })
})
