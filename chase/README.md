# 姥捨山 — 森のチェイス章

`index.html` が起点です。`姥捨山_chase_module` フォルダごとWebサーバーで配信してください。GitHub Pagesならフォルダをリポジトリに配置し、公開URLの `姥捨山_chase_module/` を開きます。iPhoneのローカルWeb Serverでも、このフォルダをサイトのルートに指定します。

統合版では開始ボタンを使用しません。2Dプロローグから `chase/index.html` へ移動すると、暗転状態のまま森の初期化を待ち、準備完了後に自動で1回だけ開始します。開始後、約2.5m（歩いて3～4歩）移動するとゲームが一時停止し、実機スクリーンショットと狐面の少女による全5ページの操作案内が一度だけ表示されます。最後の「探索に戻る」または「スキップ」で、途中の位置からゲームを再開します。案内だけを確認する場合は `tutorial-preview.html` を開いてください。案内表示時と「次へ」を押した時に `assets/tutorial/hyoshigi.mp3` を鳴らします。

## 遊び方

森のランダムな7か所で蝋燭を拾い、別の7か所にある灯籠に近づいて点灯します。蝋燭を所持して灯籠のそばまで近づくと自動で1本消費して点灯します。画面の操作ボタンや灯籠のタップでも点灯できます。所持品は最大3枠なので、灯籠に運んで枠を空けながら進めます。七つ点灯するとトンネルの封鎖が解けます。開いた入口を通過すると章クリアです。コンパスはトンネルの中央を指します。懐中電灯の電池表示の下に、開始からの経過時間と点灯数を表示します。ライト用電池・体力・敵とのチェイスは維持しています。

## 2Dシナリオとの接続

2D側から `index.html` に移動すると、`module-bridge.js` が `UbasuteyamaCandleForest.ready()` を監視し、準備完了後に `UbasuteyamaCandleForest.start()` を1回だけ呼びます。旧タイトルや旧ホームの開始ボタンは開始経路として使用しません。クリアすると `window` に `ubasuteyama:chapter-complete`（`detail.chapter='forest'`, `detail.elapsed`）と `ubasuteyama:result`（`detail.outcome='victory'`）を発行します。失敗時は `ubasuteyama:result`（`detail.outcome='gameover'`）です。iframeの親画面へ伝える場合はイベントを受けて `postMessage` を追加してください。

## ファイル構成

- `index.html`: HTMLと既存の非実行データ。旧 `#ux-front` は削除し、互換用 `#home` は初回描画前から常時非表示。
- `js/candle-forest-chapter.js`: 森のマップ範囲、灯籠・蝋燭、章クリア条件とローカルGLB読込。
- `css/forest-chapter-hud.css`: 経過時間と灯籠の点灯数。
- `js/module-bridge.js`: チェイス開始と結果通知。
- `js/forest-tutorial.js`・`css/forest-tutorial.css`: 章冒頭の案内。`assets/tutorial/` に実機画像5枚と透過立ち絵。
- `tutorial-preview.html`: 案内画面だけを試せるページ。
- `js/`, `css/`: 既存ゲームのスクリプトとスタイル。読み込み順を維持。
- `assets/`: 参照される埋込素材と、提供された `stone_lamp.glb`・`candle_low.glb`。

旧バイクの3Dモデル、四つ目の部品による敵変化イベント、時間経過による学校チャイム音声は削除しました。神社・洞窟の生成を停止し、森の外周をトンネル以外は崖で囲んでいます。ロッカー・旧シナリオ記録の配置と操作は停止しました。旧コードに依存する見えない制御要素は残しています。付属モデルをGitHub Pagesで公開する前に、それぞれの配布条件を確認してください。
