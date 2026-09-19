const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../docs/js/uesugi-logic.js');
const K1 = { colKey: '3147526', rowKey: '2615374' };
const K2 = { colKey: 'みかさのやまに', rowKey: 'いてしつきかも' };

test('数字鍵の既知解答・別鍵復号', () => {
  for (const [plain, arabic, kanji] of [
    ['てきみゆ', '5-4 2-1 2-7 2-5', '五四　二一　二七　二五'],
    ['ひみつのてがみ', '6-6 2-7 4-3 7-3 5-4 1-4 2-7', '六六　二七　四三　七三　五四　一四　二七']
  ]) {
    assert.equal(L.encrypt(plain, K1).text, arabic);
    assert.equal(L.encrypt(plain, { ...K1, notation: 'kanji' }).text, kanji);
  }
  assert.equal(L.decrypt('5-7 6-3 6-6 6-4', K1).text, 'えすひ?');
  assert.deepEqual(L.decrypt('5-7 6-3 6-6 6-4', K1).issues, [{ token: '6-4', reason: 'empty' }]);
});

test('かな鍵の既知解答と48文字の往復', () => {
  for (const [plain, cipher] of [
    ['てきみゆ', 'やも　まし　まか　まつ'],
    ['ひみつのてがみ', 'にて　まか　さき　のき　やも　かも　まか'], ['いろは', 'みい　みて　みし']
  ]) assert.equal(L.encrypt(plain, K2).text, cipher);
  assert.equal(L.decrypt('やもましまかまつ', K2).text, 'てきみゆ');
  for (const keys of [K1, K2]) for (const ch of L.IROHA) for (const notation of ['arabic', 'kanji']) {
    assert.equal(L.decrypt(L.encrypt(ch, { ...keys, notation }).text, keys).text, ch);
  }
  assert.equal(L.decrypt('み', K2).issues[0].reason, 'passthrough');
});

test('鍵の正規化・検証順・混在の拒否', () => {
  for (const key of ['３１４７５２６', '三一四七五二六', '3147 526']) assert.equal(L.normalizeKey(key), '3147526');
  assert.equal(L.normalizeKey('みかさのやまに'), 'みかさのやまに');
  assert.equal(L.normalizeKey('いでしつきかも'), 'いてしつきかも');
  for (const [key, expected] of [
    ['3147526', null], ['1234566', 'duplicate'], ['123456', 'length'], ['1234568', 'charset'],
    ['みかさのやま', 'length'], ['みかさのやまA', 'charset']
  ]) assert.equal(L.validateKey(key), expected);
  for (const key of ['つゆにぬれつつ', 'あまのかぐやま', 'あかつきばかり']) {
    assert.equal(L.validateKey(L.normalizeKey(key)), 'duplicate');
  }
  for (const key of ['ころもほすてふ', 'ふじのたかねに']) assert.equal(L.validateKey(L.normalizeKey(key)), null);
  assert.equal(L.keyKind('1234567'), 'numeric');
  assert.equal(L.keyKind(K2.colKey), 'kana');
  for (const fn of [L.encrypt, L.decrypt]) {
    assert.throws(() => fn('てきみゆ', { colKey: '3147526', rowKey: K2.rowKey }), RangeError);
    assert.throws(() => fn('てきみゆ', { colKey: '1234566' }), RangeError);
  }
});

test('Fisher–Yatesの固定例と1000回の並べ替え', () => {
  assert.equal(L.shuffleKey(() => 0), '2345671');
  assert.equal(L.shuffleKey(n => n - 1), '1234567');
  const sequence = [3, 0, 2, 1, 1, 0];
  assert.equal(L.shuffleKey(() => sequence.shift()), '5672314');
  let seed = 123;
  const randomInt = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
  for (let i = 0; i < 1000; i++) assert.equal(Array.from(L.shuffleKey(randomInt)).sort().join(''), '1234567');
});
