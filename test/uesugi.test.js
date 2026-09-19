const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../docs/js/uesugi-logic.js');

const examples = [
  ['てきみゆ', '5-7 6-3 6-6 6-4'],
  ['ひみつのてがみ', '7-2 6-6 3-5 4-5 5-7 2-7 6-6'],
  ['ありがとう', '6-1 2-2 2-7 1-7 4-3'],
  ['がんばって', '2-7 7-6 1-3 3-5 5-7'],
  ['ぷるぷる', '5-4 2-4 5-4 2-4'],
  ['ここ', '5-5 5-5'],
  ['こんにちは', '5-5 7-6 1-4 2-1 1-3'],
  ['いろはにほへと', '1-1 1-2 1-3 1-4 1-5 1-6 1-7'],
  ['ん', '7-6'], ['ゐゑ', '4-4 7-1'], ['じかん', '6-7 2-7 7-6'],
  ['テキミユ', '5-7 6-3 6-6 6-4'], ['ｶﾞﾝﾊﾞｯﾃ', '2-7 7-6 1-3 3-5 5-7'],
  ['ヴァイオリン', '4-3 6-1 1-1 4-6 2-2 7-6'], ['らーめん', '4-1 6-5 7-6'],
  ['しゅっぱつ', '6-7 6-4 3-5 1-3 3-5'],
  ['ひみつ のてがみ\nてきみゆ', '7-2 6-6 3-5 4-5 5-7 2-7 6-6\n5-7 6-3 6-6 6-4'],
  ['あAい😀ー', '6-1 A 1-1 😀'], ['', ''], ['   ', '']
];
for (const [plain, cipher] of examples) {
  test(`標準暗号化: ${JSON.stringify(plain)}`, () => assert.equal(L.encrypt(plain).text, cipher));
}

test('漢数字の既知解答', () => {
  for (const [plain, expected] of [
    ['てきみゆ', '五七　六三　六六　六四'],
    ['ひみつのてがみ', '七二　六六　三五　四五　五七　二七　六六'],
    ['おこのみやき', '四六　五五　四五　六六　五一　六三']
  ]) assert.equal(L.encrypt(plain, { notation: 'kanji' }).text, expected);
});

test('変換の順番・回数・空白・未知文字', () => {
  const pairs = values => values.map(([from, to]) => ({ from, to }));
  assert.deepEqual(L.encrypt('ひみつのてがみ').conversions, pairs([['が', 'か']]));
  assert.deepEqual(L.encrypt('がんばって').conversions, pairs([['が', 'か'], ['ば', 'は'], ['っ', 'つ']]));
  assert.deepEqual(L.encrypt('ｶﾞﾝﾊﾞｯﾃ').conversions,
    pairs([['ガ', 'か'], ['ン', 'ん'], ['バ', 'は'], ['ッ', 'つ'], ['テ', 'て']]));
  assert.equal(L.encrypt('テキミユ').conversions.length, 4);
  assert.deepEqual(L.encrypt('らーめん').conversions, pairs([['ー', '']]));
  const repeated = L.encrypt('ぷるぷる').conversions;
  assert.equal(repeated.length, 2);
  assert.deepEqual(L.summarizeConversions(repeated), [{ from: 'ぷ', to: 'ふ', count: 2 }]);
  assert.equal(L.encrypt('ひみつ のてがみ\nてきみゆ').removedSpaces, 1);
  assert.equal(L.encrypt('   ').removedSpaces, 3);
  assert.deepEqual(L.encrypt('あAい😀ー').unknown, ['A', '😀']);
  assert.deepEqual(L.encrypt('ひみつのてがみ').used, ['ひ', 'み', 'つ', 'の', 'て', 'か']);
  assert.deepEqual(L.normalizePlain('か\u3099\r\n\tＡ　ゔゎゕゖ'), {
    text: 'か\nAうわかけ', removedSpaces: 2,
    conversions: pairs([['が', 'か'], ['ゔ', 'う'], ['ゎ', 'わ'], ['ゕ', 'か'], ['ゖ', 'け']])
  });
});

test('両表記・全角・ハイフン・混在・区切りなしの復号', () => {
  for (const input of ['5-7 6-3 6-6 6-4', '五七　六三　六六　六四', '五七六三六六六四']) {
    assert.equal(L.decrypt(input).text, 'てきみゆ');
    assert.deepEqual(L.decrypt(input).issues, []);
  }
  for (const input of ['５－７　６－３', '5ー7 6ー3']) assert.equal(L.decrypt(input).text, 'てき');
  for (const hyphen of ['‐', '‑', '‒', '–', '−', 'ー']) assert.equal(L.decrypt(`5${hyphen}7`).text, 'て');
  assert.equal(L.decrypt('5-7 五七').text, 'てて');
  assert.deepEqual(L.decrypt('5-7 五七').issues, []);
});

test('範囲外・空きマス・passthrough・改行の復号', () => {
  for (const token of ['7-7', '七七', '9-1', '1-9', '1-0']) {
    const result = L.decrypt(token);
    assert.equal(result.text, '?');
    assert.deepEqual(result.issues, [{ token, reason: ['7-7', '七七'].includes(token) ? 'empty' : 'range' }]);
  }
  assert.equal(L.decrypt('5-7 1-9 6-3').text, 'て?き');
  for (const token of ['五七六', '5-77']) {
    assert.deepEqual(L.decrypt(token), { text: token, used: [], issues: [{ token, reason: 'passthrough' }] });
  }
  const mixed = L.decrypt('6-1 A 1-1 😀');
  assert.equal(mixed.text, 'あAい😀');
  assert.deepEqual(mixed.issues, [{ token: 'A', reason: 'passthrough' }, { token: '😀', reason: 'passthrough' }]);
  assert.equal(L.decrypt('7-2 6-6 3-5 4-5 5-7 2-7 6-6\n5-7 6-3 6-6 6-4').text, 'ひみつのてかみ\nてきみゆ');
});

test('48文字の往復・座標の一意性・空きマス', () => {
  assert.equal(Array.from(L.IROHA).length, 48);
  const positions = new Set();
  for (const char of L.IROHA) {
    const { col, row } = L.positionOf(char);
    positions.add(`${col}-${row}`);
    assert.equal(L.charAt(col, row), char);
    assert.equal(L.buildGrid()[row - 1][7 - col], char);
    for (const notation of ['arabic', 'kanji']) assert.equal(L.decrypt(L.encrypt(char, { notation }).text).text, char);
  }
  assert.equal(positions.size, 48);
  const empty = [];
  for (let col = 1; col <= 7; col++) for (let row = 1; row <= 7; row++) {
    if (!positions.has(`${col}-${row}`)) empty.push(`${col}-${row}`);
  }
  assert.deepEqual(empty, ['7-7']);
  assert.equal(L.charAt(0, 1), null);
  assert.equal(L.positionOf('😀'), null);
});

test('入力上限・コードポイント・不正な復号入力は例外なし', () => {
  assert.equal(L.MAX_INPUT, 10000);
  for (const input of ['', ' \n\t　']) assert.equal(L.validateInput(input), 'empty');
  for (const input of ['あ', '😀'.repeat(10000)]) assert.equal(L.validateInput(input), null);
  assert.equal(L.validateInput('😀'.repeat(10001)), 'too-long');
  for (const input of ['0-0', '8-8', '9-9', '1-', '-1', '--', '一', '七七七', '😀', '1-9あ '.repeat(2000)]) {
    assert.doesNotThrow(() => L.decrypt(input));
  }
});
