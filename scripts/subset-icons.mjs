// Downloads public/fonts/material-symbols-outlined.woff2 with only the icons in
// scripts/icons.txt (the full font is ~750 KB). Run after adding an icon:
//   node scripts/subset-icons.mjs
// tests/e2e/site.spec.js fails when the page shows an icon missing from the list.
import { readFile, writeFile } from 'node:fs/promises';

const names = (await readFile(new URL('icons.txt', import.meta.url), 'utf8')).split(/\s+/).filter(Boolean).sort();
// Weight axis only, as in the design system's font: FILL, GRAD and opsz stay at their defaults.
const css = await fetch(
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700&display=block&icon_names=' +
    names.join(','),
  // Google Fonts serves woff2 only to browsers it recognises.
  { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0' } },
).then((r) => r.text());
const url = css.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/)?.[1];
if (!url) throw new Error('no font URL in the Google Fonts response:\n' + css);
const font = Buffer.from(await (await fetch(url)).arrayBuffer());
await writeFile(new URL('../public/fonts/material-symbols-outlined.woff2', import.meta.url), font);
console.log('material-symbols-outlined.woff2: ' + names.length + ' icons, ' + font.length + ' bytes');
