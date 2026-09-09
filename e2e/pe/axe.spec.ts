import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { AXE_TAGS } from '../axe-tags.js'

/**
 * JS 無しのページに対する axe（AAA 込み）。
 * axe 自身はページに JS を注入して走るので、この project だけ `javaScriptEnabled: true` にする。
 * **ページには `<script>` が 1 つも無い**（`build-pages.ts` が保証）ので、JS の有無で DOM は変わらない
 * ＝ ここで見ているのは「JS 無しのときの DOM」そのもの。
 */
const PAGES = [
  '/button.html',
  '/calendar.html',
  '/text-field.html',
  '/select.html',
  '/checkbox.html',
  '/checkbox-group.html',
  '/combobox.html',
  '/command.html',
  '/disclosure.html',
  '/input-otp.html',
  '/meter.html',
  '/dialog.html',
  '/dialog-sheet.html',
  '/card.html',
  '/window.html',
  '/tabs.html',
  '/menu.html',
  '/popover.html',
  '/hover-card.html',
  '/context-menu.html',
  '/nav-menu.html',
  '/tooltip.html',
  '/navigation.html',
  '/live-region.html',
  '/button-group.html',
  '/toggle.html',
  '/input-group.html',
  '/radio-group.html',
  '/slider.html',
  '/splitter.html',
  '/data-table.html',
  '/carousel.html',
  '/toggle-group.html',
] as const

for (const path of PAGES) {
  test(`axe (AAA): ${path}`, async ({ page }) => {
    await page.goto(path)
    const results = await new AxeBuilder({ page }).withTags([...AXE_TAGS]).analyze()
    expect(results.violations).toEqual([])
  })
}
