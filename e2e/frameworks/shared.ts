/**
 * 4 フレームワークで**同じ 1 ページ**を同じシナリオで確かめる（docs/testing.md）。
 * 生成されたラッパーが契約の木どおりの HTML を出し、JS が無くても動くことを固定する（ADR-0012）。
 */
import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { buttonMarkup } from '@rimltempest/riml-ds-elements/button'
import { dialogMarkup } from '@rimltempest/riml-ds-elements/dialog'
import { checkboxMarkup } from '@rimltempest/riml-ds-elements/experimental/checkbox'
import {
  checkboxGroupMarkup,
  checkboxOptionMarkup,
} from '@rimltempest/riml-ds-elements/experimental/checkbox-group'
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
      await compareMarkup(
        page,
        'rd-dialog',
        dialogMarkup({ label: '送信しました', children: '<p>確認メールを送りました。</p>' }),
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
  })
}

/**
 * `rd-meter` と `rd-window`（plan 017）。`@rimltempest/riml-ds-astro` の `package.json` が
 * この 2 つの `.astro` をまだ export していないので、astro 以外の 3 つで回す。
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
 * `rd-radio-group` と `rd-slider`（plan 019）。`@rimltempest/riml-ds-astro` の `package.json` が
 * この 2 つの `.astro` をまだ export していないので、astro 以外の 3 つで回す
 * （`meterAndWindowSuite` と同じ理由。`library/astro/package.json` は別レーンの持ち物）。
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

/** 4 フレームワークで同じ選択肢を出す（`checkboxOptionMarkup` が唯一の正） */
const TAG_OPTIONS = [
  checkboxOptionMarkup({ id: 'tag-work', name: 'tags', value: 'a', label: '仕事' }),
  checkboxOptionMarkup({ id: 'tag-private', name: 'tags', value: 'b', label: '私用' }),
].join('')

/**
 * `rd-checkbox-group` と `rd-input-otp`（plan 021）。`@rimltempest/riml-ds-astro` の
 * `package.json` がこの 2 つの `.astro` をまだ export していないので、astro 以外の 3 つで回す
 * （`meterAndWindowSuite` / `radioGroupAndSliderSuite` と同じ理由。
 * `library/astro/package.json` は別レーンの持ち物）。
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
