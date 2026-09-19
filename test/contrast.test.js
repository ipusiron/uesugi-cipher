const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '../docs/css/style.css'), 'utf8');
const tokens = block => Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/gi)]
  .map(([, name, color]) => [name, color]));
const light = tokens(css.match(/:root\s*\{([^}]+)\}/)[1]);
const dark = tokens(css.match(/:root\[data-theme="dark"\]\s*\{([^}]+)\}/)[1]);
const automatic = tokens(css.match(/:root:not\(\[data-theme="light"\]\)\s*\{([^}]+)\}/)[1]);
const pairs = [
  ['text', 'surface'], ['text', 'surface-2'], ['text', 'bg'],
  ['muted', 'surface'], ['muted', 'surface-2'], ['muted', 'bg'],
  ['heading', 'bg'], ['heading', 'surface'], ['accent-text', 'accent'], ['link', 'surface'],
  ['coord-text', 'coord'], ['used-text', 'used'], ['ok-text', 'ok'], ['warn', 'surface-2'], ['err', 'surface-2'],
  ['border', 'surface', 3], ['border', 'surface-2', 3], ['accent', 'surface', 3]
];
function luminance(hex) {
  assert.match(hex, /^#[\da-f]{6}$/i);
  const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
test('OSダークと明示ダークの値が一致', () => assert.deepEqual(automatic, dark));
for (const [theme, colors] of Object.entries({ light, dark: { ...light, ...dark } })) {
  for (const [fg, bg, minimum = 4.5] of pairs) test(`${theme}: ${fg}/${bg}`, t => {
    const a = luminance(colors[fg]);
    const b = luminance(colors[bg]);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    t.diagnostic(ratio.toFixed(2) + ':1');
    assert.ok(ratio >= minimum, ratio.toString());
  });
}
