import { buttonMarkup } from '@rimltempest/riml-ds-elements/button'
import { textFieldMarkup } from '@rimltempest/riml-ds-elements/text-field'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import * as experimental from '../src/experimental.js'
import * as index from '../src/index.js'
import { RdButton, RdTextField } from '../src/index.js'
import { normalize } from './normalize.js'

describe('既定 export の部品', () => {
  it('RdButton の renderToString が buttonMarkup と同じ HTML になる', () => {
    expect(normalize(renderToString(<RdButton type="submit">保存</RdButton>))).toBe(
      normalize(buttonMarkup({ label: '保存', type: 'submit' })),
    )
  })

  it('RdTextField の renderToString が textFieldMarkup と同じ HTML になる', () => {
    const rendered = renderToString(
      <RdTextField label="メール" name="email" type="email" required hint="確認メールを送ります" />,
    )
    expect(normalize(rendered)).toBe(
      normalize(
        textFieldMarkup({
          id: 'email',
          label: 'メール',
          name: 'email',
          type: 'email',
          required: true,
          hint: '確認メールを送ります',
        }),
      ),
    )
  })

  it('className は custom element でも class 属性になる（React 19）', () => {
    expect(renderToString(<RdButton className="wide">保存</RdButton>)).toContain('class="wide"')
  })

  it('ティア C（rd-live-region）は既定 export に無い', () => {
    // JS 無しで意味が無いのでマークアップ部品を生成しない（/client にだけ出る）
    expect(Object.keys(index)).toEqual(['RdButton', 'RdDialog', 'RdTextField'])
  })

  it('experimental の部品は root から出ず、./experimental から出る（ADR-0009）', () => {
    expect(Object.keys(index)).not.toContain('RdSelect')
    expect(Object.keys(experimental)).toEqual([
      'RdCheckbox',
      'RdCheckboxGroup',
      'RdDisclosure',
      'RdInputOtp',
      'RdMeter',
      'RdRadioGroup',
      'RdSelect',
      'RdSlider',
      'RdWindow',
    ])
  })
})
