const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const L = require('../docs/js/uesugi-logic.js');
const root = path.join(__dirname, '..');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const section = (start, end) => readme.split(start)[1].split(end)[0];
const rowsOf = text => text.split('\n').filter(line => /^\|/.test(line))
  .slice(2).map(line => line.split('|').slice(1, -1).map(cell => cell.trim()));

test('使用例の9行を再計算', () => {
  const rows = rowsOf(section('### 使用例\n', '## 🔑'));
  assert.equal(rows.length, 9);
  for (const [plain, normalized, arabic, kanji] of rows) {
    assert.equal(L.normalizePlain(plain).text, normalized);
    assert.equal(L.encrypt(plain).text, arabic);
    assert.equal(L.encrypt(plain, { notation: 'kanji' }).text, kanji);
  }
});

test('濁点の例1〜3と自動変換の39組以上を検査', () => {
  const examples = [...readme.matchAll(/入力: ([^\n]+)\n変換: ([^\n]+)\n暗号化結果: ([^\n]+)/g)];
  assert.equal(examples.length, 3);
  for (const [, plain, converted, encrypted] of examples) {
    assert.equal(L.normalizePlain(plain).text, converted);
    assert.equal(L.encrypt(plain).text, encrypted);
  }
  const conversions = section('### 自動変換の表', '### 📝');
  let count = 0;
  for (const line of conversions.split('\n').filter(line => line.startsWith('|'))) {
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    for (let i = 0; i + 1 < cells.length; i += 2) {
      const from = cells[i];
      const to = cells[i + 1] === '（削除）' ? '' : cells[i + 1];
      if (Array.from(from).length === 1 && Array.from(to).length <= 1) {
        assert.equal(L.normalizePlain(from).text, to, from);
        count++;
      }
    }
  }
  assert.equal(count, 39);
  assert.match(readme, /「ぷ」→「ふ」×2/);
});

test('鍵の5例と鍵空間', () => {
  const block = section('## 🔑 鍵つきモード', '## 🔄');
  const keyRows = rowsOf(block.split('| 鍵 | 平文')[0]);
  assert.equal(keyRows.length, 2);
  const keys = Object.fromEntries(keyRows.map(([id, colKey, rowKey]) => [id, { colKey, rowKey }]));
  assert.deepEqual(keys.K1, { colKey: '3147526', rowKey: '2615374' });
  assert.deepEqual(keys.K2, { colKey: 'みかさのやまに', rowKey: 'いてしつきかも' });
  const rows = rowsOf('| 鍵 | 平文' + block.split('| 鍵 | 平文')[1]);
  assert.equal(rows.length, 5);
  for (const [key, plain, arabic, kanji] of rows) {
    assert.equal(L.encrypt(plain, keys[key]).text, arabic);
    assert.equal(L.encrypt(plain, { ...keys[key], notation: 'kanji' }).text, kanji);
  }
  const spaces = [...readme.matchAll(/25,401,600/g)];
  assert.ok(spaces.length >= 2);
  assert.equal(Number(spaces[0][0].replaceAll(',', '')), 5040 * 5040);
});

test('歴史補足と参考10件', () => {
  const history = section('### 出典と人物についての補足', '## 🎬');
  for (const value of ['宇佐美良賢（勝興）', '貞享元年（1684年）', '寛文6年（1666年）写', '調べた範囲では確認できていません']) {
    assert.ok(history.includes(value), value);
  }
  const refs = section('## 🔗 参考', '## 📁');
  const web = refs.split('### Web')[1].split('### 文献・目録')[0].match(/^- .+$/gm);
  const papers = refs.split('### 文献・目録')[1].match(/^- .+$/gm);
  assert.equal(web.length, 3);
  assert.equal(papers.length, 8);
  for (const value of ['hummingheads.co.jp/reports/series/ser01/110519.html', 'news.mynavi.jp/techplus/article/nadeshiko-74/',
    'ipusiron.github.io/polybius-cipherlab/']) {
    assert.ok(refs.includes(value));
  }
  for (const value of ['新沢佳大', '高橋修「軍学者', '高橋修『【異説】', '遊佐教寛「カミソリ',
    '遊佐教寛「その謙信', '井上泰至', '著作ID 1015050', '宇佐美勝興']) assert.ok(refs.includes(value));
});

test('画像・シリーズ・構成の参照が実在', () => {
  const images = [...readme.matchAll(/!\[[^\]]*\]\((?!https?:)([^)]+)\)/g)];
  assert.equal(images.length, 3);
  for (const [, image] of images) assert.ok(fs.existsSync(path.join(root, image)), image);
  assert.match(readme, /Day012 - 生成AIで作るセキュリティツール100/);
  assert.match(readme, /page_id=42163/);
  for (const file of ['LICENSE', 'CLAUDE.md', 'package.json', 'README.en.md', 'docs/index.html', 'docs/favicon.svg',
    'docs/css/style.css', 'docs/js/script.js', 'docs/js/uesugi-logic.js', 'docs/js/i18n.js', 'test/i18n.test.js',
    '.github/workflows/test.yml', '.github/workflows/deploy.yml']) {
    assert.ok(fs.existsSync(path.join(root, file)));
    assert.ok(section('## 📁', '## 💻').includes(path.basename(file)), file);
  }
});

test('YAMLのコメント・固定値・キー順・ブロック形式', () => {
  const yaml = readme.match(/^<!--\s*\n---\n([\s\S]*?)\n---\n-->/);
  assert.ok(yaml);
  const keys = [...yaml[1].matchAll(/^(\w+):/gm)].map(match => match[1]);
  assert.deepEqual(keys, ['id', 'slug', 'title', 'subtitle_ja', 'subtitle_en', 'description_ja', 'description_en',
    'category_ja', 'category_en', 'difficulty', 'tags', 'repo_url', 'demo_url', 'hub']);
  for (const key of ['category_ja', 'category_en', 'tags']) assert.match(yaml[1], new RegExp('^' + key + ':\\n  - ', 'm'));
  const expected = {
    id: 'day012', slug: 'uesugi-cipher', title: '"Uesugi Cipher Tool"',
    repo_url: '"https://github.com/ipusiron/uesugi-cipher"', demo_url: '"https://ipusiron.github.io/uesugi-cipher/"', hub: 'true'
  };
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(yaml[1].match(new RegExp('^' + key + ': (.+)$', 'm'))[1], value);
  }
});
