'use strict';
// 日本語と英語の文言。画面を描くスクリプトは言語ごとの文字列を持たない。
// このツールが扱う対象（いろは48文字・漢数字・かなの鍵）はデータなので訳さない。
const I18n = (() => {
  const ja = {
    'app.title': '字変四十八の上杉暗号ツール',
    'app.description':
      'いろは48文字の上杉暗号を、標準表・数字鍵・かな鍵で体験できる暗号化・復号ツールです。',
    'app.heading': '字変四十八の上杉暗号ツール',
    'app.langButton': 'English',
    'app.langAria': '言語を切り替える',

    'work.aria': '暗号の入力と結果',

    'input.label': '入力:',
    'input.hint': '空白は省き、改行は残します。入力は10,000文字までです。',
    'input.placeholderEncrypt': '例: てきみゆ（濁点・カタカナは清音のひらがなに自動変換します）',
    'input.placeholderDecrypt': '例: 5-7 6-3 6-6 6-4　または　五七　六三　六六　六四',

    'settings.heading': '設定',

    'mode.legend': 'モード切替',
    'mode.encrypt': '暗号化',
    'mode.decrypt': '復号',

    'numeral.legend': '数字表記（暗号化の出力と表の見出し）',
    'numeral.arabic': 'アラビア数字',
    'numeral.kanji': '漢数字',
    'numeral.hint': 'かなの鍵では数字表記を使いません。',

    'key.legend': '鍵',
    'key.modeStandard': '標準（鍵なし）',
    'key.modeNumeric': '数字の並べ替え',
    'key.modeKana': 'かな7文字×2（和歌の下の句など）',
    'key.colLabel': '列の鍵（右の列から順に）',
    'key.rowLabel': '行の鍵（上の行から順に）',
    'key.exampleButton': '例を入れる',
    'key.randomButton': 'ランダムに作る',
    'key.kanaHint':
      'かなの例は阿倍仲麻呂の歌の下の句です。重複のない句の例として選んだもので、史料に載っている鍵ではありません。',
    'key.errLength': '7文字にしてください（いま{count}文字）',
    'key.errDuplicate':
      '同じ文字が重なっています（重なり: {chars}）。重なりがあると復号が一意に決まりません',
    'key.errCharset': '1〜7の数字だけ、または、いろは48文字のかなだけで入力してください',
    'key.errKind': '選んだ鍵の種類に合う文字を入力してください',
    'key.errMixed': '列と行は同じ種類の鍵にしてください',
    'key.normalized': '清音・ひらがななどに正規化して使用します: {key}',

    'button.run': '実行',
    'button.swap': '結果を入力に送る',
    'button.copy': '📋 コピー',
    'button.copied': '✅ コピー完了',

    'result.heading': '結果',

    'matrix.heading': '換字表',
    'matrix.hint': '右上から縦に並べ、列→行の順に読みます。列7・行7は空きマスです。',
    'matrix.caption': '字変四十八表（いろは順）',
    'matrix.rowKeyHeader': '行の鍵',
    'matrix.emptyCell': '空き',

    'msg.keyInvalid': '鍵を確認してください。欄の下に修正点を表示しています。',
    'msg.inputEmpty': '⚠️ 入力が空です。テキストを入力してください。',
    'msg.inputTooLong': '入力は{max}文字までです（いま{count}文字）',
    'msg.conversions': '🔄 文字変換: {list}',
    'msg.removedSpaces': '省いた空白: {count}個',
    'msg.unknown': '暗号化できないため、そのまま出力: {list}',
    'msg.issue': '{reason}: {list}',
    'msg.done': '✅ 処理が完了しました',
    'msg.copied': 'コピーしました',
    'msg.copyFailed': 'コピーできませんでした。結果を選択してコピーしてください',
    'msg.noRandom': 'この環境では乱数を生成できません。鍵を入力してください。',

    'conv.item': '「{from}」→「{to}」',
    'conv.itemRepeat': '「{from}」→「{to}」×{count}',

    'issue.range': '1〜7の範囲外',
    'issue.empty': '空きマス（列7・行7）',
    'issue.passthrough': '座標として読めなかったので、そのまま出力',

    'theme.toDark': 'ダークモードに切り替え',
    'theme.toLight': 'ライトモードに切り替え',

    'list.separator': '、',

    'footer.prefix': '🔗 GitHubリポジトリーはこちら（',
    'footer.suffix': '）'
  };

  const en = {
    'app.title': 'Uesugi Cipher Tool (jihen-shijūhachi)',
    'app.description':
      'Encrypt and decrypt with the Uesugi cipher (jihen-shijūhachi), a 7×7 grid of the 48 iroha '
      + 'kana used in Sengoku-era Japan. Standard grid, numeric keys, and kana keys.',
    'app.heading': 'Uesugi Cipher Tool (jihen-shijūhachi)',
    'app.langButton': '日本語',
    'app.langAria': 'Switch language',

    'work.aria': 'Cipher input and result',

    'input.label': 'Input:',
    'input.hint': 'Spaces are dropped, line breaks are kept. Up to 10,000 characters.',
    'input.placeholderEncrypt':
      'e.g. てきみゆ (voiced kana and katakana become plain hiragana automatically)',
    'input.placeholderDecrypt': 'e.g. 5-7 6-3 6-6 6-4, or 五七　六三　六六　六四',

    'settings.heading': 'Settings',

    'mode.legend': 'Direction',
    'mode.encrypt': 'Encrypt',
    'mode.decrypt': 'Decrypt',

    'numeral.legend': 'Numerals (for the ciphertext and the grid headers)',
    'numeral.arabic': 'Arabic numerals',
    'numeral.kanji': 'Kanji numerals',
    'numeral.hint': 'Kana keys do not use numerals.',

    'key.legend': 'Key',
    'key.modeStandard': 'Standard (no key)',
    'key.modeNumeric': 'Reordered digits',
    'key.modeKana': '7 kana × 2 (such as the lower half of a waka poem)',
    'key.colLabel': 'Column key (from the rightmost column)',
    'key.rowLabel': 'Row key (from the top row)',
    'key.exampleButton': 'Fill in an example',
    'key.randomButton': 'Make a random one',
    'key.kanaHint':
      'The kana example is the lower half of a poem by Abe no Nakamaro. It was picked because its '
      + 'characters do not repeat; no historical source records it as a key.',
    'key.errLength': 'The key needs exactly 7 characters (it has {count}).',
    'key.errDuplicate':
      'A character repeats ({chars}). A repeat makes the decryption ambiguous.',
    'key.errCharset': 'Use only the digits 1 to 7, or only kana from the 48 iroha characters.',
    'key.errKind': 'Use characters that match the kind of key you picked.',
    'key.errMixed': 'The column key and the row key have to be the same kind.',
    'key.normalized': 'Normalized to plain hiragana before use: {key}',

    'button.run': 'Run',
    'button.swap': 'Send the result to the input',
    'button.copy': '📋 Copy',
    'button.copied': '✅ Copied',

    'result.heading': 'Result',

    'matrix.heading': 'Substitution grid',
    'matrix.hint':
      'The kana run down each column starting at the top right, and every character is read '
      + 'column then row. Column 7, row 7 is empty.',
    'matrix.caption': 'The jihen-shijūhachi grid (iroha order)',
    'matrix.rowKeyHeader': 'Row key',
    'matrix.emptyCell': 'empty',

    'msg.keyInvalid': 'Check the key. What to fix is shown under each field.',
    'msg.inputEmpty': '⚠️ The input is empty. Type some text first.',
    'msg.inputTooLong': 'The input can hold {max} characters at most (it has {count}).',
    'msg.conversions': '🔄 Converted characters: {list}',
    'msg.removedSpaces': 'Spaces dropped: {count}',
    'msg.unknown': 'Cannot be encrypted, so left as they are: {list}',
    'msg.issue': '{reason}: {list}',
    'msg.done': '✅ Done',
    'msg.copied': 'Copied',
    'msg.copyFailed': 'Could not copy. Select the result and copy it by hand.',
    'msg.noRandom': 'This browser cannot generate random numbers. Type a key instead.',

    'conv.item': '“{from}” → “{to}”',
    'conv.itemRepeat': '“{from}” → “{to}” ×{count}',

    'issue.range': 'Outside the range 1 to 7',
    'issue.empty': 'The empty cell (column 7, row 7)',
    'issue.passthrough': 'Not readable as a coordinate, so left as it is',

    'theme.toDark': 'Switch to dark mode',
    'theme.toLight': 'Switch to light mode',

    'list.separator': ', ',

    'footer.prefix': '🔗 The repository is on GitHub (',
    'footer.suffix': ')'
  };

  let language = 'ja';
  const STORAGE_KEY = 'uesugi-cipher-language';

  function t(key, values = {}) {
    const dictionary = language === 'en' ? en : ja;
    const message = dictionary[key];
    if (typeof message !== 'string') throw new Error('Unknown message: ' + key);
    return message.replace(/\{(\w+)\}/g, (match, name) =>
      (Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match));
  }

  function apply(root = document) {
    document.documentElement.lang = language;
    document.title = t('app.title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('app.description'));
    root.querySelectorAll('[data-i18n]').forEach(element => {
      element.textContent = t(element.dataset.i18n);
    });
    for (const attribute of ['aria-label', 'title', 'placeholder']) {
      root.querySelectorAll('[data-i18n-' + attribute + ']').forEach(element => {
        element.setAttribute(attribute, t(element.getAttribute('data-i18n-' + attribute)));
      });
    }
  }

  function setLanguage(value) {
    if (!['ja', 'en'].includes(value)) return;
    language = value;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* 保存できない環境でも切り替えは続ける。 */
    }
    apply();
    document.dispatchEvent(new Event('languagechange'));
  }

  function init() {
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* 保存が読めない環境では既定に従う。 */
    }
    const query = new URLSearchParams(location.search).get('lang');
    language = [query, saved].find(value => value === 'ja' || value === 'en')
      || (/^ja\b/i.test(navigator.language || '') ? 'ja' : 'en');
    apply();
  }

  return { ja, en, t, apply, init, setLanguage, get language() { return language; } };
})();

if (typeof window !== 'undefined') window.I18n = I18n;
if (typeof module !== 'undefined' && module.exports) module.exports = I18n;
