import { buttonMarkup } from '@rimltempest/riml-ds-elements/button'
import { splitterMarkup } from '@rimltempest/riml-ds-elements/experimental/splitter'
import {
  carouselItemMarkup,
  carouselMarkup,
} from '@rimltempest/riml-ds-elements/experimental/carousel'
import {
  commandGroupMarkup,
  commandItemMarkup,
  commandMarkup,
} from '@rimltempest/riml-ds-elements/experimental/command'
import {
  dataTableBodyMarkup,
  dataTableHeadMarkup,
  dataTableRowMarkup,
} from '@rimltempest/riml-ds-elements/experimental/data-table/contract'
import { textFieldMarkup } from '@rimltempest/riml-ds-elements/text-field'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import * as experimental from '../src/experimental.js'
import { RdCarousel, RdCommand, RdDataTable, RdSplitter } from '../src/experimental.js'
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

  it('RdCommand の renderToString が commandMarkup と同じ HTML になる（groups は子として渡す）', () => {
    const rendered = renderToString(
      <RdCommand
        id="palette"
        label="コマンド"
        filter="prefix"
        groups={
          <ul aria-label="ページ">
            <li>
              <a href="/">ホーム</a>
            </li>
          </ul>
        }
      />,
    )
    expect(normalize(rendered)).toBe(
      normalize(
        commandMarkup({
          id: 'palette',
          label: 'コマンド',
          filter: 'prefix',
          groups: commandGroupMarkup({
            label: 'ページ',
            items: commandItemMarkup({ label: 'ホーム', href: '/' }),
          }),
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
      'RdCarousel',
      'RdCheckbox',
      'RdCheckboxGroup',
      'RdCombobox',
      'RdCommand',
      'RdDataTable',
      'RdDisclosure',
      'RdInputOtp',
      'RdMenu',
      'RdMeter',
      'RdPopover',
      'RdRadioGroup',
      'RdSelect',
      'RdSlider',
      'RdSplitter',
      'RdTabs',
      'RdToggle',
      'RdWindow',
    ])
  })

  it('RdSplitter の renderToString が splitterMarkup と同じ HTML になる（数値の props も属性になる）', () => {
    const rendered = renderToString(
      <RdSplitter
        label="サイドバーの幅"
        position={40}
        min={30}
        max={70}
        start={<p>一覧</p>}
        end={<p>本文</p>}
      />,
    )
    expect(normalize(rendered)).toBe(
      normalize(
        splitterMarkup({
          label: 'サイドバーの幅',
          position: 40,
          min: 30,
          max: 70,
          start: '<p>一覧</p>',
          end: '<p>本文</p>',
        }),
      ),
    )
  })

  it('RdCarousel の renderToString が carouselMarkup と同じ HTML になる（枚は children で渡す）', () => {
    const rendered = renderToString(
      <RdCarousel label="おすすめ" loop>
        <li>秋の便り</li>
        <li>冬の支度</li>
      </RdCarousel>,
    )
    expect(normalize(rendered)).toBe(
      normalize(
        carouselMarkup({
          label: 'おすすめ',
          loop: true,
          children:
            carouselItemMarkup({ children: '秋の便り' })
            + carouselItemMarkup({ children: '冬の支度' }),
        }),
      ),
    )
  })
})

describe('experimental の部品', () => {
  const head = dataTableHeadMarkup([
    { label: '名前', sort: 'text', key: 'name' },
    { label: 'サイズ', sort: 'number', key: 'size', numeric: true },
  ])
  const body = dataTableBodyMarkup([
    dataTableRowMarkup([{ text: 'a.png' }, { text: '1,234', value: '1234', numeric: true }]),
  ])

  it('RdDataTable は column / direction / manual を属性として出す', () => {
    const rendered = renderToString(
      <RdDataTable
        caption="保存したコード"
        column={1}
        direction="descending"
        manual
        head={<span dangerouslySetInnerHTML={{ __html: head }} />}
        body={<span dangerouslySetInnerHTML={{ __html: body }} />}
      />,
    )
    expect(normalize(rendered)).toContain('column="1"')
    expect(normalize(rendered)).toContain('direction="descending"')
    expect(normalize(rendered)).toContain('manual=""')
    // 表そのものは利用側が書く（部品は行を作らない）
    expect(normalize(rendered)).toContain('<caption>保存したコード</caption>')
  })
})
