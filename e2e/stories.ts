/**
 * Storybook の静的出力（`index.json`）から story 一覧を読む。
 * `index.json` は Storybook の内部形式なので、10.x 内で形が変わったらここだけ直す。
 *
 * VRT から外したい story は **タグ `no-vrt`** を付ける（`index.json` に `parameters` は載らないため）。
 * 理由はタグを付けた行のコメントに書く（docs/testing.md）。
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'

export type Story = { readonly id: string; readonly title: string; readonly name: string }

const indexPath = fileURLToPath(
  new URL('../apps/storybook/storybook-static/index.json', import.meta.url),
)

const readString = (source: unknown, key: string): string => {
  const value = typeof source === 'object' && source !== null ? Reflect.get(source, key) : undefined
  return typeof value === 'string' ? value : ''
}

const readTags = (source: unknown): readonly string[] => {
  const value = typeof source === 'object' && source !== null ? Reflect.get(source, 'tags') : []
  return Array.isArray(value) ? value.filter((tag) => typeof tag === 'string') : []
}

const entries = (): readonly unknown[] => {
  const index: unknown = JSON.parse(readFileSync(indexPath, 'utf8'))
  const all = typeof index === 'object' && index !== null ? Reflect.get(index, 'entries') : {}
  return typeof all === 'object' && all !== null ? Object.values(all) : []
}

const toStory = (entry: unknown): Story => ({
  id: readString(entry, 'id'),
  title: readString(entry, 'title'),
  name: readString(entry, 'name'),
})

/** VRT の対象。`no-vrt` タグが付いた story は外す */
export const vrtStories = (): readonly Story[] =>
  entries().flatMap((entry) =>
    readString(entry, 'type') === 'story' && !readTags(entry).includes('no-vrt')
      ? [toStory(entry)]
      : [],
  )

/** 指定した story 名（`Default` など）のものだけ */
export const storiesNamed = (name: string): readonly Story[] =>
  entries().flatMap((entry) =>
    readString(entry, 'type') === 'story' && readString(entry, 'name') === name
      ? [toStory(entry)]
      : [],
  )

export const storyUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`

/**
 * story の描画と `play` が終わるまで待つ。Storybook の内部状態
 * （`__STORYBOOK_PREVIEW__.storyRenders[].phase`）を見る。
 * これを待たないと、`play` の途中（dialog が開いている等）を axe やスクリーンショットが掴んで不安定になる。
 */
export const waitForStoryFinished = async (page: Page, id: string): Promise<void> => {
  await page.waitForFunction((storyId) => {
    const preview: unknown = Reflect.get(window, '__STORYBOOK_PREVIEW__')
    const renders =
      typeof preview === 'object' && preview !== null
        ? Reflect.get(preview, 'storyRenders')
        : undefined
    if (!Array.isArray(renders)) {
      return false
    }
    const done = new Set(['finished', 'completed', 'errored', 'aborted'])
    return renders.some(
      (render: unknown) =>
        Reflect.get(render, 'id') === storyId && done.has(String(Reflect.get(render, 'phase'))),
    )
  }, id)
}
