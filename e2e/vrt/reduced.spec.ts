import { expect, test } from '@playwright/test'
import { storiesNamed, storyUrl, waitForStoryFinished } from '../stories.js'

/** `prefers-reduced-motion: reduce` も同じ理由でここだけが検証面になる */
for (const story of storiesNamed('Reduced Motion')) {
  test(story.id, async ({ page }) => {
    await page.goto(storyUrl(story.id))
    await page.locator('#storybook-root').waitFor()
    await waitForStoryFinished(page, story.id)
    await expect(page).toHaveScreenshot(`${story.id}.png`)
  })
}
