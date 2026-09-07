/**
 * 4 フレームワークで**同じ 1 ページ**を同じシナリオで確かめる（docs/testing.md）。
 * 生成されたラッパーが契約の木どおりの HTML を出し、JS が無くても動くことを固定する（ADR-0012）。
 */
import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { buttonMarkup } from '@rimltempest/riml-ds-elements/button'
import { dialogMarkup } from '@rimltempest/riml-ds-elements/dialog'
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
