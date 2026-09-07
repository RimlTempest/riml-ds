import { describe, expect, it } from 'vitest'
import {
  computeDescribedBy,
  computeMessage,
  computeStates,
  computeView,
  usesJapaneseCopy,
} from './text-field.logic.js'

const flags = (partial: Readonly<Record<string, boolean>>): Record<string, boolean> => ({
  badInput: false,
  customError: false,
  patternMismatch: false,
  rangeOverflow: false,
  rangeUnderflow: false,
  stepMismatch: false,
  tooLong: false,
  tooShort: false,
  typeMismatch: false,
  valueMissing: false,
  ...partial,
})

const input = (
  overrides: Readonly<Record<string, unknown>>,
): Parameters<typeof computeMessage>[0] => ({
  error: '',
  validity: flags({}),
  validationMessage: 'Please fill out this field.',
  attrs: {},
  japanese: true,
  ...overrides,
})

describe('computeMessage', () => {
  it('error 属性が最優先', () => {
    expect(
      computeMessage(
        input({
          error: '既に使われています。別のメールを入力してください。',
          validity: flags({ valueMissing: true }),
        }),
      ),
    ).toBe('既に使われています。別のメールを入力してください。')
  })

  it('customError はネイティブの文言をそのまま出す', () => {
    expect(
      computeMessage(
        input({ validity: flags({ customError: true }), validationMessage: '在庫がありません。' }),
      ),
    ).toBe('在庫がありません。')
  })

  it('valueMissing を表の文言にする', () => {
    expect(computeMessage(input({ validity: flags({ valueMissing: true }) }))).toBe(
      '未入力です。入力してください。',
    )
  })

  it('typeMismatch は type で分岐する', () => {
    expect(
      computeMessage(input({ validity: flags({ typeMismatch: true }), attrs: { type: 'email' } })),
    ).toBe('メールアドレスの形式ではありません。name@example.com の形で入力してください。')
    expect(
      computeMessage(input({ validity: flags({ typeMismatch: true }), attrs: { type: 'url' } })),
    ).toBe('URL の形式ではありません。https://example.com の形で入力してください。')
  })

  it('長さ・範囲・刻みは属性の値を埋める', () => {
    expect(
      computeMessage(input({ validity: flags({ tooShort: true }), attrs: { minlength: '8' } })),
    ).toBe('短すぎます。8 文字以上で入力してください。')
    expect(
      computeMessage(input({ validity: flags({ tooLong: true }), attrs: { maxlength: '20' } })),
    ).toBe('長すぎます。20 文字以内で入力してください。')
    expect(
      computeMessage(input({ validity: flags({ rangeUnderflow: true }), attrs: { min: '1' } })),
    ).toBe('小さすぎます。1 以上で入力してください。')
    expect(
      computeMessage(input({ validity: flags({ rangeOverflow: true }), attrs: { max: '9' } })),
    ).toBe('大きすぎます。9 以下で入力してください。')
    expect(
      computeMessage(input({ validity: flags({ stepMismatch: true }), attrs: { step: '5' } })),
    ).toBe('5 刻みの値ではありません。5 刻みで入力してください。')
  })

  it('patternMismatch は title が無ければ既定の文言', () => {
    expect(
      computeMessage(
        input({ validity: flags({ patternMismatch: true }), attrs: { title: '半角英数字' } }),
      ),
    ).toBe('形式が違います。半角英数字 の形で入力してください。')
    expect(computeMessage(input({ validity: flags({ patternMismatch: true }) }))).toBe(
      '形式が違います。指定の形式で入力してください。',
    )
  })

  it('複数フラグが立ったら表の上から最初の 1 つだけ出す', () => {
    expect(
      computeMessage(
        input({
          validity: flags({ valueMissing: true, typeMismatch: true }),
          attrs: { type: 'email' },
        }),
      ),
    ).toBe('未入力です。入力してください。')
  })

  it('英語 UI では表を使わずネイティブ文言をそのまま出す', () => {
    expect(
      computeMessage(input({ validity: flags({ valueMissing: true }), japanese: false })),
    ).toBe('Please fill out this field.')
  })

  it('妥当なら空文字', () => {
    expect(computeMessage(input({ validationMessage: '' }))).toBe('')
  })
})

const host = (lang: string | null): Parameters<typeof usesJapaneseCopy>[0] => ({
  closest: () => (lang === null ? null : { getAttribute: () => lang }),
})

describe('usesJapaneseCopy', () => {
  it('最も近い [lang] が ja 以外なら false。無い / ja なら true', () => {
    expect(usesJapaneseCopy(host(null))).toBe(true)
    expect(usesJapaneseCopy(host('ja'))).toBe(true)
    expect(usesJapaneseCopy(host('ja-JP'))).toBe(true)
    expect(usesJapaneseCopy(host('en'))).toBe(false)
    expect(usesJapaneseCopy(host('en-US'))).toBe(false)
  })
})

describe('computeStates', () => {
  it('契約・検証・入力状態を :state() の集合にする', () => {
    expect(
      [
        ...computeStates({
          malformed: false,
          invalid: true,
          touched: true,
          hasHint: true,
          hasError: false,
          filled: true,
        }),
      ].toSorted(),
    ).toEqual(['filled', 'hinted', 'invalid'])
    expect(
      [
        ...computeStates({
          malformed: true,
          invalid: true,
          touched: false,
          hasHint: false,
          hasError: false,
          filled: false,
        }),
      ].toSorted(),
    ).toEqual(['malformed'])
    expect(
      [
        ...computeStates({
          malformed: false,
          invalid: false,
          touched: false,
          hasHint: false,
          hasError: true,
          filled: false,
        }),
      ].toSorted(),
    ).toEqual(['errored', 'invalid'])
  })
})

describe('computeDescribedBy', () => {
  it('hint と（表示中の）error の id を並べる。どちらも無ければ undefined', () => {
    expect(computeDescribedBy({ hintId: 'a-hint', errorId: 'a-error', showError: true })).toBe(
      'a-hint a-error',
    )
    expect(computeDescribedBy({ hintId: 'a-hint', errorId: '', showError: false })).toBe('a-hint')
    expect(computeDescribedBy({ hintId: '', errorId: 'a-error', showError: false })).toBeUndefined()
  })
})

describe('computeView', () => {
  it('1 回の更新に必要な文言・状態・id・ARIA をまとめて返す', () => {
    const view = computeView({
      ...input({ validity: flags({ valueMissing: true }) }),
      controlId: 'email',
      malformed: false,
      invalid: true,
      touched: true,
      hasHint: true,
      hasError: false,
      filled: false,
    })
    expect(view.message).toBe('未入力です。入力してください。')
    expect([...view.states].toSorted()).toEqual(['hinted', 'invalid'])
    expect(view.hintId).toBe('email-hint')
    expect(view.errorId).toBe('email-error')
    expect(view.describedBy).toBe('email-hint email-error')
    expect(view.ariaInvalid).toBe('true')
  })

  it('touched でも error でもなければ文言を出さない', () => {
    const view = computeView({
      ...input({ validity: flags({ valueMissing: true }) }),
      controlId: 'email',
      malformed: false,
      invalid: true,
      touched: false,
      hasHint: false,
      hasError: false,
      filled: false,
    })
    expect(view.message).toBe('')
    expect(view.describedBy).toBeUndefined()
    expect(view.ariaInvalid).toBeUndefined()
  })
})
