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

/**
 * ティア A だが「JS があるときの操作」は Storybook 側で見る（`e2e/pe` は JS 無しの面）。
 * APG「Combobox with List Autocomplete」: ↓ で開いて `aria-activedescendant`、
 * 打つと絞られ、Enter で確定してフォーカスは `<input>` に残る。
 */
test('combobox: ↓ で候補が開き、打つと絞られ、Enter で確定する', async ({ page }) => {
  await page.goto(storyUrl('components-combobox--default'))
  await waitForStoryFinished(page, 'components-combobox--default')
  const control = page.getByRole('combobox', { name: '読み' })
  const options = page.locator("rd-combobox [role='option']")
  await control.click()
  await page.keyboard.press('ArrowDown')
  await expect(control).toHaveAttribute('aria-expanded', 'true')
  await expect(options).toHaveCount(5)
  await expect(control).toHaveAttribute(
    'aria-activedescendant',
    (await options.first().getAttribute('id')) ?? '',
  )
  await page.keyboard.type('か')
  await expect(options).toHaveCount(2)
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(control).toHaveValue('kana')
  await expect(control).toHaveAttribute('aria-expanded', 'false')
  await expect(control).toBeFocused()
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
