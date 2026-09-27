const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('docs/index.html');

test('CSP・meta・外部リソースなし・古典スクリプト順序', () => {
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1"/);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.match(html, /name="description" content="[^"]+"/);
  assert.match(html, /<noscript>[^<]+<\/noscript>/);
  assert.match(html, /rel="icon" href="favicon.svg"/);
  const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)[1];
  assert.doesNotMatch(csp, /frame-ancestors|unsafe-inline|unsafe-eval/);
  for (const rule of ["default-src 'self'", "script-src 'self'", "style-src 'self'", "img-src 'self' data:",
    "font-src 'self'", "connect-src 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"]) assert.ok(csp.includes(rule));
  assert.doesNotMatch(html, /\son\w+\s*=|\sstyle\s*=|<style\b|type=["']module/i);
  const scripts = [...html.matchAll(/<script\b([^>]+)>/g)].map(match => match[1]);
  assert.deepEqual(scripts, [' src="js/i18n.js" defer', ' src="js/uesugi-logic.js" defer',
    ' src="js/script.js" defer']);
  assert.doesNotMatch(html, /<(?:script|link|img)\b[^>]*(?:src|href)=["']https?:\/\//i);
  assert.doesNotMatch(read('docs/css/style.css'), /@import|https?:\/\//i);
});

test('主要ID・fieldset・読み上げ・見出し・外部リンク', () => {
  for (const id of ['inputText', 'runBtn', 'swapBtn', 'copyBtn', 'matrix', 'outputText', 'resultMessage',
    'colKey', 'rowKey', 'keyExampleBtn', 'keyRandomBtn', 'themeToggle', 'langToggle']) assert.match(html, new RegExp('id="' + id + '"'));
  const fieldsets = [...html.matchAll(/<fieldset\b[^>]*>([\s\S]*?)<\/fieldset>/g)];
  assert.equal(fieldsets.length, 3);
  for (const [index, name] of ['mode', 'numeral', 'keyMode'].entries()) {
    assert.match(fieldsets[index][1], /<legend[^>]*>[^<]+<\/legend>/);
    assert.ok(fieldsets[index][1].includes('name="' + name + '"'));
  }
  for (const id of ['resultMessage', 'outputText']) {
    assert.match(html, new RegExp('<[^>]+id="' + id + '"[^>]+aria-live="polite"'));
  }
  assert.match(html, /for="inputText"/);
  for (const id of ['colKey', 'rowKey']) assert.match(html, new RegExp('aria-describedby="' + id + 'Message"'));
  assert.match(html, /id="themeToggle"[^>]+aria-label="[^"]+"[^>]+aria-pressed="false"/);
  for (const [tag] of html.matchAll(/<a\b[^>]*href="https?:[^>]+>/g)) assert.match(tag, /rel="noopener noreferrer"/);
  const headings = [...html.matchAll(/<h([1-6])\b/g)].map(match => Number(match[1]));
  assert.equal(headings[0], 1);
  assert.ok(headings.includes(2));
  for (let i = 1; i < headings.length; i++) assert.ok(headings[i] <= headings[i - 1] + 1);
});

test('ロジックとUIの安全な描画・依存分離', () => {
  const logic = read('docs/js/uesugi-logic.js');
  const script = read('docs/js/script.js');
  const i18n = read('docs/js/i18n.js');
  for (const source of [logic, script, i18n]) assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML|document\.write|console\.log|Math\.random/);
  assert.doesNotMatch(logic, /\bdocument\b|\bwindow\b|\bcrypto\b/);
  assert.match(script, /crypto\.getRandomValues/);
  assert.match(script, /256 - 256 % n/);
  assert.match(script, /navigator\.clipboard\?\.writeText/);
  assert.doesNotMatch(script, /\.style\./);
  const pkg = JSON.parse(read('package.json'));
  assert.deepEqual(pkg, { name: 'uesugi-cipher', private: true, scripts: { test: 'node --test' } });
  const workflow = read('.github/workflows/test.yml');
  assert.match(workflow, /push, pull_request/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /node-version: 22/);
  assert.match(workflow, /run: npm test/);
});
