const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const files = ['docs/index.html', 'docs/css/style.css', 'docs/js/script.js', 'docs/js/uesugi-logic.js',
  'docs/js/i18n.js',
  ...fs.readdirSync(__dirname).filter(name => name.endsWith('.js')).map(name => 'test/' + name)];
test('行長はJS・CSS・テスト160字、HTML250字以下', () => {
  for (const file of files) {
    const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/);
    const limit = file.endsWith('.html') ? 250 : 160;
    lines.forEach((line, i) => assert.ok(Array.from(line).length <= limit, `${file}:${i + 1}: ${Array.from(line).length}`));
  }
});
test('主要ファイルがminifyされていない', () => {
  for (const [file, minimum] of [['docs/css/style.css', 250], ['docs/js/script.js', 150],
    ['docs/js/uesugi-logic.js', 120], ['docs/js/i18n.js', 180]]) {
    assert.ok(fs.readFileSync(path.join(root, file), 'utf8').split('\n').length >= minimum, file);
  }
});
