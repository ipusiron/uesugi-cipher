# Uesugi Cipher Tool

English · [日本語](README.md)

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/uesugi-cipher?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/uesugi-cipher?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/uesugi-cipher)
![GitHub license](https://img.shields.io/github/license/ipusiron/uesugi-cipher)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/uesugi-cipher/)

**Day012 - 100 Security Tools with Generative AI**

A browser tool for the **Uesugi cipher** (*jihen-shijūhachi*, 字変四十八), a Japanese substitution cipher handed down as a Sengoku-period military secret.

The 48 characters of the *iroha* poem are laid out in a 7×7 grid, and every character becomes a pair of coordinates read **column first, then row**. The mechanism is the same idea as the Polybius square recorded in ancient Greece, arrived at independently on the other side of the world.

---

## What you need to know about Japanese first

Two facts about the writing system make this cipher work the way it does.

- **Kana are syllables, not letters.** Each character stands for a whole sound such as *ka* or *mi*, so a 7×7 grid is enough to hold the entire alphabet of the language.
- **The *iroha* is a fixed order.** It is a 10th-century poem that uses each of the 48 kana of classical Japanese exactly once — a pangram that doubles as an alphabetical order, the way *abcdefg* does for the Latin script. Because the order is fixed and known, the standard grid has no secret in it at all.

Classical Japanese had 48 kana; modern Japanese writes voiced sounds with extra marks (*ka* か plus two dots becomes *ga* が) and adds small characters for doubled consonants. None of those exist in the *iroha*, so the tool folds them back onto the plain kana before encrypting. That loses information, and it cannot be undone.

## 🌐 Demo

👉 [Open the Uesugi Cipher Tool](https://ipusiron.github.io/uesugi-cipher/)

## 📸 Screenshots

![Encrypting with the standard grid](assets/screenshot2.png)
> *Light: ひみつのてがみ (himitsu no tegami, "a secret letter") encrypted with the standard grid, with the six cells used highlighted*

![The standard grid in dark mode](assets/screenshot3.png)
> *Dark: the same result, with the notice about converted characters*

![Encrypting with a kana key](assets/screenshot4.png)
> *A kana key: てきみゆ becomes やも　まし　まか　まつ*

## ✨ Features

- Reproduces the *jihen-shijūhachi* method of the Uesugi cipher
- 7×7 grid in *iroha* order, read down from the top right, column then row
- Encryption and decryption, plus a button that sends the result back to the input
- Arabic numerals (`5-7`) or kanji numerals (`五七`), with an optional numeric or kana key
- Automatic folding of voiced, half-voiced, small and katakana characters; anything outside the grid is passed through
- The cells used are highlighted (colour, thick border, bold), and the animation respects `prefers-reduced-motion`
- Light and dark mode
- 📱 Responsive: two columns at 1024px and wider, stacked below that
- Copy to clipboard, input validation, and notices for everything the tool changed
- Japanese and English interface (only the interface — the *iroha* grid, the kanji numerals and the kana keys are the data this tool works on, so they are never translated)
- Runs entirely in the browser, nothing to install

## 📖 How to use it

1. Type `てきみゆ` into the input box.
2. Pick **Encrypt**, **Arabic numerals** and **Standard (no key)**, then press **Run**.
3. Read off `5-7 6-3 6-6 6-4` and look at the highlighted cells.
4. Press **Send the result to the input** and check that it decrypts back to `てきみゆ`.

Changing the numeral setting or the key re-runs the cipher automatically, as long as there is input and the key is valid. Changing only the direction clears the previous result and the highlights.

Spaces in the plaintext are dropped, because a space cannot be told apart from the separator between coordinates. Line breaks are kept. The input holds at most 10,000 code points.

Decryption accepts either numeral system, in half or full width. Kanji numerals work without separators too, as in `五七六三六六六四`. The empty cell (`7-7`) and out-of-range coordinates come out as `?`, and a token that cannot be read as a coordinate is passed through untouched, with a notice.

### Examples

| Plaintext | After folding | Arabic numerals | Kanji numerals |
|---|---|---|---|
| てきみゆ | てきみゆ | 5-7 6-3 6-6 6-4 | 五七　六三　六六　六四 |
| ひみつのてがみ | ひみつのてかみ | 7-2 6-6 3-5 4-5 5-7 2-7 6-6 | 七二　六六　三五　四五　五七　二七　六六 |
| おこのみやき | おこのみやき | 4-6 5-5 4-5 6-6 5-1 6-3 | 四六　五五　四五　六六　五一　六三 |
| ありがとう | ありかとう | 6-1 2-2 2-7 1-7 4-3 | 六一　二二　二七　一七　四三 |
| がんばって | かんはつて | 2-7 7-6 1-3 3-5 5-7 | 二七　七六　一三　三五　五七 |
| ぷるぷる | ふるふる | 5-4 2-4 5-4 2-4 | 五四　二四　五四　二四 |
| こんにちは | こんにちは | 5-5 7-6 1-4 2-1 1-3 | 五五　七六　一四　二一　一三 |
| テキミユ | てきみゆ | 5-7 6-3 6-6 6-4 | 五七　六三　六六　六四 |
| らーめん | らめん | 4-1 6-5 7-6 | 四一　六五　七六 |

## 🔑 Keys

The column key is assigned from the rightmost column, the row key from the top row. The standard grid uses `1234567` for both. Reordering the digits gives 7! × 7! = 25,401,600 possibilities. **Make a random one** uses the browser's cryptographic random source and avoids modulo bias.

A kana key picks 7 characters from the 48 *iroha* kana, with no repeats. A repeat would make the decryption ambiguous, so phrases like `つゆにぬれつつ` or `あまのかぐやま` cannot be used. Voiced characters are folded to their plain form before the repeat check runs.

The built-in example (`みかさのやまに` / `いでしつきかも`) is the second half of a poem by Abe no Nakamaro. It was picked only because its characters do not repeat; no historical source records it as a key. The row key is used in its folded form, `いてしつきかも`.

| Key | Column key | Row key |
|---|---|---|
| K1 | 3147526 | 2615374 |
| K2 | みかさのやまに | いてしつきかも |

| Key | Plaintext | Arabic numerals or kana | Kanji numerals or kana |
|---|---|---|---|
| K1 | てきみゆ | 5-4 2-1 2-7 2-5 | 五四　二一　二七　二五 |
| K1 | ひみつのてがみ | 6-6 2-7 4-3 7-3 5-4 1-4 2-7 | 六六　二七　四三　七三　五四　一四　二七 |
| K2 | てきみゆ | やも　まし　まか　まつ | やも　まし　まか　まつ |
| K2 | ひみつのてがみ | にて　まか　さき　のき　やも　かも　まか | にて　まか　さき　のき　やも　かも　まか |
| K2 | いろは | みい　みて　みし | みい　みて　みし |

Ciphertext from a kana key decrypts without separators too, as in `やもましまかまつ`. Kana keys do not use numerals, so the numeral setting is disabled while one is in use. Keys are never stored and never put in the URL.

## 🔄 Automatic character folding

The *iroha* contains no voiced marks, half-voiced marks or small *tsu*, so modern characters such as が, ぷ and っ have no cell of their own. The tool folds them onto the nearest plain kana before encrypting, and tells you what it changed.

| Modern character | Folded to | Why |
|---|---|---|
| が ぎ ぐ げ ご | か き く け こ | voiced mark (*dakuten*) |
| ざ じ ず ぜ ぞ | さ し す せ そ | voiced mark |
| だ ぢ づ で ど | た ち つ て と | voiced mark |
| ば び ぶ べ ぼ | は ひ ふ へ ほ | voiced mark |
| ぱ ぴ ぷ ぺ ぽ | は ひ ふ へ ほ | half-voiced mark (*handakuten*) |
| っ | つ | doubled consonant, written as a small *tsu* |
| ー | (dropped) | long-vowel mark |
| ゃ ゅ ょ | や ゆ よ | small kana used for glides |
| ぁ ぃ ぅ ぇ ぉ | あ い う え お | small vowels |
| ゔ ゎ ゕ ゖ | う わ か け | rare small and voiced kana |
| katakana | hiragana | e.g. テ → て |
| half-width katakana | plain hiragana | normalized with NFKC first, e.g. ｶﾞ → か |

### Worked examples

```
Input:      ありがとう        (arigatou, "thank you")
Folded:     ありかとう
Ciphertext: 6-1 2-2 2-7 1-7 4-3
Notice:     🔄 Converted characters: “が” → “か”
```

```
Input:      がんばって        (ganbatte, "go for it")
Folded:     かんはつて
Ciphertext: 2-7 7-6 1-3 3-5 5-7
Notice:     🔄 Converted characters: “が” → “か”, “ば” → “は”, “っ” → “つ”
```

```
Input:      ぷるぷる          (purupuru, "wobbly")
Folded:     ふるふる
Ciphertext: 5-4 2-4 5-4 2-4
Notice:     🔄 Converted characters: “ぷ” → “ふ” ×2
```

## ⚠️ What the folding costs you

Folding is one-way. The plaintext you get back is the folded form, not what was typed.

| Original | Reading | Reading after folding | Effect |
|---|---|---|---|
| 時間 | じかん (*jikan*, "time") | しかん | reads as a different word |
| 頑張って | がんばって (*ganbatte*) | かんはつて | hard to recognize |
| ラーメン | らーめん (*raamen*) | らめん | the long vowel is gone |

So: for learning and for trying the cipher out, the folding lets you feed it modern Japanese. For a faithful reconstruction, use text that needs no folding. For anything that actually matters, use modern cryptography.

Kanji, Latin letters, digits and punctuation are passed through unchanged, with a notice. Voiced marks, long vowels and spaces cannot be recovered.

## 📚 Historical background

The cipher is said to come from *Bukei-yōryaku* (『武経要略』), a treatise on the art of war attributed to Usami Sadayuki, a retainer of the warlord **Uesugi Kenshin** (1530–1578). The chapter *Kōkan-hen* describes the *jihen-shijūhachi* — literally "forty-eight character changes" — method.

A word on the Greek comparison. What Polybius set down in Book X of the Histories was not a cipher for keeping secrets but a method of signalling with torches: the 24 letters of the Greek alphabet were split across five boards, and torches raised on either side of a screen gave the number of the board and the position of the letter on it. The 5×5 table now called the Polybius square is a later form, shaped to fit the Latin alphabet into 25 cells, and the name itself is later too. What the *jihen-shijūhachi* shares with it is the idea of naming a character by a pair of coordinates, not any borrowing from ancient Greece. You can try the original method in [Polybius CipherLab](https://ipusiron.github.io/polybius-cipherlab/).

### What the sources actually support

The attribution comes with real reservations.

- Usami Sadayuki cannot be confirmed in any primary source. He is thought to be a figure built during the Edo period out of the real Echigo warrior Usami Sadamitsu (Shinzawa 1971; Takahashi 1997, 2007).
- *Hokuetsu-gunki*, the chronicle that recounts Sadayuki's exploits, is thought to be the work of Usami Sadasuke (1634–1713), a military scholar of the Kishū domain (Takahashi 1997, 2007). Sadasuke first used the surname Ōzeki and changed it to Usami by order of the domain in 1684 (Inoue 2020). Some studies argue that he also forged letters of commendation attributed to Uesugi Kenshin (Yusa 2007, 2008).
- The National Institute of Japanese Literature's Kokusho database classifies *Bukei-yōryaku* under military science and gives its author as Usami Yoshikata (Katsuoki), Sadasuke's father and an early-Edo military scholar (1590–1647). The dated manuscripts are Edo-period copies: 1666, 1683, 1844. One catalogue entry gives 1536, which is earlier than the stated author was born, so the date of composition is unsettled.

In short: *jihen-shijūhachi* has been handed down as the work of Uesugi Kenshin's strategist, while the treatise it is credited to is catalogued as an early-Edo work of the Echigo school of military science. No primary source showing the cipher in use in Kenshin's own time was found while building this tool, and a search of CiNii Research (September 2026) turned up no academic paper on the Uesugi cipher or *jihen-shijūhachi* as such.

## 🎬 Where the Uesugi cipher shows up

- *HH News & Reports*, "Japan in the history of cryptography — the Sengoku-period Uesugi cipher", presents it as the *jihen-shijūhachi* recorded by Usami Sadayuki in *Bukei-yōryaku*: a substitution cipher over a 7×7 kana grid, with numbers standing in for the characters.
- In the manga and anime *Dr. Stone: Science Future*, an equivalent scheme is used over radio to keep transmissions from being read by the enemy.
- *Angō Survival Gakuen*, a children's novel series from Gakken, puts "Uesugi Kenshin's cipher" alongside the Caesar cipher and Morse code as puzzles for the reader to solve.

## 🔬 Security analysis

### Classification

**Type**: monoalphabetic substitution cipher

- Every kana maps to one fixed coordinate pair (て → `5-7`), and the mapping never changes
- The substitution function is constant across the message

### The weaknesses that follow

#### 1. Frequency analysis

```
Character frequency in Japanese (roughly):
の, に, は, を  -> very common
ゑ, ゐ          -> effectively unused in modern Japanese

The same shape survives in the ciphertext:
a coordinate that keeps recurring -> probably の, に or は
```

#### 2. Pattern analysis

- A repeated character repeats in the ciphertext: ここ → `5-5 5-5`
- Grammatical endings such as です and ます have recognizable coordinate patterns
- The particles は, が and を sit at fixed coordinates

#### 3. The key space

The standard grid fixes the *iroha* order, so there is effectively no key at all. The only freedom is how the coordinates are read (column-row versus row-column).

Turning on a numeric key raises the space to 25,401,600, and that changes nothing about the cipher being monoalphabetic. The same character still becomes the same coordinate, so frequency and pattern analysis apply exactly as before. Do not use it to protect anything.

### Concrete attack scenarios

#### Short messages (10 to 20 characters)

```
Ciphertext: 5-7 6-3 6-6 6-4
|
1. Guess that this is one short four-character word
2. Search a dictionary for four-character Japanese words
3. Candidates: てきみゆ, ひみつの, ...
4. One hit recovers four entries of the table
```

#### Long messages (100 characters and up)

```
1. Frequency analysis pins down the coordinates for の, に, は
2. Pattern analysis pins down the endings ます and です
3. The table is rebuilt piece by piece
4. A dictionary attack settles the rest
```

## 🎯 Use cases

### Ways of using this tool in particular

- Confirming that a letter is given as row-column coordinates (math and coding classes): a 7x7 grid turns one kana into a pair of "row-column" numbers. "てきみゆ" becomes `5-7 6-3 6-6 6-4`, and decrypting the same coordinates returns the original. You can confirm, on kana, the idea of pointing to a position by coordinates, the same as a spreadsheet cell address or a map grid
- Confirming that dakuten and small kana are leveled to plain kana (information-loss classes): the grid holds only plain kana, so "がっこう" is changed to か, つ and so on before being turned into coordinates. The conversion log keeps "が to か" and "っ to つ". You can confirm that the distinction of dakuten and small kana is lost and that what was changed is kept in a visible form
- Confirming that a keyed mode changes the coordinates (key-substitution classes): with a key that reorders the row and column headers, the same "て" gets a different coordinate. With the standard key it is `5-7`, but with a key whose headers are reversed it is `3-1`. Decrypting with the right key returns "て", while decrypting with the standard key without knowing the key gives a different letter, "よ". You can confirm that the key changes the coordinate mapping

### General uses

- Learn how the Uesugi cipher works as a Japanese classical cipher in class or self-study
- Make a cipher using grid coordinates for puzzles and games
- Use it as material to compare, with the Polybius square (Latin letters), ciphers that give a letter by coordinates

## 🔒 Security and privacy

The page makes zero outbound requests. Your input, the result and the key are never transmitted. No external resources are loaded, Google Fonts included. The only things kept in the browser are the theme and the language you picked.

The Content Security Policy is set in a `meta` element; there are no inline scripts or styles, and `connect-src 'none'` forbids network access. The page is built with `textContent` and DOM calls, and the key is checked for kind, length and repeats. The referrer policy is `no-referrer`, and external links carry `noopener noreferrer`.

`frame-ancestors` has no effect in a `meta` element, so it is not set. The badges and links in this README point outside the tool.

## 🧪 Tests

Node 22 or newer, run from the repository root. There are no dependencies.

```sh
npm test
```

`node --test` checks the known answers, the round trip over all 48 characters, the keys, the input limits, the colour contrast and the HTML. The two dictionaries are checked against each other for key sets, placeholder names and untranslated Japanese, and a test pins down the fact that the *iroha* grid and the folding table were left alone. The tables and examples in the READMEs are recomputed. GitHub Actions runs all of it on push and pull request.

## 🔗 References

### Web

- HH News & Reports, "Ciphers and the history of ciphers", part 3: "Japan in the history of cryptography — the Sengoku-period Uesugi cipher" https://www.hummingheads.co.jp/reports/series/ser01/110519.html
- Mynavi TECH+, "Trying the Japanese programming language Nadeshiko from scratch", part 74 https://news.mynavi.jp/techplus/article/nadeshiko-74/
- Polybius CipherLab (Day067) — the fire signal of Polybius' original text and the later 5×5 square https://ipusiron.github.io/polybius-cipherlab/

### Books and catalogues

- Shinzawa Yoshihiro, "The false image of Usami Suruga-no-kami and the reality behind it", *Nihon Rekishi* 276, Yoshikawa Kōbunkan, 1971, pp. 104–110
- Takahashi Osamu, "On the military scholar Usami Sadasuke", *Bulletin of the Wakayama Prefectural Museum* 2, 1997, pp. 22–32
- Takahashi Osamu, *The Other Battle of Kawanakajima: Discovering the Kishū Folding Screen*, Yōsensha, 2007
- Yusa Norihiro, "The man who cut wormholes into a document with a razor: untangling the papers of Usami Sadasuke", *Bulletin of the Wakayama Prefectural Archives* 12, 2007, pp. 1–30
- Yusa Norihiro, "That Kenshin letter of commendation was made by the Kishū military scholar Usami Sadasuke", *Bulletin of the Wakayama Prefectural Archives* 13, 2008, pp. 25–62
- Inoue Yasushi, "Warrior society in the Kanbun era and compiled chronicles of the Shokuhō period", *Shomotsu, Shuppan to Shakai Henyō* 24, 2020, pp. 1–30 https://hdl.handle.net/10086/31056
- Kokusho Database (National Institute of Japanese Literature), *Bukei-yōryaku* (work ID 1015050) https://kokusho.nijl.ac.jp/biblio/100428794
- *Digital Nihon Jinmei Daijiten+Plus*, "Usami Katsuoki" (Kodansha) https://kotobank.jp/word/宇佐美勝興-1057625

## 📁 Directory layout

```text
uesugi-cipher/
├── README.md                  # Japanese description
├── README.en.md               # this file
├── CLAUDE.md                  # layout and conventions for development
├── LICENSE                    # MIT
├── package.json               # npm test, no dependencies
├── docs/                      # what GitHub Pages serves
│   ├── index.html             # input, settings, result, grid
│   ├── favicon.svg            # local icon
│   ├── css/
│   │   └── style.css          # colours and responsive layout
│   └── js/
│       ├── uesugi-logic.js    # cipher logic, no DOM
│       ├── i18n.js            # Japanese and English wording
│       └── script.js          # DOM, theme, copy
├── assets/
│   ├── screenshot.png         # kept from an earlier version
│   ├── screenshot2.png        # standard grid, light
│   ├── screenshot3.png        # standard grid, dark
│   └── screenshot4.png        # kana key
├── test/
│   ├── uesugi.test.js         # standard grid, folding, limits
│   ├── key.test.js            # keys, shuffle, round trip
│   ├── readme.test.js         # documents against the code
│   ├── html.test.js           # HTML and safe rendering
│   ├── i18n.test.js           # dictionaries against data-i18n
│   ├── contrast.test.js       # contrast computed from the CSS
│   └── format.test.js         # readable line lengths
└── .github/
    └── workflows/
        ├── deploy.yml         # publishes docs/ to Pages
        └── test.yml           # tests on Node 22
```

## 💻 Requirements

Any modern browser. Opening `docs/index.html` over `file://` works. To serve it over HTTP instead, run the following and open the URL it prints.

```sh
python -m http.server --directory docs
```

Node 22 or newer is needed only for the tests. Copying follows whatever the browser's Clipboard API allows; where it is unavailable, select the result and copy it by hand.

## 📄 License

MIT License. See [LICENSE](LICENSE) for the details.

## 🛠 About this tool

This tool was built as part of **100 Security Tools with Generative AI**, a project that produces and publishes a security-related tool every day for 100 days with the help of generative AI.

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
