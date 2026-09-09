/**
 * 4 フレームワークで**同じ 1 ページ**を同じシナリオで確かめる（docs/testing.md）。
 * 生成されたラッパーが契約の木どおりの HTML を出し、JS が無くても動くことを固定する（ADR-0012）。
 */
import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { buttonMarkup } from '@rimltempest/riml-ds-elements/button'
import { dialogMarkup } from '@rimltempest/riml-ds-elements/dialog'
import { calendarMarkup } from '@rimltempest/riml-ds-elements/experimental/calendar'
import { checkboxMarkup } from '@rimltempest/riml-ds-elements/experimental/checkbox'
import {
  checkboxGroupMarkup,
  checkboxOptionMarkup,
} from '@rimltempest/riml-ds-elements/experimental/checkbox-group'
import {
  comboboxMarkup,
  comboboxOptionMarkup,
} from '@rimltempest/riml-ds-elements/experimental/combobox'
import {
  commandGroupMarkup,
  commandItemMarkup,
  commandMarkup,
} from '@rimltempest/riml-ds-elements/experimental/command'
import {
  dataTableBodyMarkup,
  dataTableHeadMarkup,
  dataTableMarkup,
  dataTableRowMarkup,
} from '@rimltempest/riml-ds-elements/experimental/data-table'
import {
  inputOtpMarkup,
  otpCellsMarkup,
} from '@rimltempest/riml-ds-elements/experimental/input-otp'
import { meterMarkup } from '@rimltempest/riml-ds-elements/experimental/meter'
import {
  radioGroupMarkup,
  radioOptionMarkup,
} from '@rimltempest/riml-ds-elements/experimental/radio-group'
import { selectMarkup } from '@rimltempest/riml-ds-elements/experimental/select'
import { sliderMarkup } from '@rimltempest/riml-ds-elements/experimental/slider'
import { splitterMarkup } from '@rimltempest/riml-ds-elements/experimental/splitter'
import {
  tabMarkup,
  tabsMarkup,
  tabsPanelMarkup,
} from '@rimltempest/riml-ds-elements/experimental/tabs'
import { toggleMarkup } from '@rimltempest/riml-ds-elements/experimental/toggle'
import { textFieldMarkup } from '@rimltempest/riml-ds-elements/text-field'

const AAA_TAGS = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa'] as const

/**
 * 属性順・ハイドレーション用のコメント・字下げの空白を無視して比べる。
 * フレームワークごとに違うのはそこだけで、意味のあるノードは同じでなければならない。
 */
const compareMarkup = async (page: Page, selector: string, expected: string): Promise<void> => {
  const result = await page.evaluate(
    (input: { selector: string; expected: string }) => {
      // ブラウザに送られる関数なので、外に出すと参照できない
      // oxlint-disable-next-line unicorn/consistent-function-scoping
      const canonical = (node: Node): string => {
        if (node instanceof Text) {
          return node.data.trim() === '' ? '' : node.data.trim()
        }
        if (!(node instanceof Element)) {
          return ''
        }
        const tag = node.tagName.toLowerCase()
        const attrs = [...node.attributes]
          .map((attr) => `${attr.name}="${attr.value}"`)
          .toSorted()
          .join(' ')
        const children = [...node.childNodes].map((child) => canonical(child)).join('')
        return `<${tag}${attrs === '' ? '' : ` ${attrs}`}>${children}</${tag}>`
      }
      const target = document.querySelector(input.selector)
      const template = document.createElement('template')
      template.innerHTML = input.expected
      return {
        actual: target === null ? '' : canonical(target),
        want: [...template.content.childNodes].map((child) => canonical(child)).join(''),
      }
    },
    { selector, expected },
  )
  expect(result.actual).toBe(result.want)
}

export const frameworkSuite = (framework: string): void => {
  test.describe(`${framework}: JS 無し`, () => {
    test.use({ javaScriptEnabled: false })

    test('初期 HTML が契約の markup() と一致する', async ({ page }) => {
      await page.goto('/')
      await compareMarkup(
        page,
        'rd-text-field',
        textFieldMarkup({
          id: 'email',
          label: 'メール',
          name: 'email',
          type: 'email',
          required: true,
          hint: '確認メールを送ります',
        }),
      )
      await compareMarkup(
        page,
        'rd-select',
        selectMarkup({
          id: 'country',
          label: '国',
          name: 'country',
          children:
            '<option value="">選択してください</option>'
            + '<option value="jp">日本</option><option value="us">アメリカ</option>',
        }),
      )
      await compareMarkup(
        page,
        'rd-checkbox',
        checkboxMarkup({
          id: 'news',
          label: 'お知らせを受け取る',
          name: 'news',
          defaultValue: 'yes',
        }),
      )
      await compareMarkup(page, 'rd-button', buttonMarkup({ label: '送信', type: 'submit' }))
      // `placement`（plan 022）は文字列の属性。4 つのラッパー生成器が同じ値を出すことを固定する
      // （boolean の `alert` は vue / svelte が `alert="true"`、react / astro が `alert=""` と書き、
      //  意味は同じでも文字列が揃わない — `rd-window` の `collapsible` と同じ事情。
      //  `alert` の振る舞いは logic / browser / story / e2e/pe が見る）
      await compareMarkup(
        page,
        'rd-dialog',
        dialogMarkup({
          label: '送信しました',
          children: '<p>確認メールを送りました。</p>',
          placement: 'end',
        }),
      )
    })

    test('フォームを送信できる', async ({ page }) => {
      await page.goto('/')
      await page.getByLabel('メール').fill('a@example.com')
      await page.getByRole('button', { name: '送信' }).click()
      await expect(page).toHaveURL(/thanks\.html\?email=a%40example\.com/)
    })

    test('選択とチェックも送信のクエリに載る', async ({ page }) => {
      await page.goto('/')
      await page.getByLabel('メール').fill('a@example.com')
      await page.getByLabel('国').selectOption('jp')
      await page.getByLabel('お知らせを受け取る').check()
      await page.getByRole('button', { name: '送信' }).click()
      await expect(page).toHaveURL(/country=jp/)
      await expect(page).toHaveURL(/news=yes/)
    })
  })

  test.describe(`${framework}: アプリの JS を止めた状態`, () => {
    // axe 自身が JS を要るので、javaScriptEnabled ではなくアプリのスクリプトだけ止める
    test('axe AAA 違反が無い', async ({ page }) => {
      await page.route('**/*.js', async (route) => route.abort())
      await page.goto('/')
      const results = await new AxeBuilder({ page }).withTags([...AAA_TAGS]).analyze()
      expect(results.violations).toEqual([])
    })
  })

  test.describe(`${framework}: JS あり`, () => {
    test('送信でダイアログが開き、Esc で開いた要素にフォーカスが戻る', async ({ page }) => {
      await page.goto('/')
      await page.getByLabel('メール').fill('a@example.com')
      const submit = page.getByRole('button', { name: '送信' })
      await submit.click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toBeHidden()
      await expect(submit).toBeFocused()
    })

    /** `placement="end"`（plan 022）は帯（Sheet）。窓が行末の端に着く */
    test('placement="end" の窓は行末の端に着く', async ({ page }) => {
      await page.goto('/')
      await page.getByLabel('メール').fill('a@example.com')
      await page.getByRole('button', { name: '送信' }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      const width = page.viewportSize()?.width ?? 0
      // 入場は `@starting-style` の translate で滑り込む。着くまで見る（sleep を書かない）
      await expect
        .poll(async () => {
          const box = await dialog.boundingBox()
          return Math.round((box?.x ?? 0) + (box?.width ?? 0))
        })
        .toBe(width)
      const box = await dialog.boundingBox()
      expect(box?.x ?? 0).toBeGreaterThan(0)
    })
  })
}

/**
 * `rd-meter` と `rd-window`（plan 017）。`library/astro/package.json` の `exports` を
 * `bun run gen` が書くようになった（plan 023）ので、**4 フレームワークすべて**で回す。
 */
export const meterAndWindowSuite = (framework: string): void => {
  test.describe(`${framework}: meter と window`, () => {
    test.describe('JS 無し', () => {
      test.use({ javaScriptEnabled: false })

      test('初期 HTML が契約の markup() と一致する', async ({ page }) => {
        await page.goto('/')
        await compareMarkup(
          page,
          'rd-meter',
          meterMarkup({
            id: 'disk',
            label: 'ディスク使用量',
            value: '3.2',
            max: '10',
            text: '3.2 GB / 10 GB',
          }),
        )
        // `rd-window` は比べない: vue / svelte のラッパーが boolean 属性を `collapsible="true"` と
        // 書く（react / astro は `collapsible=""`）。どちらも「存在 = true」で意味は同じだが
        // 文字列としては一致しない。生成器（tools/cem/src/wrappers）は別レーンの持ち物なので
        // ここでは形ではなく**振る舞い**（下の 2 つ）で固定する
        await expect(page.locator('rd-window > [slot=title]')).toHaveText('バックアップの設定')
      })

      test('window は JS 無しでも見出しと本文が読める（ティア B）', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByRole('heading', { name: 'バックアップの設定' })).toBeVisible()
        await expect(page.getByText('毎晩 3 時に実行します。')).toBeVisible()
      })
    })

    test('meter は属性を読んで塗りの割合を CSS 変数に書く', async ({ page }) => {
      await page.goto('/')
      const meter = page.locator('rd-meter')
      await expect
        .poll(async () =>
          meter.evaluate((element) =>
            element instanceof HTMLElement ? element.style.getPropertyValue('--rd-meter-fill') : '',
          ),
        )
        .toBe('0.32')
    })

    test('window: たたむを押すと本文が hidden になる（ADR-0014）', async ({ page }) => {
      await page.goto('/')
      const body = page.locator('rd-window [part=body]')
      await expect(body).toBeVisible()
      await page.locator('rd-window button[data-action=collapse]').click()
      await expect(body).toBeHidden()
    })
  })
}

/** 4 フレームワークで同じ選択肢を出す（`radioOptionMarkup` が唯一の正） */
const PLAN_OPTIONS = [
  radioOptionMarkup({ id: 'plan-free', name: 'plan', value: 'free', label: '無料' }),
  radioOptionMarkup({ id: 'plan-pro', name: 'plan', value: 'pro', label: '有料' }),
].join('')

/**
 * `rd-radio-group` と `rd-slider`（plan 019）。`meterAndWindowSuite` と同じく、astro の
 * `exports` が生成物になった（plan 023）ので 4 フレームワークすべてで回す。
 */
export const radioGroupAndSliderSuite = (framework: string): void => {
  test.describe(`${framework}: radio-group と slider`, () => {
    test.describe('JS 無し', () => {
      test.use({ javaScriptEnabled: false })

      test('初期 HTML が契約の markup() と一致する', async ({ page }) => {
        await page.goto('/')
        await compareMarkup(
          page,
          'rd-radio-group',
          radioGroupMarkup({ label: 'プラン', children: PLAN_OPTIONS }),
        )
        await compareMarkup(
          page,
          'rd-slider',
          sliderMarkup({
            id: 'volume',
            label: '音量',
            name: 'volume',
            defaultValue: '3',
            min: '0',
            max: '10',
          }),
        )
      })

      test('radio group は JS 無しでも選べる（ネイティブの radio そのもの）', async ({ page }) => {
        await page.goto('/')
        const pro = page.getByRole('group', { name: 'プラン' }).getByLabel('有料')
        await pro.check()
        await expect(pro).toBeChecked()
      })
    })

    test('slider は値を読んで塗りの割合を CSS 変数に書く', async ({ page }) => {
      await page.goto('/')
      const slider = page.locator('rd-slider')
      await expect
        .poll(async () =>
          slider.evaluate((element) =>
            element instanceof HTMLElement
              ? element.style.getPropertyValue('--rd-slider-fill')
              : '',
          ),
        )
        .toBe('0.3')
    })

    test('radio group を選ぶと :state(filled) が付く', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('group', { name: 'プラン' }).getByLabel('有料').check()
      const group = page.locator('rd-radio-group')
      await expect
        .poll(async () => group.evaluate((element) => element.matches(':state(filled)')))
        .toBe(true)
    })
  })
}

/** 4 フレームワークで同じタブとパネルを出す（`tabMarkup` / `tabsPanelMarkup` が唯一の正） */
const TAB_LINKS = [
  tabMarkup({ href: '#overview', label: '概要' }),
  tabMarkup({ href: '#usage', label: '使い方' }),
].join('')

const TAB_PANELS = [
  tabsPanelMarkup({ id: 'overview', children: '<p>この部品の概要。</p>' }),
  tabsPanelMarkup({ id: 'usage', children: '<p>使い方の説明。</p>' }),
].join('')

/**
 * `rd-tabs` / `rd-menu` / `rd-popover`（plan 020）。契約の木に**名前つきの `{ raw }`** があり、
 * plan 023 まで vue / svelte / astro の生成器が既定 slot に潰していた（同じ子を 2 回描いた）ので
 * 4 フレームワークに載せられなかった。
 *
 * `compareMarkup` は `rd-tabs` だけ。menu / popover のトリガーは利用側が書く生 HTML で、
 * `id` の付け方がフレームワークごとに違うため振る舞いで固定する。
 */
export const navigationSuite = (framework: string): void => {
  test.describe(`${framework}: tabs と menu と popover`, () => {
    test.describe('JS 無し', () => {
      test.use({ javaScriptEnabled: false })

      test('tabs の初期 HTML が契約の markup() と一致する', async ({ page }) => {
        await page.goto('/')
        await compareMarkup(
          page,
          'rd-tabs',
          tabsMarkup({ label: 'ドキュメント', tabs: TAB_LINKS, panels: TAB_PANELS }),
        )
      })

      test('tabs は JS 無しならすべてのパネルが見える（ティア B）', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByText('この部品の概要。')).toBeVisible()
        await expect(page.getByText('使い方の説明。')).toBeVisible()
      })

      test('menu は JS 無しでもすべての項目が見える', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByRole('link', { name: '複製' })).toBeVisible()
        await expect(page.getByRole('button', { name: '削除' })).toBeVisible()
      })

      test('popover は JS 無しでも見出しと本文が見える', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByRole('heading', { name: '絞り込み' })).toBeVisible()
        await expect(page.getByText('条件を選ぶと一覧がその場で変わる。')).toBeVisible()
      })
    })

    test('tabs: 2 つ目のタブを押すと 1 つ目のパネルが隠れる', async ({ page }) => {
      await page.goto('/')
      const overview = page.locator('#overview')
      await expect(overview).toBeVisible()
      await page.getByRole('tab', { name: '使い方' }).click()
      await expect(overview).toBeHidden()
      await expect(page.locator('#usage')).toBeVisible()
    })

    test('menu: トリガーを押すと開き、Esc で閉じてトリガーに戻る', async ({ page }) => {
      await page.goto('/')
      const list = page.locator('rd-menu [popover]')
      // 定義されると `[popover]` 自身が role="menu" を持つ（項目を直接持つ形）
      await expect(list).toHaveAttribute('role', 'menu')
      // 閉じているあいだは UA の `[popover]:not(:popover-open) { display: none }` に任せる
      // （`menu.css` は `:popover-open` の側にだけ `display` を書く）ので、描かれない
      const open = async (): Promise<boolean> =>
        list.evaluate((element) => element.matches(':popover-open'))
      expect(await open()).toBe(false)
      await expect(list).toBeHidden()
      const trigger = page.getByRole('button', { name: '操作' })
      await trigger.click()
      await expect.poll(open).toBe(true)
      await page.keyboard.press('Escape')
      await expect.poll(open).toBe(false)
      await expect(trigger).toBeFocused()
    })

    test('popover: トリガーを押すと [popover] が開く', async ({ page }) => {
      await page.goto('/')
      const panel = page.locator('rd-popover [popover]')
      await expect(panel).toBeHidden()
      await page.getByRole('button', { name: '絞り込み' }).click()
      await expect(panel).toBeVisible()
      await expect
        .poll(async () => panel.evaluate((element) => element.matches(':popover-open')))
        .toBe(true)
    })
  })
}

/** 4 フレームワークで同じ選択肢を出す（`checkboxOptionMarkup` が唯一の正） */
const TAG_OPTIONS = [
  checkboxOptionMarkup({ id: 'tag-work', name: 'tags', value: 'a', label: '仕事' }),
  checkboxOptionMarkup({ id: 'tag-private', name: 'tags', value: 'b', label: '私用' }),
].join('')

/**
 * `rd-checkbox-group` と `rd-input-otp`（plan 021）。**4 つで回す** —
 * `.astro` の `exports` は `bun run gen` が書くようになった（plan 023）。
 */
export const formWave4Suite = (framework: string): void => {
  test.describe(`${framework}: checkbox-group と input-otp`, () => {
    test.describe('JS 無し', () => {
      test.use({ javaScriptEnabled: false })

      test('初期 HTML が契約の markup() と一致する', async ({ page }) => {
        await page.goto('/')
        await compareMarkup(
          page,
          'rd-checkbox-group',
          checkboxGroupMarkup({ label: 'タグ', children: TAG_OPTIONS }),
        )
        await compareMarkup(
          page,
          'rd-input-otp',
          inputOtpMarkup({
            label: '確認コード',
            children: otpCellsMarkup({ name: 'code', length: 2 }),
          }),
        )
      })

      test('checkbox group は JS 無しでも選べる（ネイティブの checkbox そのもの）', async ({
        page,
      }) => {
        await page.goto('/')
        const work = page.getByRole('group', { name: 'タグ' }).getByLabel('仕事')
        await work.check()
        await expect(work).toBeChecked()
      })
    })

    test('checkbox group を選ぶと :state(filled) が付き、value が配列になる', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('group', { name: 'タグ' }).getByLabel('私用').check()
      const group = page.locator('rd-checkbox-group')
      await expect
        .poll(async () => group.evaluate((element) => element.matches(':state(filled)')))
        .toBe(true)
      await expect
        .poll(async () =>
          group.evaluate((element) =>
            'value' in element && Array.isArray(element.value) ? element.value.join(',') : '',
          ),
        )
        .toBe('b')
    })

    test('input otp は 1 文字入れると次の桁へ進む', async ({ page }) => {
      await page.goto('/')
      await page.getByLabel('1 桁目').fill('1')
      await page.getByLabel('1 桁目').dispatchEvent('input')
      await expect(page.getByLabel('2 桁目')).toBeFocused()
    })
  })
}

/**
 * `rd-toggle`（plan 024）。押下の真実は `aria-pressed` 属性なので、
 * 4 つのラッパーが同じ属性を出し、同じように反転することを固定する。
 */
export const toggleSuite = (framework: string): void => {
  test.describe(`${framework}: toggle`, () => {
    test.describe('JS 無し', () => {
      test.use({ javaScriptEnabled: false })

      test('初期 HTML が契約の markup() と一致する', async ({ page }) => {
        await page.goto('/')
        await compareMarkup(page, 'rd-toggle', toggleMarkup({ label: '太字', pressed: 'false' }))
      })
    })

    test('押すたびに aria-pressed が反転し :state(pressed) が付く', async ({ page }) => {
      await page.goto('/')
      const toggle = page.locator('rd-toggle')
      const button = page.getByRole('button', { name: '太字' })
      await expect(button).toHaveAttribute('aria-pressed', 'false')
      await button.click()
      await expect(button).toHaveAttribute('aria-pressed', 'true')
      await expect
        .poll(async () => toggle.evaluate((element) => element.matches(':state(pressed)')))
        .toBe(true)
      await button.click()
      await expect(button).toHaveAttribute('aria-pressed', 'false')
      await expect
        .poll(async () => toggle.evaluate((element) => element.matches(':state(pressed)')))
        .toBe(false)
    })
  })
}

/** 4 フレームワークで同じ候補を出す（`comboboxOptionMarkup` が唯一の正） */
const READING_OPTIONS = [
  comboboxOptionMarkup({ value: 'kana', label: 'かな' }),
  comboboxOptionMarkup({ value: 'kanji', label: 'かんじ' }),
  comboboxOptionMarkup({ value: 'romaji', label: 'ローマ字' }),
].join('')

/** 4 フレームワークで同じ項目。**リンクとボタンのまま**なので JS 無しでも辿れる */
const COMMAND_GROUPS =
  commandGroupMarkup({
    label: 'ページ',
    items:
      commandItemMarkup({ label: 'ホーム', href: '#home', keywords: 'home top' })
      + commandItemMarkup({ label: '設定', href: '#settings', keywords: 'せってい preferences' }),
  })
  + commandGroupMarkup({
    label: '操作',
    items: commandItemMarkup({ label: '新しいノート', value: 'new', shortcut: '⌘N' }),
  })

/**
 * `rd-command`（plan 028）。項目は利用側が書いたリンクとボタンのままで、部品は
 * `<li hidden>` を書くだけ。JS が無ければ全部見えていて、そのまま辿れる。
 */
export const commandSuite = (framework: string): void => {
  test.describe(`${framework}: command`, () => {
    test.describe('JS 無し', () => {
      test.use({ javaScriptEnabled: false })

      test('初期 HTML が契約の markup() と一致する', async ({ page }) => {
        await page.goto('/')
        await compareMarkup(
          page,
          'rd-command',
          commandMarkup({ id: 'palette', label: 'コマンド', groups: COMMAND_GROUPS }),
        )
      })

      test('JS 無しでも項目がすべて見えていて、リンクは本物のまま', async ({ page }) => {
        await page.goto('/')
        await expect(page.locator('rd-command > ul > li')).toHaveCount(3)
        await expect(page.locator('rd-command > ul > li[hidden]')).toHaveCount(0)
        await expect(
          page.locator('rd-command').getByRole('link', { name: /ホーム/u }),
        ).toHaveAttribute('href', '#home')
      })
    })

    test('打つと項目が隠れ、↓ で見えている項目へ移る', async ({ page }) => {
      await page.goto('/')
      const control = page.getByRole('searchbox', { name: 'コマンド' })
      const visible = page.locator('rd-command > ul > li:not([hidden])')
      await control.click()
      await control.pressSequentially('せ')
      await expect(visible).toHaveCount(1)
      await page.keyboard.press('ArrowDown')
      await expect(page.locator('rd-command').getByRole('link', { name: /設定/u })).toBeFocused()
    })
  })
}

/**
 * `rd-combobox`（plan 025）。候補は `<datalist>` に書くので、JS が無ければネイティブの
 * 吹き出しがそのまま候補を出す。JS が来たら APG の combobox パターンに置き換わる。
 */
export const comboboxSuite = (framework: string): void => {
  test.describe(`${framework}: combobox`, () => {
    test.describe('JS 無し', () => {
      test.use({ javaScriptEnabled: false })

      test('初期 HTML が契約の markup() と一致する', async ({ page }) => {
        await page.goto('/')
        await compareMarkup(
          page,
          'rd-combobox',
          comboboxMarkup({
            id: 'reading',
            listId: 'reading-list',
            label: '読み',
            name: 'reading',
            children: READING_OPTIONS,
          }),
        )
      })

      test('JS 無しでも <input list> と <datalist> の候補がそのまま残る', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByLabel('読み')).toHaveAttribute('list', 'reading-list')
        await expect(page.locator('#reading-list > option')).toHaveCount(3)
      })
    })

    test('↓ で候補が開き、Enter で値が入る', async ({ page }) => {
      await page.goto('/')
      const control = page.getByRole('combobox', { name: '読み' })
      const options = page.locator("rd-combobox [role='option']")
      await control.click()
      await page.keyboard.press('ArrowDown')
      await expect(control).toHaveAttribute('aria-expanded', 'true')
      await expect(options).toHaveCount(3)
      await page.keyboard.press('Enter')
      await expect(control).toHaveValue('kana')
      await expect(control).toHaveAttribute('aria-expanded', 'false')
    })
  })
}

/** 4 フレームワークで同じ 2 面を出す（`splitterMarkup` が唯一の正） */
const SPLITTER_START = '<p>一覧の面。</p>'
const SPLITTER_END = '<p>本文の面。</p>'

/**
 * `rd-splitter`（plan 030）。`start` / `end` は**名前つきの `{ raw }`** なので、4 つの生成器が
 * 同じ 2 つの `<div slot>` を出すことを固定する。つまみは shadow にしか無いので、
 * JS 無しでは 1 つも現れず、2 面がそのまま読める（ティア B、ADR-0012）。
 */
export const splitterSuite = (framework: string): void => {
  test.describe(`${framework}: splitter`, () => {
    test.describe('JS 無し', () => {
      test.use({ javaScriptEnabled: false })

      test('初期 HTML が契約の markup() と一致する', async ({ page }) => {
        await page.goto('/')
        await compareMarkup(
          page,
          'rd-splitter',
          splitterMarkup({ label: '面の割合', start: SPLITTER_START, end: SPLITTER_END }),
        )
      })

      test('JS 無しでも 2 つの面が両方読め、つまみは出ない（ティア B）', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByText('一覧の面。')).toBeVisible()
        await expect(page.getByText('本文の面。')).toBeVisible()
        await expect(page.locator('rd-splitter [role=separator]')).toHaveCount(0)
      })
    })

    test('つまみは名前と現在値を持つ separator になる', async ({ page }) => {
      await page.goto('/')
      const handle = page.locator('rd-splitter [part=handle]')
      await expect(handle).toHaveAttribute('role', 'separator')
      await expect(handle).toHaveAttribute('aria-label', '面の割合')
      // 横に並ぶ 2 面のあいだの仕切りは**縦線**（APG の separator）
      await expect(handle).toHaveAttribute('aria-orientation', 'vertical')
      await expect(handle).toHaveAttribute('aria-valuenow', '50')
    })

    test('→ で割合が増え、host の CSS 変数に書き戻される', async ({ page }) => {
      await page.goto('/')
      const handle = page.locator('rd-splitter [part=handle]')
      await handle.press('ArrowRight')
      await expect(handle).toHaveAttribute('aria-valuenow', '51')
      await expect
        .poll(async () =>
          page.evaluate(() => {
            const el = document.querySelector('rd-splitter')
            return el instanceof HTMLElement
              ? el.style.getPropertyValue('--rd-splitter-position')
              : ''
          }),
        )
        .toBe('51%')
    })
  })
}

/** 4 フレームワークで同じ暦を出す。「今日」は属性で固定する（時計に依存させない） */
const CALENDAR = {
  id: 'due',
  label: '期限',
  name: 'due',
  defaultValue: '2026-09-15',
  today: '2026-09-09',
} as const

/**
 * `rd-calendar`（plan 033）。`<label for>` と `<input type="date">` は利用側（＝各フレームワークの
 * アプリ）が書き、部品は月表を light DOM の末尾に足すだけ。JS が無ければ入力欄がそのまま働く。
 */
export const calendarSuite = (framework: string): void => {
  test.describe(`${framework}: calendar`, () => {
    test.describe('JS 無し', () => {
      test.use({ javaScriptEnabled: false })

      test('初期 HTML が契約の markup() と一致する', async ({ page }) => {
        await page.goto('/')
        await compareMarkup(page, 'rd-calendar', calendarMarkup(CALENDAR))
      })

      test('JS 無しでは <input type="date"> だけが出る（月表は強化ノード）', async ({ page }) => {
        await page.goto('/')
        await expect(page.locator('rd-calendar > input')).toHaveValue('2026-09-15')
        await expect(page.locator("rd-calendar [part='grid']")).toHaveCount(0)
      })
    })

    test('月表は <label> の名前を借りた grid になる', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('grid', { name: '期限' })).toBeVisible()
      await expect(page.locator("rd-calendar [part='title']")).toHaveText('2026年9月')
    })

    test('日を押すと <input> の値が変わる（値の真実は <input>）', async ({ page }) => {
      await page.goto('/')
      await page.locator('rd-calendar [data-iso="2026-09-20"]').click()
      // `getByLabel` は <input> と grid の両方に当たる（同じ <label> が名前を付ける）
      await expect(page.locator('rd-calendar > input')).toHaveValue('2026-09-20')
      await expect(page.locator('rd-calendar [data-iso="2026-09-20"]')).toHaveAttribute(
        'aria-selected',
        'true',
      )
    })
  })
}

/** 4 フレームワークで同じ表を出す（`dataTableHeadMarkup` / `dataTableRowMarkup` が唯一の正） */
const CODE_HEAD = dataTableHeadMarkup([
  { label: '名前', sort: 'text', key: 'name' },
  { label: 'サイズ', sort: 'number', key: 'size', numeric: true },
])

const CODE_BODY = dataTableBodyMarkup([
  dataTableRowMarkup([{ text: 'b.png' }, { text: '1,234', value: '1234', numeric: true }]),
  dataTableRowMarkup([{ text: 'a.png' }, { text: '820', value: '820', numeric: true }]),
])

/**
 * `rd-data-table`（plan 029）。表そのものは利用側（＝ここでは各フレームワークのアプリ）が書き、
 * 部品は並べ替えだけを足す。JS が無ければ書かれた順の表がそのまま読め、見出しは文字のまま。
 */
export const dataTableSuite = (framework: string): void => {
  test.describe(`${framework}: data-table`, () => {
    test.describe('JS 無し', () => {
      test.use({ javaScriptEnabled: false })

      test('初期 HTML が契約の markup() と一致する', async ({ page }) => {
        await page.goto('/')
        await compareMarkup(
          page,
          'rd-data-table',
          dataTableMarkup({ caption: '保存したコード', head: CODE_HEAD, body: CODE_BODY }),
        )
      })

      test('JS 無しでは見出しが文字のまま（押せないボタンを置かない）', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByRole('table', { name: '保存したコード' })).toBeVisible()
        await expect(page.locator('rd-data-table thead button')).toHaveCount(0)
        await expect(page.locator('rd-data-table tbody > tr > td').first()).toHaveText('b.png')
      })
    })

    test('見出しを押すと aria-sort が付き、行が並び替わる', async ({ page }) => {
      await page.goto('/')
      const names = page.locator('rd-data-table tbody > tr > td:first-child')
      await expect(names.first()).toHaveText('b.png')
      await page.getByRole('button', { name: '名前' }).click()
      await expect(page.getByRole('columnheader', { name: '名前' })).toHaveAttribute(
        'aria-sort',
        'ascending',
      )
      await expect(names.first()).toHaveText('a.png')
    })

    test('もう一度押すと降順になり :state(sorted) が付く', async ({ page }) => {
      await page.goto('/')
      const button = page.getByRole('button', { name: '名前' })
      await button.click()
      await button.click()
      await expect(page.getByRole('columnheader', { name: '名前' })).toHaveAttribute(
        'aria-sort',
        'descending',
      )
      await expect(page.locator('rd-data-table tbody > tr > td:first-child').first()).toHaveText(
        'b.png',
      )
      await expect
        .poll(async () =>
          page.locator('rd-data-table').evaluate((element) => element.matches(':state(sorted)')),
        )
        .toBe(true)
    })
  })
}
