import { buttonMarkup } from '@rimltempest/riml-ds-elements/button'
import { splitterMarkup } from '@rimltempest/riml-ds-elements/experimental/splitter'
import { calendarMarkup } from '@rimltempest/riml-ds-elements/experimental/calendar'
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
import { numberFieldMarkup } from '@rimltempest/riml-ds-elements/experimental/number-field'
import {
  toggleGroupMarkup,
  toggleItemMarkup,
} from '@rimltempest/riml-ds-elements/experimental/toggle-group'
import { textFieldMarkup } from '@rimltempest/riml-ds-elements/text-field'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import * as experimental from '../src/experimental.js'
import {
  RdCalendar,
  RdCarousel,
  RdCommand,
  RdDataTable,
  RdNumberField,
  RdSplitter,
  RdToggleGroup,
} from '../src/experimental.js'
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
      'RdCalendar',
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
      'RdNumberField',
      'RdPopover',
      'RdRadioGroup',
      'RdSelect',
      'RdSlider',
      'RdSplitter',
      'RdTabs',
      'RdToggle',
      'RdToggleGroup',
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

  it('RdCalendar は week-start をハイフン付きの属性に、min / max を <input> に出す', () => {
    const rendered = renderToString(
      <RdCalendar
        id="due"
        label="期限"
        name="due"
        today="2026-09-09"
        weekStart="1"
        defaultValue="2026-09-15"
        min="2026-09-05"
        max="2026-09-25"
        required
      />,
    )
    expect(normalize(rendered)).toBe(
      normalize(
        calendarMarkup({
          id: 'due',
          label: '期限',
          name: 'due',
          today: '2026-09-09',
          weekStart: '1',
          defaultValue: '2026-09-15',
          min: '2026-09-05',
          max: '2026-09-25',
          required: true,
        }),
      ),
    )
    expect(normalize(rendered)).toContain('week-start="1"')
    expect(normalize(rendered)).toContain('min="2026-09-05"')
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

  it('RdToggleGroup は mode / orientation / variant を属性として出す', () => {
    const items =
      toggleItemMarkup({ label: '太字', value: 'bold', pressed: 'true' })
      + toggleItemMarkup({ label: '斜体', value: 'italic' })
    const rendered = normalize(
      renderToString(
        <RdToggleGroup label="書式" mode="single" orientation="vertical" variant="ghost">
          <span dangerouslySetInnerHTML={{ __html: items }} />
        </RdToggleGroup>,
      ),
    )
    expect(rendered).toContain('mode="single"')
    expect(rendered).toContain('orientation="vertical"')
    expect(rendered).toContain('variant="ghost"')
    // JSX は生 HTML を <span> でしか差し込めない。その分を除けば markup() と同じ木になる
    expect(rendered.replaceAll('<span>', '').replaceAll('</span>', '')).toBe(
      normalize(
        toggleGroupMarkup({
          label: '書式',
          mode: 'single',
          orientation: 'vertical',
          variant: 'ghost',
          children: items,
        }),
      ),
    )
  })

  it('RdNumberField は min / max / step / defaultValue を <input> に出す', () => {
    const rendered = renderToString(
      <RdNumberField
        id="copies"
        label="枚数"
        name="copies"
        defaultValue="1"
        min="1"
        max="99"
        step="1"
        required
        hint="1 から 99 まで"
      />,
    )
    expect(normalize(rendered)).toBe(
      normalize(
        numberFieldMarkup({
          id: 'copies',
          label: '枚数',
          name: 'copies',
          defaultValue: '1',
          min: '1',
          max: '99',
          step: '1',
          required: true,
          hint: '1 から 99 まで',
        }),
      ),
    )
    expect(normalize(rendered)).toContain('type="number"')
  })
})
