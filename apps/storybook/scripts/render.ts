/**
 * 描画後の DOM を HTML に落とし、markuplint に食わせる（ADR-0006）。
 * shadow root は `getHTML({ serializableShadowRoots: true })` で `<template shadowrootmode>` として出る。
 * **shadow を `serializable: true` で attach していない部品は中身が出ない**（今は rd-live-region が該当）。
 *
 * 生成物は `apps/storybook/rendered/`（gitignore）。`bun run render` から呼ぶ。
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Page } from 'playwright'

const here = dirname(fileURLToPath(import.meta.url))
const staticDir = join(here, '../storybook-static')
const outDir = join(here, '../rendered')
const PORT = 6007

type StoryEntry = { readonly id: string; readonly type: string }

const isStoryEntry = (value: unknown): value is StoryEntry =>
  typeof value === 'object'
  && value !== null
  && typeof Reflect.get(value, 'id') === 'string'
  && typeof Reflect.get(value, 'type') === 'string'

const storyIds = (index: unknown): readonly string[] => {
  const entries = typeof index === 'object' && index !== null ? Reflect.get(index, 'entries') : {}
  const values = typeof entries === 'object' && entries !== null ? Object.values(entries) : []
  return values.flatMap((entry) =>
    isStoryEntry(entry) && entry.type === 'story' ? [entry.id] : [],
  )
}

const page = (id: string, body: string): string =>
  `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <title>${id}</title>
  </head>
  <body>
${body}
  </body>
</html>
`

/** `play` の途中を掴まないよう、Storybook の描画完了まで待つ（`e2e/stories.ts` と同じ判定） */
const waitForStoryFinished = async (tab: Page, id: string): Promise<void> => {
  await tab.waitForFunction((storyId) => {
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

const renderOne = async (tab: Page, id: string): Promise<void> => {
  await tab.goto(`http://localhost:${PORT}/iframe.html?id=${id}&viewMode=story`)
  await tab.locator('#storybook-root').waitFor()
  await waitForStoryFinished(tab, id)
  const body = await tab.evaluate(
    () =>
      document.querySelector('#storybook-root')?.getHTML({ serializableShadowRoots: true }) ?? '',
  )
  await writeFile(join(outDir, `${id}.html`), page(id, body))
}

const main = async (): Promise<void> => {
  const index: unknown = JSON.parse(await readFile(join(staticDir, 'index.json'), 'utf8'))
  const ids = storyIds(index)
  const server = Bun.serve({
    port: PORT,
    fetch: async (request) => {
      const path = new URL(request.url).pathname
      const file = Bun.file(join(staticDir, path === '/' ? '/index.html' : path))
      return (await file.exists()) ? new Response(file) : new Response('not found', { status: 404 })
    },
  })
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })
  const browser = await chromium.launch()
  const tab = await browser.newPage()
  for (const id of ids) {
    // oxlint-disable-next-line eslint/no-await-in-loop -- タブ 1 つを順に使う（39 枚を並列に開くと重い）
    await renderOne(tab, id)
  }
  await browser.close()
  await server.stop(true)
  process.stdout.write(`render: ${ids.length} story → apps/storybook/rendered/\n`)
}

await main()
