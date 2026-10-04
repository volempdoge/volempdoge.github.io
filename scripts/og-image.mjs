// Draws the social preview cards public/og/en.png and public/og/uk.png
// (1200×630, dark theme) with Playwright's Chromium and the site's fonts.
// Run after changing the name, titles or the look:
//   node scripts/og-image.mjs
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { PAGES, STACK, TEXT } from '../src/content.js';
import { OG_SIZE } from './head.mjs';

const ORIGIN = 'http://og.local';
const root = new URL('..', import.meta.url);

const LOCATION = { en: 'Kyiv, Ukraine', ua: 'Київ, Україна' };

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function card(lang) {
  const t = TEXT[lang];
  return `<!doctype html>
<html lang="${PAGES[lang].htmlLang}">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="${ORIGIN}/src/styles/ds/fonts.css">
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${OG_SIZE.width}px; height: ${OG_SIZE.height}px; }
  body {
    background-color: #0b0c0d;
    background-image: radial-gradient(rgb(255 255 255 / 6%) 1px, transparent 1.2px);
    background-size: 18px 18px;
    color: #e4e2de;
    font-family: 'IBM Plex Sans', sans-serif;
    padding: 64px 80px;
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
  }
  .mono { font-family: 'IBM Plex Mono', monospace; }
  .top { display: flex; justify-content: space-between; align-items: baseline; font-size: 26px; font-weight: 500; color: #f2f1ee; }
  .top span { color: #8a63d2; }
  .top small { font-size: 22px; font-weight: 400; color: #8d8b86; }
  .prompt { margin-top: 92px; font-size: 24px; color: #8d8b86; }
  .prompt b { color: #8a63d2; font-weight: 400; }
  .prompt i { font-style: normal; color: #e4e2de; }
  h1 { margin-top: 14px; display: flex; align-items: center; gap: 16px; font-size: 92px; font-weight: 300; letter-spacing: -0.025em; line-height: 1.04; color: #f2f1ee; }
  h1::after { content: ''; width: 0.6em; height: 1.15em; background: #8a63d2; }
  .title { margin-top: 22px; font-size: 30px; font-weight: 500; color: #c2aceb; }
  .tags { margin-top: auto; display: flex; gap: 12px; }
  .tags span { padding: 7px 14px; border: 1.5px solid rgb(181 179 174 / 38%); border-radius: 5px; font-size: 22px; color: #b5b3ae; }
</style>
</head>
<body>
  <div class="top mono"><div><span>~/</span>volempdoge</div><small>${esc(LOCATION[lang])}</small></div>
  <div class="prompt mono"><b>~/cv</b> $ <i>whoami</i></div>
  <h1>${esc(t.name)}</h1>
  <div class="title mono">${esc(t.titles.embedded)} · ${esc(t.titles.software)}</div>
  <div class="tags mono">${STACK.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
</body>
</html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: OG_SIZE, deviceScaleFactor: 1 });
// Serve the repository at ORIGIN so the card loads the site's own font files.
await page.route(ORIGIN + '/**', async (route) => {
  const path = new URL(route.request().url()).pathname;
  const file = path.startsWith('/fonts/') ? new URL('public' + path, root) : new URL('.' + path, root);
  const type = path.endsWith('.css') ? 'text/css' : 'font/woff2';
  route.fulfill({ body: await readFile(file), contentType: type });
});
await mkdir(new URL('public/og/', root), { recursive: true });
for (const lang of Object.keys(PAGES)) {
  await page.setContent(card(lang), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const out = new URL('public/og/' + PAGES[lang].htmlLang + '.png', root);
  await page.screenshot({ path: out.pathname, type: 'png' });
  console.log('wrote ' + out.pathname.replace(root.pathname, ''));
}
await browser.close();
