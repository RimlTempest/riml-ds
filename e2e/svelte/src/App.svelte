<script>
  import { RdButton, RdDialog, RdTextField } from '@rimltempest/riml-ds-svelte'
  // experimental は専用サブパスからしか出ない（ADR-0009）
  import {
    RdCheckbox,
    RdCheckboxGroup,
    RdInputOtp,
    RdMeter,
    RdRadioGroup,
    RdSelect,
    RdSlider,
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
  <RdDialog label="送信しました"><p>確認メールを送りました。</p></RdDialog>
  <RdMeter id="disk" label="ディスク使用量" value="3.2" max="10" text="3.2 GB / 10 GB" />
  <RdWindow title="バックアップの設定" collapsible><p>毎晩 3 時に実行します。</p></RdWindow>
  <RdRadioGroup label="プラン">
    <label><input type="radio" id="plan-free" name="plan" value="free" />無料</label>
    <label><input type="radio" id="plan-pro" name="plan" value="pro" />有料</label>
  </RdRadioGroup>
  <RdSlider id="volume" label="音量" name="volume" defaultValue="3" min="0" max="10" />
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
  <rd-live-region></rd-live-region>
</main>
