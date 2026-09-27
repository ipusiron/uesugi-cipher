# Uesugi Cipher Toolの開発案内

Day012の字変四十八方式を体験する静的Webツールです。vanilla JSで実装し、依存パッケージはありません。

## 構成

- docs/index.html：入力・設定・結果・換字表
- docs/css/style.css：和風カード、ライト・ダーク、モバイル表示
- docs/js/uesugi-logic.js：DOMと乱数源に依存しない純粋ロジック
- docs/js/i18n.js：日本語と英語の文言、data-i18nの適用、言語の保存
- docs/js/script.js：DOM構築、入力検証、コピー、テーマ、乱数の供給
- test/：node:testとnode:assert/strictによるテスト
- .github/workflows/test.yml：Node 22のnpm test
- .github/workflows/deploy.yml：main更新時にdocs/だけをPagesへ配信（変更しない）
- assets/：READMEの画像。今回は旧screenshot.pngを保持し、screenshot2〜4を使用

## 座標系（変更禁止）

いろは48文字を右上から縦に配置します。列は右から1〜7、行は上から1〜7、座標は列→行です。空きマスは列7・行7のみです。buildGridの配列はgrid[rowIndex][columnIndex]で、右端のcolumnIndexは6です。

標準鍵は列・行とも1234567です。鍵は見出しだけを置き換え、文字の配置は変えません。列の鍵は右から、行の鍵は上から割り当てます。

## 公開ロジック

古典スクリプトのglobalThis.UesugiLogicとCommonJSの両方で公開します。

| 名前 | 戻り値・役割 |
|---|---|
| IROHA / STANDARD_KEY / MAX_INPUT | 48文字 / 1234567 / 10000 |
| positionOf(char) | 1始まりの{col, row}、未収録はnull |
| charAt(col, row) | 文字、空きは空文字、範囲外はnull |
| buildGrid() | 左から右の7×7配列 |
| normalizePlain(text) | {text, conversions, removedSpaces} |
| normalizeKey(text) | NFKC・清音化・空白除去後の鍵 |
| validateKey(key) | nullまたはlength / duplicate / charset |
| keyKind(key) | numeric / kana、不正な鍵はRangeError |
| validateInput(text) | nullまたはempty / too-long（コードポイントで計数） |
| encrypt(text, options) | {text, conversions, removedSpaces, used, unknown} |
| decrypt(text, options) | {text, used, issues}、両数字表記を受理 |
| summarizeConversions(list) | {from, to, count}の配列 |
| shuffleKey(randomInt) | 渡された乱数関数を使うFisher–Yatesの並べ替え |

encryptのoptionsはnotation・colKey・rowKey、decryptはcolKey・rowKeyです。鍵の不正・種類の混在はRangeErrorになります。画面側で先に検証します。復号の不正トークンでは例外を出さず、issuesでrange・empty・passthroughを通知します。

NFKC後のカタカナ・濁点・半濁点・小書きは清音にし、長音と行内の空白を取り除きます。改行は保持します。未収録文字は1コードポイント＝1トークンでそのまま出します。元の濁点・空白などは復元できません。

## 開発コマンド

```sh
npm test
python -m http.server --directory docs
```

テストはNode 22以上、ネットワーク不要です。画面はdocs/index.htmlをfile://で直接開いても動きます。HTTPとfile://で操作・console・CSP・外部通信0件を確認してください。READMEの使用例・変換表・鍵・歴史補足の表記はテストで検証します。

## 守ること

- ES moduleにせず、i18n→ロジック→DOMの順でdefer付きの古典スクリプトを読み込む
- 外部リクエスト0件を維持し、依存・CDN・Webフォントを追加しない
- innerHTMLを使わず、createElementとtextContentで描画する
- CSPにunsafe-inline・frame-ancestorsを入れない
- 入力・結果・鍵を保存せず、localStorageは検証済みのテーマ値と言語の選択のみ
- 乱数は画面側のcrypto.getRandomValuesで生成し、剰余の偏りを除く
- READMEの表・例とロジックを同時に更新し、期待値の変更で失敗を隠さない
- かなの例は重複のない句の例であり、史料に載る鍵と説明しない
- 訳すのは画面の文言だけ。いろは48文字・漢数字・かなの鍵・入力例は扱う対象なので訳さない
- 表示中の状態（コピー済み・テーマ・鍵の指摘・通知）は文字列でなくキーで持ち、languagechangeで訳し直す
- 和風のカード構成を保持し、320px・390pxと1280×1000で、日本語と英語の両方で表示を確認する
