import { expect, test } from '@playwright/test'
import { storiesNamed, storyUrl, waitForStoryFinished } from '../stories.js'

/**
 * `forced-colors: active` は CSS のメディア特性で、ページの JS からは切り替えられない。
 * だから Storybook 上では見た目が変わらず、ここ（Playwright のエミュレーション）だけが検証面になる。
 */
for (const story of storiesNamed('Forced Colors')) {
  test(story.id, async ({ page }) => {
    await page.goto(storyUrl(story.id))
    await page.locator('#storybook-root').waitFor()
    await waitForStoryFinished(page, story.id)
    await expect(page).toHaveScreenshot(`${story.id}.png`)
  })
}
