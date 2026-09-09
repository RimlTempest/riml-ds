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

const COMMAND = 'components-command--default'

const openCommand = async (page: Page) => {
  await page.goto(storyUrl(COMMAND))
  await waitForStoryFinished(page, COMMAND)
  const control = page.getByRole('searchbox', { name: 'コマンド' })
  await control.click()
  return control
}

test('command: 打つと項目が隠れ、0 件なら status で知らせる', async ({ page }) => {
  const control = await openCommand(page)
  const visible = page.locator('rd-command > ul > li:not([hidden])')
  await expect(visible).toHaveCount(5)
  await control.pressSequentially('せ')
  await expect(visible).toHaveCount(1)
  // 項目が全部隠れたグループは <ul> ごと隠れる（見出しだけ残さない）
  await expect(page.locator('rd-command > ul:not([hidden])')).toHaveCount(1)
  await expect(page.locator("rd-command [part='empty']")).toBeHidden()
  await control.pressSequentially('zzz')
  await expect(visible).toHaveCount(0)
  const empty = page.locator("rd-command [part='empty']")
  await expect(empty).toBeVisible()
  await expect(empty).toHaveAttribute('role', 'status')
  await expect(empty).toHaveText('見つかりません')
})

test('command: 入力欄の ↓ で項目へ移り、印字キーで入力欄に戻る', async ({ page }) => {
  const control = await openCommand(page)
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('link', { name: /ホーム/u })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('link', { name: /設定/u })).toBeFocused()
  // 項目に居ても打ち続けられる（1 文字が入力欄の末尾に足される）
  await page.keyboard.press('a')
  await expect(control).toBeFocused()
  await expect(control).toHaveValue('a')
  await page.keyboard.press('Backspace')
  await expect(control).toHaveValue('')
})

test('command: 入力欄の Enter が見えている 1 件目を押す', async ({ page }) => {
  const control = await openCommand(page)
  // 項目は本物のリンクなので既定動作は「飛ぶ」。story のページを離れないように止めて記録する
  await page.evaluate(() => {
    document.addEventListener(
      'click',
      (event) => {
        event.preventDefault()
        const target = event.target
        if (target instanceof HTMLElement) {
          document.documentElement.dataset['pressed'] = target.textContent ?? ''
        }
      },
      true,
    )
  })
  await control.pressSequentially('したがき')
  await expect(page.locator('rd-command > ul > li:not([hidden])')).toHaveCount(1)
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-pressed', '下書き')
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

/**
 * Hover Card（plan 026）。**JS がある**ときだけの近道なので、ここ（Storybook）で見る。
 * トリガーにフォーカスを入れると待たずに開き、**フォーカスは奪われない**
 * （読み中の人からフォーカスを取り上げない）。
 */
test('popover: hover はフォーカスで開き、フォーカスを奪わない', async ({ page }) => {
  await page.goto(storyUrl('components-popover--hover'))
  await waitForStoryFinished(page, 'components-popover--hover')
  const trigger = page.locator('rd-popover > [slot=trigger] button')
  await trigger.focus()
  await expect
    .poll(async () =>
      page.evaluate(() => document.querySelector('rd-popover [popover]')?.matches(':popover-open')),
    )
    .toBe(true)
  await expect(trigger).toBeFocused()
})

/**
 * Context Menu（plan 026）。右クリックはポインタの位置に開き、
 * **目に見えるボタンは残る**（APG: 常に見える代替を用意する）。
 */
test('menu: context は右クリックで開き、見えるボタンも残る', async ({ page }) => {
  await page.goto(storyUrl('components-menu--context'))
  await waitForStoryFinished(page, 'components-menu--context')
  await expect(page.getByRole('button', { name: 'その他の操作' })).toHaveAttribute(
    'popovertarget',
    'sb-menu-context',
  )
  await expect
    .poll(async () =>
      page.evaluate(() => document.querySelector('rd-menu [popover]')?.matches(':popover-open')),
    )
    .toBe(true)
  // ポインタの位置に置くあいだは CSS の anchor に任せない
  await expect(page.locator('rd-menu [popover]')).toHaveAttribute('style', /left/u)
})

/**
 * `rd-splitter`（plan 030）。APG「Window Splitter」のキー操作は **JS がある**ときだけの話なので
 * ここ（Storybook）で見る。つまみは shadow にあるので、焦点は host に再標的化される。
 */
const splitterStory = async (page: Page): Promise<void> => {
  await page.goto(storyUrl('components-splitter--default'))
  await waitForStoryFinished(page, 'components-splitter--default')
}

/** つまみは shadow の中。Playwright の CSS セレクタは open な shadow を貫く */
const splitterHandle = (page: Page) => page.locator('rd-splitter [part=handle]')

test('splitter: Tab でつまみに届く（フォーカスは host に再標的化される）', async ({ page }) => {
  await splitterStory(page)
  await page.keyboard.press('Tab')
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          document.activeElement?.tagName.toLowerCase() === 'rd-splitter'
          && document.activeElement?.shadowRoot?.activeElement?.getAttribute('part') === 'handle',
      ),
    )
    .toBe(true)
})

test('splitter: → で 1%、Shift+→ で 10% 動く', async ({ page }) => {
  await splitterStory(page)
  const handle = splitterHandle(page)
  await expect(handle).toHaveAttribute('aria-valuenow', '50')
  await handle.press('ArrowRight')
  await expect(handle).toHaveAttribute('aria-valuenow', '51')
  await handle.press('Shift+ArrowRight')
  await expect(handle).toHaveAttribute('aria-valuenow', '61')
})

test('splitter: End で max、Home で min まで行く', async ({ page }) => {
  await splitterStory(page)
  const handle = splitterHandle(page)
  await handle.press('End')
  await expect(handle).toHaveAttribute('aria-valuenow', '80')
  await handle.press('Home')
  await expect(handle).toHaveAttribute('aria-valuenow', '20')
  // 割合は host のインライン変数に出る（shadow の grid-template-* が読む）
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const el = document.querySelector('rd-splitter')
        return el instanceof HTMLElement ? el.style.getPropertyValue('--rd-splitter-position') : ''
      }),
    )
    .toBe('20%')
})

/**
 * `rd-data-table`（plan 029）。**JS があるときだけ**見出しがボタンになるので、ここ（Storybook）で見る。
 * 読み上げは `aria-sort` に任せる（`rd-live-region` を使わない。ADR-0008 §6）。
 */
const DATA_TABLE_STORY = 'components-datatable--default'

test('data table: 見出しを押すと aria-sort が付き、その列で昇順に並ぶ', async ({ page }) => {
  await page.goto(storyUrl(DATA_TABLE_STORY))
  await waitForStoryFinished(page, DATA_TABLE_STORY)
  const names = page.locator('rd-data-table tbody > tr > td:first-child')
  await expect(names.first()).toHaveText('レジ横の QR')
  await page.getByRole('button', { name: 'サイズ' }).click()
  await expect(page.getByRole('columnheader', { name: 'サイズ' })).toHaveAttribute(
    'aria-sort',
    'ascending',
  )
  // 比べるのは表示（「1,234」）ではなく `td[data-value]`（1234）
  await expect(names.first()).toHaveText('社内 Wi-Fi')
  await expect(names.last()).toHaveText('展示のカタログ')
})

test('data table: もう一度押すと降順になる（「無し」には戻さない）', async ({ page }) => {
  await page.goto(storyUrl(DATA_TABLE_STORY))
  await waitForStoryFinished(page, DATA_TABLE_STORY)
  const header = page.getByRole('columnheader', { name: 'サイズ' })
  const button = page.getByRole('button', { name: 'サイズ' })
  await button.click()
  await expect(header).toHaveAttribute('aria-sort', 'ascending')
  await button.click()
  await expect(header).toHaveAttribute('aria-sort', 'descending')
  // 降順の先頭は最大の 12,000（表示の「12,000」ではなく data-value の 12000 で比べる）
  await expect(page.locator('rd-data-table tbody > tr > td:first-child').first()).toHaveText(
    '展示のカタログ',
  )
  // 並べ替え中の列は 1 つだけ（APG）
  await expect(page.locator('rd-data-table [aria-sort]')).toHaveCount(1)
})

test('data table: Tab で見出しのボタンに届き、Enter で並ぶ', async ({ page }) => {
  await page.goto(storyUrl(DATA_TABLE_STORY))
  await waitForStoryFinished(page, DATA_TABLE_STORY)
  const button = page.getByRole('button', { name: '名前' })
  await page.keyboard.press('Tab')
  await expect(button).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('columnheader', { name: '名前' })).toHaveAttribute(
    'aria-sort',
    'ascending',
  )
  // 行を動かすだけなのでフォーカスは見出しに残る
  await expect(button).toBeFocused()
})

/**
 * `rd-calendar`（plan 033）。**JS があるときだけ**月表が出るので、ここ（Storybook）で見る。
 * Tab 順は自然な DOM 順（`<input>` → 前の月 → 次の月 → 焦点のある gridcell）。
 */
const CALENDAR_STORY = 'components-calendar--default'

test('calendar: Tab で入力欄 → 前の月 → 次の月 → 選ばれている日 の順に届く', async ({ page }) => {
  await page.goto(storyUrl(CALENDAR_STORY))
  await waitForStoryFinished(page, CALENDAR_STORY)
  await page.locator('rd-calendar > input').focus()
  // 日付欄は年・月・日の内部フィールドを持つので、Tab の回数はブラウザに任せて
  // 「入力欄を出たら前の月ボタンに着く」ことだけを見る（Tab 順は自然な DOM 順）
  await expect
    .poll(async () => {
      await page.keyboard.press('Tab')
      return page.evaluate(() => document.activeElement?.getAttribute('part') ?? '')
    })
    .toBe('prev')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '次の月' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.locator('rd-calendar [data-iso="2026-09-15"]')).toBeFocused()
})

test('calendar: → ↓ で tabindex="0" の日が動く（月表の中は矢印で歩く）', async ({ page }) => {
  await page.goto(storyUrl(CALENDAR_STORY))
  await waitForStoryFinished(page, CALENDAR_STORY)
  const focused = page.locator('rd-calendar [data-iso][tabindex="0"]')
  await page.locator('rd-calendar [data-iso="2026-09-15"]').focus()
  await page.keyboard.press('ArrowRight')
  await expect(focused).toHaveAttribute('data-iso', '2026-09-16')
  await page.keyboard.press('ArrowDown')
  await expect(focused).toHaveAttribute('data-iso', '2026-09-23')
  // 焦点を持つ升目は常に 1 つだけ（APG の roving tabindex）
  await expect(focused).toHaveCount(1)
})

test('calendar: Enter で <input> の値が選んだ日になる', async ({ page }) => {
  await page.goto(storyUrl(CALENDAR_STORY))
  await waitForStoryFinished(page, CALENDAR_STORY)
  await page.locator('rd-calendar [data-iso="2026-09-15"]').focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Enter')
  await expect(page.locator('rd-calendar > input')).toHaveValue('2026-09-16')
  await expect(page.locator('rd-calendar [data-iso="2026-09-16"]')).toHaveAttribute(
    'aria-selected',
    'true',
  )
})

/**
 * `rd-calendar picker`（plan 034）。開くのは `popovertarget`（UA）、Escape と light dismiss も UA。
 * 閉じたあとのフォーカス復帰も UA の hide popover algorithm に任せている（部品は `focus()` を呼ばない）。
 */
const PICKER_STORY = 'components-calendar--picker'

const openPicker = async (page: Page): Promise<void> => {
  await page.goto(storyUrl(PICKER_STORY))
  await waitForStoryFinished(page, PICKER_STORY)
  await page.getByRole('button', { name: '暦を開く' }).click()
  await expect
    .poll(async () =>
      page.locator('rd-calendar').evaluate((element) => element.matches(':state(open)')),
    )
    .toBe(true)
}

test('date-picker: Tab で開くボタンに届き、Enter で開くと焦点が選ばれている日に移る', async ({
  page,
}) => {
  await page.goto(storyUrl(PICKER_STORY))
  await waitForStoryFinished(page, PICKER_STORY)
  await page.locator('rd-calendar > input').focus()
  // 日付欄は年・月・日の内部フィールドを持つので、Tab の回数はブラウザに任せる
  await expect
    .poll(async () => {
      await page.keyboard.press('Tab')
      return page.evaluate(() => document.activeElement?.getAttribute('part') ?? '')
    })
    .toBe('toggle')
  await page.keyboard.press('Enter')
  await expect(page.locator("rd-calendar [part='popover']")).toBeVisible()
  await expect(page.locator('rd-calendar [data-iso="2026-09-15"]')).toBeFocused()
})

test('date-picker: 開いた月表で日を選ぶと閉じ、フォーカスが開くボタンに戻る（UA の復帰）', async ({
  page,
}) => {
  await openPicker(page)
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Enter')
  await expect(page.locator('rd-calendar > input')).toHaveValue('2026-09-16')
  await expect(page.locator("rd-calendar [part='popover']")).toBeHidden()
  await expect(page.getByRole('button', { name: '暦を開く' })).toBeFocused()
})

test('date-picker: Escape で閉じ、フォーカスが開くボタンに戻る（ネイティブの light dismiss）', async ({
  page,
}) => {
  await openPicker(page)
  await page.keyboard.press('Escape')
  await expect(page.locator("rd-calendar [part='popover']")).toBeHidden()
  await expect(page.getByRole('button', { name: '暦を開く' })).toBeFocused()
})

/**
 * `rd-carousel`（plan 032）。前へ／次へと「n / N」は **JS があるときだけ**足される強化ノードなので、
 * ここ（Storybook）で見る。転がる箱そのものは `<ul tabindex="0">` として契約が持っているので、
 * `e2e/pe` の JS 無しの回でも Tab で届く。
 */
const CAROUSEL_STORY = 'components-carousel--default'

const carouselStory = async (page: Page): Promise<void> => {
  await page.goto(storyUrl(CAROUSEL_STORY))
  await waitForStoryFinished(page, CAROUSEL_STORY)
}

test('carousel: Tab で <ul> → 前へ → 次へ の順に届き、Enter で「n / N」が進む', async ({
  page,
}) => {
  await carouselStory(page)
  await page.keyboard.press('Tab')
  await expect(page.locator('rd-carousel > ul')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '前へ' })).toBeFocused()
  await page.keyboard.press('Tab')
  const next = page.getByRole('button', { name: '次へ' })
  await expect(next).toBeFocused()
  await next.press('Enter')
  await expect(page.locator("rd-carousel [part='counter']")).toHaveText('2 / 5')
})

test('carousel: aria-disabled の端でも Tab は素通りしない（フォーカスは受け取れるまま）', async ({
  page,
}) => {
  await carouselStory(page)
  const prev = page.getByRole('button', { name: '前へ' })
  await expect(prev).toHaveAttribute('aria-disabled', 'true')
  await prev.focus()
  await expect(prev).toBeFocused()
  // 押しても動かないが、`disabled` ではないので押せてしまうことも読み上げも壊れない
  await prev.press('Enter')
  await expect(page.locator("rd-carousel [part='counter']")).toHaveText('1 / 5')
  await prev.press('Tab')
  await expect(page.getByRole('button', { name: '次へ' })).toBeFocused()
})

const TOGGLE_GROUP_STORY = 'components-togglegroup--default'
const TOGGLE_GROUP_SINGLE_STORY = 'components-togglegroup--single'

test('toggle group: single は 2 個目を押すと 1 個目が戻る', async ({ page }) => {
  await page.goto(storyUrl(TOGGLE_GROUP_SINGLE_STORY))
  await waitForStoryFinished(page, TOGGLE_GROUP_SINGLE_STORY)
  const group = page.getByRole('group', { name: '書式' })
  // story の play が「下線」を押した状態で終わる
  await expect(group.getByRole('button', { name: '下線' })).toHaveAttribute('aria-pressed', 'true')
  await group.getByRole('button', { name: '斜体' }).click()
  await expect(group.getByRole('button', { name: '斜体' })).toHaveAttribute('aria-pressed', 'true')
  await expect(group.getByRole('button', { name: '下線' })).toHaveAttribute('aria-pressed', 'false')
})

test('toggle group: 矢印で列の中を移動する（押さない。roving tabindex）', async ({ page }) => {
  await page.goto(storyUrl(TOGGLE_GROUP_STORY))
  await waitForStoryFinished(page, TOGGLE_GROUP_STORY)
  const group = page.getByRole('group', { name: '書式' })
  const bold = group.getByRole('button', { name: '太字' })
  await bold.focus()
  await page.keyboard.press('ArrowRight')
  await expect(group.getByRole('button', { name: '斜体' })).toBeFocused()
  // フォーカスを動かすだけで押さない（APG Toolbar）
  await expect(group.getByRole('button', { name: '斜体' })).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('End')
  await expect(group.getByRole('button', { name: '下線' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(bold).toBeFocused()
})

test('toggle group: Space で押下が切り替わる（ネイティブの click）', async ({ page }) => {
  await page.goto(storyUrl(TOGGLE_GROUP_STORY))
  await waitForStoryFinished(page, TOGGLE_GROUP_STORY)
  const underline = page.getByRole('group', { name: '書式' }).getByRole('button', { name: '下線' })
  await underline.focus()
  await expect(underline).toHaveAttribute('aria-pressed', 'false')
  await page.keyboard.press('Space')
  await expect(underline).toHaveAttribute('aria-pressed', 'true')
})

/**
 * `rd-number-field`（plan 036）。− / + は `tabindex="-1"` なので Tab 順に増えない。
 * キーボードで刻む道はネイティブの ↑↓ で、部品はそれを邪魔しない。
 */
const NUMBER_FIELD_STORY = 'components-numberfield--default'

const numberFieldStory = async (page: Page): Promise<void> => {
  await page.goto(storyUrl(NUMBER_FIELD_STORY))
  await waitForStoryFinished(page, NUMBER_FIELD_STORY)
}

test('number field: + をクリックすると値が刻まれる', async ({ page }) => {
  await numberFieldStory(page)
  const input = page.getByLabel('枚数')
  await expect(input).toHaveValue('1')
  await page.getByRole('button', { name: '増やす' }).click()
  await expect(input).toHaveValue('2')
})

test('number field: 入力欄で ↑ を押すとネイティブが刻む（部品は邪魔しない）', async ({ page }) => {
  await numberFieldStory(page)
  const input = page.getByLabel('枚数')
  await input.focus()
  await page.keyboard.press('ArrowUp')
  await expect(input).toHaveValue('2')
  // Tab は入力欄を出たら送信ボタンへ。− / + は Tab 順に居ない（tabindex="-1"）
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '増やす' })).not.toBeFocused()
  await expect(page.getByRole('button', { name: '減らす' })).not.toBeFocused()
})
