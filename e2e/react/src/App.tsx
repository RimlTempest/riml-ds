import { RdButton, RdDialog, RdTextField } from '@rimltempest/riml-ds-react'
// experimental は専用サブパスからしか出ない（ADR-0009）
import {
  RdCheckbox,
  RdCheckboxGroup,
  RdCombobox,
  RdCommand,
  RdInputOtp,
  RdMenu,
  RdMeter,
  RdPopover,
  RdRadioGroup,
  RdSelect,
  RdSlider,
  RdTabs,
  RdToggle,
  RdWindow,
} from '@rimltempest/riml-ds-react/experimental'
import type { ReactNode } from 'react'

/** 4 フレームワークで同じ選択肢を出す */
const countries = (
  <>
    <option value="">選択してください</option>
    <option value="jp">日本</option>
    <option value="us">アメリカ</option>
  </>
)

/** 4 フレームワークで同じ候補を出す。候補の唯一の出どころは `<datalist>` */
const readings = (
  <>
    <option value="kana">かな</option>
    <option value="kanji">かんじ</option>
    <option value="romaji">ローマ字</option>
  </>
)

/** 4 フレームワークで同じ項目。リンクとボタンのままなので JS 無しでも辿れる */
const commandGroups = (
  <>
    <ul aria-label="ページ">
      <li>
        <a href="#home" data-keywords="home top">
          ホーム
        </a>
      </li>
      <li>
        <a href="#settings" data-keywords="せってい preferences">
          設定
        </a>
      </li>
    </ul>
    <ul aria-label="操作">
      <li>
        <button type="button" value="new">
          新しいノート<kbd className="rd-kbd">⌘N</kbd>
        </button>
      </li>
    </ul>
  </>
)

/** 4 フレームワークで同じ 1 ページ。既定 export（'use client' 無し）だけで組む */
export const App = (): ReactNode => (
  <main>
    <h1>お問い合わせ</h1>
    <form id="contact" method="get" action="/thanks.html">
      <RdTextField label="メール" name="email" type="email" required hint="確認メールを送ります" />
      <RdSelect label="国" name="country">
        {countries}
      </RdSelect>
      <RdCheckbox label="お知らせを受け取る" name="news" defaultValue="yes" />
      <RdButton type="submit">送信</RdButton>
    </form>
    <RdDialog label="送信しました" placement="end">
      <p>確認メールを送りました。</p>
    </RdDialog>
    <RdMeter id="disk" label="ディスク使用量" value="3.2" max="10" text="3.2 GB / 10 GB" />
    <RdWindow title="バックアップの設定" collapsible>
      <p>毎晩 3 時に実行します。</p>
    </RdWindow>
    <RdRadioGroup label="プラン">
      <label>
        <input type="radio" id="plan-free" name="plan" value="free" />
        無料
      </label>
      <label>
        <input type="radio" id="plan-pro" name="plan" value="pro" />
        有料
      </label>
    </RdRadioGroup>
    <RdSlider id="volume" label="音量" name="volume" defaultValue="3" min="0" max="10" />
    <RdTabs
      label="ドキュメント"
      tabs={
        <>
          <a href="#overview">概要</a>
          <a href="#usage">使い方</a>
        </>
      }
      panels={
        <>
          <div id="overview">
            <p>この部品の概要。</p>
          </div>
          <div id="usage">
            <p>使い方の説明。</p>
          </div>
        </>
      }
    />
    <RdMenu
      label="操作"
      id="row-actions"
      trigger={
        <rd-button slot="trigger">
          <button type="button" popoverTarget="row-actions">
            操作
          </button>
        </rd-button>
      }
      items={
        <>
          <a href="/thanks.html">複製</a>
          <button type="button">削除</button>
        </>
      }
    />
    <RdPopover
      id="filters"
      label="絞り込み"
      trigger={
        <rd-button slot="trigger">
          <button type="button" popoverTarget="filters">
            絞り込み
          </button>
        </rd-button>
      }
    >
      <p>条件を選ぶと一覧がその場で変わる。</p>
    </RdPopover>
    <RdCheckboxGroup label="タグ">
      <label>
        <input type="checkbox" id="tag-work" name="tags" value="a" />
        仕事
      </label>
      <label>
        <input type="checkbox" id="tag-private" name="tags" value="b" />
        私用
      </label>
    </RdCheckboxGroup>
    <RdInputOtp label="確認コード">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]"
        maxLength={1}
        id="code-1"
        name="code-1"
        aria-label="1 桁目"
        title="0〜9 の数字 1 文字"
        required
        autoComplete="one-time-code"
      />
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]"
        maxLength={1}
        id="code-2"
        name="code-2"
        aria-label="2 桁目"
        title="0〜9 の数字 1 文字"
        required
      />
    </RdInputOtp>
    <RdCombobox id="reading" listId="reading-list" label="読み" name="reading">
      {readings}
    </RdCombobox>
    <RdCommand id="palette" label="コマンド" groups={commandGroups} />
    <RdToggle label="太字" pressed="false" />
    <rd-live-region />
  </main>
)
