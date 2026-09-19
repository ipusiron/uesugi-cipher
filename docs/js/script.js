'use strict';
const logic = globalThis.UesugiLogic;
const byId = id => document.getElementById(id);
const selected = name => document.querySelector('input[name="' + name + '"]:checked').value;
// 使用された文字を追跡するSet
let usedCharacters = new Set();
let activeKeys = { colKey: logic.STANDARD_KEY, rowKey: logic.STANDARD_KEY };
let copyTimer;

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function showMatrix() {
  const useKanji = selected('numeral') === 'kanji';
  const kanjiNum = ['一', '二', '三', '四', '五', '六', '七'];
  const grid = logic.buildGrid();
  const kana = logic.keyKind(activeKeys.colKey) === 'kana';
  const label = char => !kana && useKanji ? kanjiNum[Number(char) - 1] : char;
  const table = node('table');
  table.append(node('caption', '字変四十八表（いろは順）'));
  const head = node('thead');
  const header = node('tr');
  // 列番号：右上スタートなので左から右へ7,6,5,4,3,2,1の順で表示
  for (let c = 0; c < 7; c++) {
    const th = node('th', label(activeKeys.colKey[6 - c]), 'coord-cell');
    th.scope = 'col';
    header.append(th);
  }
  const corner = node('th');
  corner.append(node('span', '行の鍵', 'visually-hidden'));
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
      if (!char) td.append(node('span', '空き', 'visually-hidden'));
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

function notify(message, type = '') {
  const area = byId('resultMessage');
  area.textContent = message;
  area.className = 'result-message show' + (type ? ' ' + type : '');
}

function clearResult() {
  usedCharacters.clear();
  clearTimeout(copyTimer);
  byId('copyBtn').textContent = '📋 コピー';
  byId('copyBtn').classList.remove('success');
  byId('resultMessage').textContent = '';
  byId('resultMessage').className = 'result-message';
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
  if (mode === 'standard') {
    activeKeys = { colKey: logic.STANDARD_KEY, rowKey: logic.STANDARD_KEY };
    return true;
  }
  const keys = {};
  let valid = true;
  for (const id of ['colKey', 'rowKey']) {
    const field = byId(id);
    const key = logic.normalizeKey(field.value);
    keys[id] = key;
    const error = logic.validateKey(key);
    let message = '';
    if (error === 'length') message = '7文字にしてください（いま' + Array.from(key).length + '文字）';
    if (error === 'duplicate') {
      const chars = Array.from(key);
      const repeated = [...new Set(chars.filter((ch, index) => chars.indexOf(ch) !== index))].join('、');
      message = '同じ文字が重なっています（重なり: ' + repeated + '）。重なりがあると復号が一意に決まりません';
    }
    if (error === 'charset') message = '1〜7の数字だけ、または、いろは48文字のかなだけで入力してください';
    if (!error && logic.keyKind(key) !== mode) message = '選んだ鍵の種類に合う文字を入力してください';
    if (!message && key !== field.value) message = '清音・ひらがななどに正規化して使用します: ' + key;
    const invalid = Boolean(error || (logic.keyKind(key) !== mode));
    field.setAttribute('aria-invalid', String(invalid));
    byId(id + 'Message').textContent = message;
    byId(id + 'Message').className = 'key-message' + (invalid ? ' error' : '');
    if (invalid) valid = false;
  }
  if (!logic.validateKey(keys.colKey) && !logic.validateKey(keys.rowKey)
      && logic.keyKind(keys.colKey) !== logic.keyKind(keys.rowKey)) {
    for (const id of ['colKey', 'rowKey']) {
      byId(id).setAttribute('aria-invalid', 'true');
      byId(id + 'Message').textContent = '列と行は同じ種類の鍵にしてください';
      byId(id + 'Message').className = 'key-message error';
    }
    valid = false;
  }
  if (valid) activeKeys = keys;
  return valid;
}

function runCipher() {
  // 使用文字をリセット
  clearResult();
  const validKeys = validateKeys();
  showMatrix();
  if (!validKeys) {
    notify('鍵を確認してください。欄の下に修正点を表示しています。', 'error');
    return;
  }
  const mode = selected('mode');
  const input = byId('inputText').value;
  const error = logic.validateInput(input);
  if (error) {
    notify(error === 'empty' ? '⚠️ 入力が空です。テキストを入力してください。'
      : '入力は10,000文字までです（いま' + Array.from(input).length + '文字）', 'warning');
    return;
  }
  const options = { ...activeKeys, notation: selected('numeral') };
  const result = mode === 'encrypt' ? logic.encrypt(input, options) : logic.decrypt(input, activeKeys);
  const warnings = [];
  // 文字変換があった場合の通知
  if (mode === 'encrypt') {
    const conversions = logic.summarizeConversions(result.conversions).map(item =>
      '「' + item.from + '」→「' + item.to + '」' + (item.count > 1 ? '×' + item.count : ''));
    if (conversions.length) warnings.push('🔄 文字変換: ' + conversions.join('、'));
    if (result.removedSpaces) warnings.push('省いた空白: ' + result.removedSpaces + '個');
    if (result.unknown.length) warnings.push('暗号化できないため、そのまま出力: ' + result.unknown.join('、'));
  } else {
    const reasons = {
      range: '1〜7の範囲外', empty: '空きマス（列7・行7）',
      passthrough: '座標として読めなかったので、そのまま出力'
    };
    for (const [reason, message] of Object.entries(reasons)) {
      const tokens = [...new Set(result.issues.filter(issue => issue.reason === reason).map(issue => issue.token))];
      if (tokens.length) warnings.push(message + ': ' + tokens.join('、'));
    }
  }
  // 結果表示
  usedCharacters = new Set(result.used);
  notify(warnings.length ? warnings.join('\n') : '✅ 処理が完了しました', warnings.length ? 'warning' : '');
  byId('outputText').textContent = result.text;
  byId('copyBtn').disabled = !result.text;
  byId('swapBtn').disabled = !result.text;
  showMatrix();
}

async function copyResult() {
  const outputElement = byId('outputText');
  const copyBtn = byId('copyBtn');
  const text = outputElement.textContent;
  if (!text) return;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = '✅ コピー完了';
    copyBtn.classList.add('success');
    notify('コピーしました');
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copyBtn.textContent = '📋 コピー';
      copyBtn.classList.remove('success');
    }, 2000);
  } catch {
    notify('コピーできませんでした。結果を選択してコピーしてください', 'warning');
    outputElement.focus();
  }
}

function updatePlaceholder() {
  byId('inputText').placeholder = selected('mode') === 'encrypt'
    ? '例: てきみゆ（濁点・カタカナは清音のひらがなに自動変換します）'
    : '例: 5-7 6-3 6-6 6-4　または　五七　六三　六六　六四';
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

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark';
  byId('themeToggle').textContent = dark ? '☀️' : '🌙';
  byId('themeToggle').setAttribute('aria-pressed', String(dark));
  byId('themeToggle').setAttribute('aria-label', dark ? 'ライトモードに切り替え' : 'ダークモードに切り替え');
}

let savedTheme;
try { savedTheme = localStorage.getItem('theme'); } catch { /* 保存不可でも処理を続ける。 */ }
const systemTheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
setTheme(['light', 'dark'].includes(savedTheme) ? savedTheme : systemTheme);
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
    notify('この環境では乱数を生成できません。鍵を入力してください。', 'error');
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
