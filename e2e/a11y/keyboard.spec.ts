import { AxeBuilder } from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { AXE_TAGS } from '../axe-tags.js'
import { storiesNamed, storyUrl, waitForStoryFinished } from '../stories.js'

/**
 * `#storybook-root` に絞って走らせる。iframe.html は Storybook のシェルで、
 * `<h1>` や `<title>` はページ全体の規則（pageLevel）にしか関係しない。
 * 部品の責務はランドマークの中身なので、そこだけを見る。
 */
const analyze = async (page: Page) =>
  new AxeBuilder({ page })
    .include('#storybook-root')
    .withTags([...AXE_TAGS])
    .analyze()

for (const story of storiesNamed('Default')) {
  test(`axe: ${story.id}`, async ({ page }) => {
    await page.goto(storyUrl(story.id))
    await page.locator('#storybook-root').waitFor()
    await waitForStoryFinished(page, story.id)
    const results = await analyze(page)
    expect(results.violations).toEqual([])
  })
}

test('dialog: opener から Enter で開き、Esc で閉じてフォーカスが戻る', async ({ page }) => {
  await page.goto(storyUrl('components-dialog--default'))
  await waitForStoryFinished(page, 'components-dialog--default')
  const opener = page.locator('rd-button > button').first()
  await opener.focus()
  await opener.press('Enter')
  await expect
    .poll(async () =>
      page.evaluate(() => document.querySelector('rd-dialog')?.hasAttribute('open')),
    )
    .toBe(true)
  // モーダルの中にフォーカスが入っている（delegatesFocus）
  await expect
    .poll(async () => page.evaluate(() => document.activeElement?.closest('rd-dialog') !== null))
    .toBe(true)
  await page.keyboard.press('Escape')
  await expect
    .poll(async () =>
      page.evaluate(() => document.querySelector('rd-dialog')?.hasAttribute('open')),
    )
    .toBe(false)
  await expect(opener).toBeFocused()
})

test('dialog: persistent は Esc で閉じない', async ({ page }) => {
  await page.goto(storyUrl('components-dialog--persistent'))
  await waitForStoryFinished(page, 'components-dialog--persistent')
  await expect
    .poll(async () =>
      page.evaluate(() => document.querySelector('rd-dialog')?.hasAttribute('persistent')),
    )
    .toBe(true)
  await page.keyboard.press('Escape')
  await expect
    .poll(async () =>
      page.evaluate(() => document.querySelector('rd-dialog')?.hasAttribute('open')),
    )
    .toBe(true)
})

test('skip link: Tab で現れ、Enter で本文へ飛ぶ', async ({ page }) => {
  await page.goto(storyUrl('foundations-skiplink--default'))
  await waitForStoryFinished(page, 'foundations-skiplink--default')
  const link = page.getByRole('link', { name: '本文へ' })
  // フォーカスが無いときは clip-path で潰れている（.rd-visually-hidden と同じ 5 宣言）
  await expect(link).toHaveCSS('clip-path', 'inset(50%)')
  await page.keyboard.press('Tab')
  await expect(link).toBeFocused()
  await expect(link).toHaveCSS('clip-path', 'none')
  await page.keyboard.press('Enter')
  await expect.poll(async () => new URL(page.url()).hash).toBe('#sb-main')
})
