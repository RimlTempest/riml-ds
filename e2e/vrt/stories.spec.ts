import { expect, test } from '@playwright/test'
import { storyUrl, vrtStories, waitForStoryFinished } from '../stories.js'

/** ライト / ダーク × 幅 360 / 1024 の 4 枚（ADR-0007 決定 4）。撮るのは Docker の中だけ */
for (const story of vrtStories()) {
  test(story.id, async ({ page }) => {
    await page.goto(storyUrl(story.id))
    await page.locator('#storybook-root').waitFor()
    await waitForStoryFinished(page, story.id)
    await expect(page).toHaveScreenshot(`${story.id}.png`)
  })
}
