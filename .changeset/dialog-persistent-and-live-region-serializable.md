---
'@rimltempest/riml-ds-elements': minor
---

`rd-dialog` の `dismissible`（既定 true）を **`persistent`（既定 false）に反転**した。
boolean 属性は HTML で「無い = false」しか表せず、`dialogMarkup({ dismissible: false })` が
属性を省くだけで既定の true のまま立ち上がる欠陥があったため（0.x なので破壊的変更を今のうちに入れる）。

```diff
- <rd-dialog>            <!-- 閉じられる（既定） -->
- <!-- 閉じられない指定は属性で書けなかった -->
+ <rd-dialog>            <!-- 閉じられる（既定） -->
+ <rd-dialog persistent> <!-- Esc も背面クリックも受けない -->
```

`rd-live-region` の shadow root を `serializable: true` にした。
`getHTML({ serializableShadowRoots: true })` に読み上げノードが出るようになり、
描画後 HTML の検査（markuplint）で live region が見えるようになる。
