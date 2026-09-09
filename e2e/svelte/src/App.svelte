<script>
  import { RdButton, RdDialog, RdTextField } from '@rimltempest/riml-ds-svelte'
  // experimental は専用サブパスからしか出ない（ADR-0009）
  import {
    RdCalendar,
    RdCarousel,
    RdCheckbox,
    RdCheckboxGroup,
    RdCombobox,
    RdCommand,
    RdDataTable,
    RdInputOtp,
    RdMenu,
    RdMeter,
    RdNumberField,
    RdPopover,
    RdRadioGroup,
    RdSelect,
    RdSlider,
    RdSplitter,
    RdTabs,
    RdToggle,
    RdToggleGroup,
    RdWindow,
  } from '@rimltempest/riml-ds-svelte/experimental'
</script>

<main>
  <h1>お問い合わせ</h1>
  <form id="contact" method="get" action="/thanks.html">
    <RdTextField label="メール" name="email" type="email" required hint="確認メールを送ります" />
    <RdSelect label="国" name="country">
      <option value="">選択してください</option>
      <option value="jp">日本</option>
      <option value="us">アメリカ</option>
    </RdSelect>
    <RdCheckbox label="お知らせを受け取る" name="news" defaultValue="yes" />
    <RdButton type="submit">送信</RdButton>
  </form>
  <RdDialog label="送信しました" placement="end"><p>確認メールを送りました。</p></RdDialog>
  <RdMeter id="disk" label="ディスク使用量" value="3.2" max="10" text="3.2 GB / 10 GB" />
  <RdWindow title="バックアップの設定" collapsible><p>毎晩 3 時に実行します。</p></RdWindow>
  <RdRadioGroup label="プラン">
    <label><input type="radio" id="plan-free" name="plan" value="free" />無料</label>
    <label><input type="radio" id="plan-pro" name="plan" value="pro" />有料</label>
  </RdRadioGroup>
  <RdSlider id="volume" label="音量" name="volume" defaultValue="3" min="0" max="10" />
  <RdTabs label="ドキュメント">
    {#snippet tabs()}<a href="#overview">概要</a><a href="#usage">使い方</a>{/snippet}
    {#snippet panels()}<div id="overview"><p>この部品の概要。</p></div><div id="usage">
        <p>使い方の説明。</p>
      </div>{/snippet}
  </RdTabs>
  <RdMenu label="操作" id="row-actions">
    {#snippet trigger()}<rd-button slot="trigger"
        ><button type="button" popovertarget="row-actions">操作</button></rd-button
      >{/snippet}
    {#snippet items()}<a href="/thanks.html">複製</a><button type="button">削除</button>{/snippet}
  </RdMenu>
  <RdPopover id="filters" label="絞り込み">
    {#snippet trigger()}<rd-button slot="trigger"
        ><button type="button" popovertarget="filters">絞り込み</button></rd-button
      >{/snippet}
    {#snippet children()}<p>条件を選ぶと一覧がその場で変わる。</p>{/snippet}
  </RdPopover>
  <RdCheckboxGroup label="タグ">
    <label><input type="checkbox" id="tag-work" name="tags" value="a" />仕事</label>
    <label><input type="checkbox" id="tag-private" name="tags" value="b" />私用</label>
  </RdCheckboxGroup>
  <RdInputOtp label="確認コード">
    <input
      type="text"
      inputmode="numeric"
      pattern="[0-9]"
      maxlength="1"
      id="code-1"
      name="code-1"
      aria-label="1 桁目"
      title="0〜9 の数字 1 文字"
      required
      autocomplete="one-time-code"
    />
    <input
      type="text"
      inputmode="numeric"
      pattern="[0-9]"
      maxlength="1"
      id="code-2"
      name="code-2"
      aria-label="2 桁目"
      title="0〜9 の数字 1 文字"
      required
    />
  </RdInputOtp>
  <RdCombobox id="reading" listId="reading-list" label="読み" name="reading">
    <option value="kana">かな</option>
    <option value="kanji">かんじ</option>
    <option value="romaji">ローマ字</option>
  </RdCombobox>
  <RdSplitter label="面の割合">
    {#snippet start()}<p>一覧の面。</p>{/snippet}
    {#snippet end()}<p>本文の面。</p>{/snippet}
  </RdSplitter>
  <RdCommand id="palette" label="コマンド">
    {#snippet groups()}
      <ul aria-label="ページ">
        <li><a href="#home" data-keywords="home top">ホーム</a></li>
        <li><a href="#settings" data-keywords="せってい preferences">設定</a></li>
      </ul>
      <ul aria-label="操作">
        <li><button type="button" value="new">新しいノート<kbd class="rd-kbd">⌘N</kbd></button></li>
      </ul>
    {/snippet}
  </RdCommand>
  <RdDataTable caption="保存したコード">
    {#snippet head()}<thead
        ><tr
          ><th scope="col" data-sort="text" data-key="name">名前</th><th
            scope="col"
            data-sort="number"
            data-key="size"
            data-numeric=""
          >
            サイズ
          </th></tr
        ></thead
      >{/snippet}
    {#snippet body()}<tbody
        ><tr
          ><td>b.png</td><td data-value="1234" data-numeric="">1,234</td></tr
        ><tr><td>a.png</td><td data-value="820" data-numeric="">820</td></tr></tbody
      >{/snippet}
  </RdDataTable>
  <RdCalendar id="due" label="期限" name="due" defaultValue="2026-09-15" today="2026-09-09" />
  <RdCarousel label="おすすめ">
    <li><p>秋の便り</p></li>
    <li><p>冬の支度</p></li>
    <li><p>春の準備</p></li>
  </RdCarousel>
  <RdToggle label="太字" pressed="false" />
  <RdToggleGroup label="書式" mode="single">
    {#snippet children()}<button type="button" value="bold" aria-pressed="true">強調</button
      ><button type="button" value="italic" aria-pressed="false">斜体</button>{/snippet}
  </RdToggleGroup>
  <RdNumberField id="copies" label="枚数" name="copies" defaultValue="1" min="1" max="99" />
  <rd-live-region></rd-live-region>
</main>
