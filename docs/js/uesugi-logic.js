'use strict';

const IROHA = 'いろはにほへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせすん';
const STANDARD_KEY = '1234567';
const MAX_INPUT = 10000;
const KANJI = '一二三四五六七';

// 文字変換辞書（濁点・半濁点・促音を清音に変換）
const charConversionMap = {
  // 濁点
  'が': 'か', 'ぎ': 'き', 'ぐ': 'く', 'げ': 'け', 'ご': 'こ',
  'ざ': 'さ', 'じ': 'し', 'ず': 'す', 'ぜ': 'せ', 'ぞ': 'そ',
  'だ': 'た', 'ぢ': 'ち', 'づ': 'つ', 'で': 'て', 'ど': 'と',
  'ば': 'は', 'び': 'ひ', 'ぶ': 'ふ', 'べ': 'へ', 'ぼ': 'ほ',
  // 半濁点
  'ぱ': 'は', 'ぴ': 'ひ', 'ぷ': 'ふ', 'ぺ': 'へ', 'ぽ': 'ほ',
  // 促音・長音
  'っ': 'つ',
  'ー': '',
  // 拗音（できるだけ近い音に変換）
  'ゃ': 'や', 'ゅ': 'ゆ', 'ょ': 'よ',
  'ぁ': 'あ', 'ぃ': 'い', 'ぅ': 'う', 'ぇ': 'え', 'ぉ': 'お',
  'ゔ': 'う', 'ゎ': 'わ', 'ゕ': 'か', 'ゖ': 'け'
};

// 文字変換処理（NFKC後の文字から変換履歴を記録）
function normalizePlain(text) {
  const conversions = [];
  let removedSpaces = 0;
  let result = '';
  const normalized = String(text ?? '').normalize('NFKC').replace(/\r\n?/g, '\n');
  for (const from of normalized) {
    if (from === '\n') {
      result += from;
      continue;
    }
    if (/\s/u.test(from)) {
      removedSpaces++;
      continue;
    }
    let to = from;
    const code = to.codePointAt(0);
    if (code >= 0x30a1 && code <= 0x30f6) to = String.fromCodePoint(code - 0x60);
    if (Object.hasOwn(charConversionMap, to)) to = charConversionMap[to];
    if (from !== to) conversions.push({ from, to });
    result += to;
  }
  return { text: result, conversions, removedSpaces };
}

// いろは歌のグリッド生成（grid[r][c]のc=6が右端）
function buildGrid() {
  const chars = Array.from(IROHA);
  const grid = Array.from({ length: 7 }, () => Array(7).fill(''));
  let index = 0;
  for (let c = 6; c >= 0; c--) { // 右から左の列
    for (let r = 0; r < 7; r++) { // 上から下の行
      if (index < chars.length) {
        grid[r][c] = chars[index++];
      }
    }
  }
  return grid;
}

// 公開座標は1始まりの列→行。空きマスは空文字、範囲外はnull。
function positionOf(char) {
  const index = Array.from(IROHA).indexOf(char);
  return index < 0 ? null : { col: Math.floor(index / 7) + 1, row: index % 7 + 1 };
}

function charAt(col, row) {
  if (!Number.isInteger(col) || !Number.isInteger(row) || col < 1 || col > 7 || row < 1 || row > 7) return null;
  return Array.from(IROHA)[(col - 1) * 7 + row - 1] || '';
}

function normalizeKey(text) {
  return normalizePlain(text).text.replace(/\n/g, '')
    .replace(/[一二三四五六七]/g, char => String(KANJI.indexOf(char) + 1));
}

function validateKey(key) {
  const chars = Array.from(String(key ?? ''));
  if (chars.length !== 7) return 'length';
  if (new Set(chars).size !== chars.length) return 'duplicate';
  if (!chars.every(char => STANDARD_KEY.includes(char)) && !chars.every(char => IROHA.includes(char))) return 'charset';
  return null;
}

function keyKind(key) {
  if (validateKey(key)) throw new RangeError('鍵が不正です');
  return /^[1-7]+$/.test(key) ? 'numeric' : 'kana';
}

function keysOf(options = {}) {
  const colKey = options.colKey ?? STANDARD_KEY;
  const rowKey = options.rowKey ?? STANDARD_KEY;
  const kind = keyKind(colKey);
  if (kind !== keyKind(rowKey)) throw new RangeError('列と行は同じ種類の鍵にしてください');
  return { colKey: Array.from(colKey), rowKey: Array.from(rowKey), kind };
}

function validateInput(text) {
  const value = String(text ?? '');
  if (!value.trim()) return 'empty';
  return Array.from(value).length > MAX_INPUT ? 'too-long' : null;
}

function encrypt(text, options = {}) {
  // 文字変換処理
  const normalized = normalizePlain(text);
  const { colKey, rowKey, kind } = keysOf(options);
  const useKanji = kind === 'numeric' && options.notation === 'kanji';
  const used = new Set();
  const unknown = new Set();
  const result = normalized.text.split('\n').map(line => {
    const tokens = [];
    for (const ch of line) {
      const position = positionOf(ch);
      if (position) {
        // 使用された文字を記録
        used.add(ch);
        let col = colKey[position.col - 1];
        let row = rowKey[position.row - 1];
        if (useKanji) {
          col = KANJI[Number(col) - 1];
          row = KANJI[Number(row) - 1];
        }
        tokens.push(kind === 'kana' || useKanji ? col + row : col + '-' + row);
      } else {
        unknown.add(ch);
        tokens.push(ch);
      }
    }
    return tokens.join(kind === 'kana' || useKanji ? '　' : ' ');
  });
  return { ...normalized, text: result.join('\n'), used: [...used], unknown: [...unknown] };
}

function decrypt(text, options = {}) {
  const { colKey, rowKey, kind } = keysOf(options);
  const used = new Set();
  const issues = [];
  const normalized = String(text ?? '').normalize('NFKC').replace(/\r\n?/g, '\n')
    .replace(/(\d)[\u2010\u2011\u2012\u2013\u2212\u30fc](?=\d)/g, '$1-');
  function decodePair(col, row, token) {
    // 範囲を検査してから表を参照する。
    const c = colKey.indexOf(col) + 1;
    const r = rowKey.indexOf(row) + 1;
    if (!c || !r) {
      issues.push({ token, reason: 'range' });
      return '?';
    }
    const char = charAt(c, r);
    if (!char) {
      issues.push({ token, reason: 'empty' });
      return '?';
    }
    used.add(char);
    return char;
  }
  const result = normalized.split('\n').map(line => {
    let output = '';
    for (const token of line.split(/\s+/u).filter(Boolean)) {
      const chars = Array.from(token);
      // アラビア数字パターン（列-行の順）
      if (kind === 'numeric' && /^\d-\d$/.test(token)) {
        output += decodePair(chars[0], chars[2], token);
      } else if (kind === 'numeric' && /^(?:[一二三四五六七]{2})+$/.test(token)) {
        for (let i = 0; i < chars.length; i += 2) {
          output += decodePair(String(KANJI.indexOf(chars[i]) + 1), String(KANJI.indexOf(chars[i + 1]) + 1), chars[i] + chars[i + 1]);
        }
      } else if (kind === 'kana' && chars.length % 2 === 0
          && chars.every((char, i) => (i % 2 ? rowKey : colKey).includes(char))) {
        for (let i = 0; i < chars.length; i += 2) output += decodePair(chars[i], chars[i + 1], chars[i] + chars[i + 1]);
      } else {
        output += token;
        issues.push({ token, reason: 'passthrough' });
      }
    }
    return output;
  });
  return { text: result.join('\n'), used: [...used], issues };
}

function summarizeConversions(conversions) {
  const summary = [];
  for (const { from, to } of conversions) {
    const entry = summary.find(item => item.from === from && item.to === to);
    if (entry) entry.count++;
    else summary.push({ from, to, count: 1 });
  }
  return summary;
}

function shuffleKey(randomInt) {
  const a = Array.from(STANDARD_KEY);
  for (let i = 6; i >= 1; i--) {
    const j = randomInt(i + 1);
    if (!Number.isInteger(j) || j < 0 || j > i) throw new RangeError('乱数が範囲外です');
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.join('');
}

const UesugiLogic = {
  IROHA, STANDARD_KEY, MAX_INPUT, positionOf, charAt, buildGrid, normalizePlain, normalizeKey,
  validateKey, keyKind, validateInput, encrypt, decrypt, summarizeConversions, shuffleKey
};
globalThis.UesugiLogic = UesugiLogic;
if (typeof module === 'object' && module.exports) module.exports = UesugiLogic;
