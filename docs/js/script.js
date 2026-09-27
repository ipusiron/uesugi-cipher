'use strict';
const logic = globalThis.UesugiLogic;
const t = (key, values) => I18n.t(key, values);
const byId = id => document.getElementById(id);
const selected = name => document.querySelector('input[name="' + name + '"]:checked').value;
// 使用された文字を追跡するSet
let usedCharacters = new Set();
let activeKeys = { colKey: logic.STANDARD_KEY, rowKey: logic.STANDARD_KEY };
// 表示中の通知と鍵の指摘は文字列ではなく「キー＋差し込み値」で覚える。
// 言語を切り替えたときに、出ているメッセージを訳し直すため。
let currentMessage = null;
let keyMessages = { colKey: null, rowKey: null };
let copyTimer;

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

// 差し込み値を文字列にする。配列は区切り記号で連結し、{ key } は辞書から引く。
function renderValue(value) {
  if (Array.isArray(value)) return value.map(renderValue).join(t('list.separator'));
  if (value && typeof value === 'object') return t(value.key, value.values);
  return String(value);
}

function renderPart(part) {
  const values = {};
  for (const [name, value] of Object.entries(part.values || {})) values[name] = renderValue(value);
  return t(part.key, values);
}

function showMatrix() {
  const useKanji = selected('numeral') === 'kanji';
  const kanjiNum = ['一', '二', '三', '四', '五', '六', '七'];
  const grid = logic.buildGrid();
  const kana = logic.keyKind(activeKeys.colKey) === 'kana';
  const label = char => !kana && useKanji ? kanjiNum[Number(char) - 1] : char;
  const table = node('table');
  table.append(node('caption', t('matrix.caption')));
  const head = node('thead');
  const header = node('tr');
  // 列番号：右上スタートなので左から右へ7,6,5,4,3,2,1の順で表示
  for (let c = 0; c < 7; c++) {
    const th = node('th', label(activeKeys.colKey[6 - c]), 'coord-cell');
    th.scope = 'col';
    header.append(th);
  }
  const corner = node('th');
  corner.append(node('span', t('matrix.rowKeyHeader'), 'visually-hidden'));
  header.append(corner);
  head.append(header);
  table.append(head);
  const body = node('tbody');
  for (let r = 0; r < 7; r++) {
    const tr = node('tr');
    // いろは文字は元の配置順序のまま（左から右：c=0から6）
    for (let c = 0; c < 7; c++) {
      const char = grid[r][c];
      const td = node('td', char, usedCharacters.has(char) ? 'char-cell used' : 'char-cell');
      if (!char) td.append(node('span', t('matrix.emptyCell'), 'visually-hidden'));
      tr.append(td);
    }
    // 行番号を右側のみに配置
    const th = node('th', label(activeKeys.rowKey[r]), 'coord-cell');
    th.scope = 'row';
    tr.append(th);
    body.append(tr);
  }
  table.append(body);
  byId('matrix').replaceChildren(table);
}

function renderMessage() {
  const area = byId('resultMessage');
  if (!currentMessage) {
    area.textContent = '';
    area.className = 'result-message';
    return;
  }
  area.textContent = currentMessage.parts.map(renderPart).join('\n');
  area.className = 'result-message show' + (currentMessage.type ? ' ' + currentMessage.type : '');
}

function notify(parts, type = '') {
  currentMessage = { parts: Array.isArray(parts) ? parts : [parts], type };
  renderMessage();
}

// コピー済みかどうかは dataset に持ち、文言は毎回 t() から組み立てる。
function setCopyButton(state) {
  const button = byId('copyBtn');
  button.dataset.state = state;
  button.textContent = t(state === 'copied' ? 'button.copied' : 'button.copy');
  button.classList.toggle('success', state === 'copied');
}

function renderKeyMessages() {
  for (const id of ['colKey', 'rowKey']) {
    const part = keyMessages[id];
    const element = byId(id + 'Message');
    element.textContent = part ? renderPart(part) : '';
    element.className = 'key-message' + (part && part.error ? ' error' : '');
  }
}

function clearResult() {
  usedCharacters.clear();
  clearTimeout(copyTimer);
  setCopyButton('idle');
  currentMessage = null;
  renderMessage();
  byId('outputText').textContent = '';
  byId('copyBtn').disabled = true;
  byId('swapBtn').disabled = true;
  showMatrix();
}

function validateKeys() {
  const mode = selected('keyMode');
  byId('keyFields').hidden = mode === 'standard';
  byId('keyRandomBtn').hidden = mode !== 'numeric';
  byId('kanaExampleHint').hidden = mode !== 'kana';
  byId('notationGroup').disabled = mode === 'kana';
  byId('notationHint').hidden = mode !== 'kana';
  keyMessages = { colKey: null, rowKey: null };
  if (mode === 'standard') {
    activeKeys = { colKey: logic.STANDARD_KEY, rowKey: logic.STANDARD_KEY };
    renderKeyMessages();
    return true;
  }
  const keys = {};
  let valid = true;
  for (const id of ['colKey', 'rowKey']) {
    const field = byId(id);
    const key = logic.normalizeKey(field.value);
    keys[id] = key;
    const error = logic.validateKey(key);
    let message = null;
    if (error === 'length') {
      message = { key: 'key.errLength', values: { count: Array.from(key).length } };
    }
    if (error === 'duplicate') {
      const chars = Array.from(key);
      const repeated = [...new Set(chars.filter((ch, index) => chars.indexOf(ch) !== index))];
      message = { key: 'key.errDuplicate', values: { chars: repeated } };
    }
    if (error === 'charset') message = { key: 'key.errCharset' };
    if (!error && logic.keyKind(key) !== mode) message = { key: 'key.errKind' };
    if (!message && key !== field.value) message = { key: 'key.normalized', values: { key } };
    const invalid = Boolean(error || (logic.keyKind(key) !== mode));
    field.setAttribute('aria-invalid', String(invalid));
    if (message) message.error = invalid;
    keyMessages[id] = message;
    if (invalid) valid = false;
  }
  if (!logic.validateKey(keys.colKey) && !logic.validateKey(keys.rowKey)
      && logic.keyKind(keys.colKey) !== logic.keyKind(keys.rowKey)) {
    for (const id of ['colKey', 'rowKey']) {
      byId(id).setAttribute('aria-invalid', 'true');
      keyMessages[id] = { key: 'key.errMixed', error: true };
    }
    valid = false;
  }
  renderKeyMessages();
  if (valid) activeKeys = keys;
  return valid;
}

function runCipher() {
  // 使用文字をリセット
  clearResult();
  const validKeys = validateKeys();
  showMatrix();
  if (!validKeys) {
    notify({ key: 'msg.keyInvalid' }, 'error');
    return;
  }
  const mode = selected('mode');
  const input = byId('inputText').value;
  const error = logic.validateInput(input);
  if (error) {
    notify(error === 'empty' ? { key: 'msg.inputEmpty' } : {
      key: 'msg.inputTooLong',
      values: { max: logic.MAX_INPUT.toLocaleString('en-US'), count: Array.from(input).length }
    }, 'warning');
    return;
  }
  const options = { ...activeKeys, notation: selected('numeral') };
  const result = mode === 'encrypt' ? logic.encrypt(input, options) : logic.decrypt(input, activeKeys);
  const warnings = [];
  // 文字変換があった場合の通知
  if (mode === 'encrypt') {
    const conversions = logic.summarizeConversions(result.conversions)
      .map(item => ({ key: item.count > 1 ? 'conv.itemRepeat' : 'conv.item', values: item }));
    if (conversions.length) warnings.push({ key: 'msg.conversions', values: { list: conversions } });
    if (result.removedSpaces) {
      warnings.push({ key: 'msg.removedSpaces', values: { count: result.removedSpaces } });
    }
    if (result.unknown.length) warnings.push({ key: 'msg.unknown', values: { list: result.unknown } });
  } else {
    for (const reason of ['range', 'empty', 'passthrough']) {
      const tokens = [...new Set(result.issues.filter(issue => issue.reason === reason)
        .map(issue => issue.token))];
      if (!tokens.length) continue;
      warnings.push({ key: 'msg.issue', values: { reason: { key: 'issue.' + reason }, list: tokens } });
    }
  }
  // 結果表示
  usedCharacters = new Set(result.used);
  notify(warnings.length ? warnings : { key: 'msg.done' }, warnings.length ? 'warning' : '');
  byId('outputText').textContent = result.text;
  byId('copyBtn').disabled = !result.text;
  byId('swapBtn').disabled = !result.text;
  showMatrix();
}

async function copyResult() {
  const outputElement = byId('outputText');
  const text = outputElement.textContent;
  if (!text) return;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    setCopyButton('copied');
    notify({ key: 'msg.copied' });
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => setCopyButton('idle'), 2000);
  } catch {
    notify({ key: 'msg.copyFailed' }, 'warning');
    outputElement.focus();
  }
}

function updatePlaceholder() {
  byId('inputText').placeholder = t(selected('mode') === 'encrypt'
    ? 'input.placeholderEncrypt' : 'input.placeholderDecrypt');
}

function updateSettings() {
  const valid = validateKeys();
  clearResult();
  if (valid && byId('inputText').value.trim()) runCipher();
}

function secureRandomInt(n) {
  const bytes = new Uint8Array(1);
  const limit = 256 - 256 % n;
  do { crypto.getRandomValues(bytes); } while (bytes[0] >= limit);
  return bytes[0] % n;
}

// テーマのラベルは状態から組み立てる。data-i18n-aria-label を付けると切り替えで巻き戻る。
function setThemeLabel() {
  const dark = document.documentElement.dataset.theme === 'dark';
  const button = byId('themeToggle');
  button.textContent = dark ? '☀️' : '🌙';
  button.setAttribute('aria-pressed', String(dark));
  button.setAttribute('aria-label', t(dark ? 'theme.toLight' : 'theme.toDark'));
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  setThemeLabel();
}

// 言語を変えたときは、状態を保ったまま文言だけ訳し直す。作り直しや再解析はしない。
function retranslate() {
  updatePlaceholder();
  setThemeLabel();
  setCopyButton(byId('copyBtn').dataset.state || 'idle');
  renderKeyMessages();
  renderMessage();
  showMatrix();
}

I18n.init();
let savedTheme;
try { savedTheme = localStorage.getItem('theme'); } catch { /* 保存不可でも処理を続ける。 */ }
const systemTheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
setTheme(['light', 'dark'].includes(savedTheme) ? savedTheme : systemTheme);
setCopyButton('idle');
byId('langToggle').addEventListener('click',
  () => I18n.setLanguage(I18n.language === 'ja' ? 'en' : 'ja'));
document.addEventListener('languagechange', retranslate);
byId('themeToggle').addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(theme);
  try { localStorage.setItem('theme', theme); } catch { /* 保存できなくても切り替える。 */ }
});
byId('runBtn').addEventListener('click', runCipher);
byId('copyBtn').addEventListener('click', copyResult);
byId('swapBtn').addEventListener('click', () => {
  byId('inputText').value = byId('outputText').textContent;
  const mode = selected('mode') === 'encrypt' ? 'decrypt' : 'encrypt';
  document.querySelector('input[name="mode"][value="' + mode + '"]').checked = true;
  updatePlaceholder();
  runCipher();
});
byId('keyExampleBtn').addEventListener('click', () => {
  const kana = selected('keyMode') === 'kana';
  // 鍵の例はこのツールが扱うデータなので、言語を変えても同じものを入れる。
  byId('colKey').value = kana ? 'みかさのやまに' : '3147526';
  byId('rowKey').value = kana ? 'いでしつきかも' : '2615374';
  updateSettings();
});
byId('keyRandomBtn').addEventListener('click', () => {
  try {
    byId('colKey').value = logic.shuffleKey(secureRandomInt);
    byId('rowKey').value = logic.shuffleKey(secureRandomInt);
    updateSettings();
  } catch {
    notify({ key: 'msg.noRandom' }, 'error');
  }
});
for (const id of ['colKey', 'rowKey']) byId(id).addEventListener('input', updateSettings);
// ラジオボタンの変更を監視
document.addEventListener('change', event => {
  if (event.target.name === 'mode') {
    clearResult();
    updatePlaceholder();
  } else if (['numeral', 'keyMode'].includes(event.target.name)) {
    updateSettings();
  }
});
updatePlaceholder();
validateKeys();
showMatrix(); // 初回表示
