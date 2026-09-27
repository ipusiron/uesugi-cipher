const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const I18n = require(path.join(root, 'docs/js/i18n.js'));
const html = read('docs/index.html');
const script = read('docs/js/script.js');
// gフラグを付けるとlastIndexが残り、ループで交互にfalseになる。
const JP = /[぀-ヿ一-鿿]/;

test('i18n: 日本語と英語でキーの集合が同じ', () => {
  const ja = Object.keys(I18n.ja);
  const en = Object.keys(I18n.en);
  assert.deepEqual(ja.filter(key => !(key in I18n.en)), [], '英語に無いキーがある');
  assert.deepEqual(en.filter(key => !(key in I18n.ja)), [], '日本語に無いキーがある');
  assert.ok(ja.length >= 55, `キーが少なすぎる: ${ja.length}`);
});

test('i18n: 差し込みの名前が日英で一致する', () => {
  const holes = value => [...String(value).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
  assert.deepEqual(Object.keys(I18n.ja).filter(key => holes(I18n.ja[key]) !== holes(I18n.en[key])), []);
});

test('i18n: index.html が指すキーはすべて辞書にある', () => {
  const keys = new Set();
  for (const match of html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)) keys.add(match[1]);
  assert.ok(keys.size >= 25, `data-i18n が少なすぎる: ${keys.size}`);
  assert.deepEqual([...keys].filter(key => !(key in I18n.ja)), []);
});

test('i18n: script.js が呼ぶキーはすべて辞書にある', () => {
  const keys = new Set();
  for (const match of script.matchAll(/(?<!I18n\.)\bt\(\s*'([\w.]+)'/g)) keys.add(match[1]);
  // 'issue.' + reason のように組み立てるキーは、前半だけを拾わない。
  for (const match of script.matchAll(/\bkey:\s*'([\w.]+)'/g)) {
    if (!match[1].endsWith('.')) keys.add(match[1]);
  }
  assert.ok(keys.size >= 20, `キーの呼び出しが少なすぎる: ${keys.size}`);
  assert.deepEqual([...keys].filter(key => !(key in I18n.ja)), []);
  // 'issue.' + reason のように組み立てるキーは静的に拾えないので明示で縛る。
  for (const reason of ['range', 'empty', 'passthrough']) assert.ok(('issue.' + reason) in I18n.ja);
});

test('i18n: 英語の辞書に訳し忘れの日本語が残っていない', () => {
  // 切り替えボタンは相手の言語を出すのが正しい。
  // 入力例の「てきみゆ」と漢数字はこのツールが扱う対象そのものなので、英語表示でも変えない。
  const expected = new Set(['app.langButton', 'input.placeholderEncrypt', 'input.placeholderDecrypt']);
  assert.deepEqual(Object.keys(I18n.en).filter(key => !expected.has(key) && JP.test(I18n.en[key])), []);
});

test('i18n: t() は差し込みを埋め、知らないキーで throw する', () => {
  assert.match(I18n.t('key.errLength', { count: 5 }), /5/);
  assert.match(I18n.t('msg.inputTooLong', { max: '10,000', count: 12 }), /10,000/);
  assert.match(I18n.t('conv.itemRepeat', { from: 'ぷ', to: 'ふ', count: 2 }), /ぷ.*ふ.*2/);
  assert.throws(() => I18n.t('no.such.key'), /Unknown message/);
});

test('i18n: script.js に残る和文は扱う対象のデータだけ', () => {
  // コメントは対象外。文字列リテラルの中だけを見る。
  const withoutComments = script.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const literals = [...withoutComments.matchAll(/'([^'\\\n]*)'|"([^"\\\n]*)"|`([^`\\]*)`/g)]
    .map(match => match[1] ?? match[2] ?? match[3])
    .filter(value => JP.test(value));
  // 漢数字の見出しと鍵の例は、言語を変えても変わらないデータ。
  assert.deepEqual(literals, ['一', '二', '三', '四', '五', '六', '七', 'みかさのやまに', 'いでしつきかも'],
    `画面用の日本語が残っている: ${literals.join(' / ')}`);
});

test('i18n: 対応表と暗号ロジックには触れていない', () => {
  // 扱う対象（いろは48文字・清音への変換表）は言語を変えても変わらない。
  const logic = read('docs/js/uesugi-logic.js');
  assert.match(logic, /const IROHA = 'いろはにほへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせすん'/);
  assert.match(logic, /const KANJI = '一二三四五六七'/);
  assert.match(logic, /'が': 'か', 'ぎ': 'き', 'ぐ': 'く', 'げ': 'け', 'ご': 'こ'/);
  assert.match(logic, /'っ': 'つ'/);
  // ロジックは辞書を知らない。文言の面倒はUI側だけで見る。
  assert.doesNotMatch(logic, /I18n|data-i18n/);
});

test('i18n: 表示中の状態を文字列一致で判定していない', () => {
  // 言語を変えると壊れるので、コピー済みかどうかは dataset に持つ。
  assert.match(script, /dataset\.state/);
  assert.match(script, /setCopyButton\(/);
  assert.doesNotMatch(script, /copyBtn'\)\.textContent\s*=\s*['"]/);
  assert.doesNotMatch(script, /const COPY_LABEL|const RESTORE/);
});

test('i18n: 通知と鍵の指摘はキーで覚えて訳し直す', () => {
  // 表示中のメッセージを文字列で持つと、切り替えの再描画で消えるか元の言語で残る。
  assert.match(script, /let currentMessage = null/);
  assert.match(script, /let keyMessages = /);
  assert.match(script, /function renderMessage\(/);
  assert.match(script, /function renderKeyMessages\(/);
  // 一覧の区切りをハードコードしない。
  assert.doesNotMatch(script, /join\('、'\)/);
  assert.match(script, /list\.separator/);
});

test('i18n: 言語を変えたときに描き直す仕掛けがある', () => {
  assert.match(script, /I18n\.init\(\)/);
  assert.match(script, /languagechange/);
  assert.match(script, /function retranslate\(/);
  // まるごと再実行すると、クリア直後の空の状態が壊れる。
  assert.doesNotMatch(script, /languagechange', runCipher|languagechange', updateSettings/);
});

test('i18n: 状態で変わる属性に data-i18n-<attr> を付けていない', () => {
  // apply() は属性を無条件に上書きするので、表示中に切り替えると状態が巻き戻る。
  assert.doesNotMatch(html, /id="themeToggle"[^>]*data-i18n/);
  assert.doesNotMatch(html, /id="inputText"[^>]*data-i18n/);
  assert.match(script, /function setThemeLabel\(/);
  assert.match(script, /function updatePlaceholder\(/);
});

test('i18n: i18n.js を他のスクリプトより先に読み込む', () => {
  assert.ok(html.indexOf('<script src="js/i18n.js"') < html.indexOf('<script src="js/uesugi-logic.js"'));
  assert.ok(html.indexOf('<script src="js/uesugi-logic.js"') < html.indexOf('<script src="js/script.js"'));
});

test('i18n: 切り替えボタンの id は langToggle', () => {
  // 検証用のプローブがこの id を決め打ちで押す。
  assert.match(html, /id="langToggle"/);
  assert.match(html, /id="langToggle"[^>]*type="button"/);
});

test('i18n: noscript は両方の言語を出す', () => {
  const match = html.match(/<noscript>([\s\S]*?)<\/noscript>/);
  assert.ok(match, 'noscript が無い');
  assert.match(match[1], /JavaScript/);
  assert.match(match[1], JP, 'JSが動かないと切り替えられないので日本語も要る');
});

test('i18n: 子要素を持つ要素に data-i18n を付けていない', () => {
  // apply() は textContent を置き換えるので、子要素があると消える。
  const bad = [];
  for (const match of html.matchAll(/<(\w+)([^>]*\sdata-i18n="[^"]+"[^>]*)>([\s\S]*?)<\/\1>/g)) {
    if (match[3].includes('<')) bad.push(match[1] + ': ' + match[3].slice(0, 40));
  }
  assert.deepEqual(bad, []);
});

test('i18n: HTMLに残る和文は data-i18n の初期値と例外だけ', () => {
  // data-i18n を持つ要素をタグごと落とし、残った和文を数える。
  let rest = html.replace(/<(\w+)[^>]*\sdata-i18n="[^"]+"[^>]*>[\s\S]*?<\/\1>/g, '');
  rest = rest.replace(/<noscript>[\s\S]*?<\/noscript>/, '');
  const lines = rest.split('\n').filter(line => JP.test(line));
  // 例外は meta description、title、状態で訳すテーマボタンとコピーボタン、section の aria-label。
  assert.equal(lines.length, 5, lines.join(' | '));
  assert.ok(lines.some(line => line.includes('name="description"')));
  assert.ok(lines.some(line => line.includes('<title>')));
  assert.ok(lines.some(line => line.includes('id="themeToggle"')));
  assert.ok(lines.some(line => line.includes('id="copyBtn"')));
  assert.ok(lines.some(line => line.includes('class="work-area"')));
});

test('i18n: READMEに相互の言語リンクがある', () => {
  const ja = read('README.md');
  const en = read('README.en.md');
  // YAMLのコメントより後（H1の直後）に置く。先頭に足すとYAMLの検査が落ちる。
  assert.ok(ja.startsWith('<!--'));
  assert.match(ja, /\n# [^\n]+\n\n\[English\]\(README\.en\.md\) · 日本語\n/);
  assert.match(en, /^# [^\n]+\n\nEnglish · \[日本語\]\(README\.md\)\n/);
});

test('i18n: README.en.md の本文が英語で、データの見出しだけ和文を残す', () => {
  const en = read('README.en.md');
  assert.ok(en.length > 4000, `短すぎる: ${en.length}`);
  for (const value of ['Uesugi', 'iroha', 'jihen-shij', 'GitHub Pages', 'npm test']) {
    assert.ok(en.includes(value), value);
  }
  // 平文の例・かなの鍵・漢数字は訳さない対象なので、表の中には和文が残る。
  assert.ok(en.includes('てきみゆ'));
  assert.ok(en.includes('五七　六三　六六　六四'));
});
