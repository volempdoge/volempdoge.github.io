// Renders the page into dist/index.html (en) and dist/uk/index.html (ua) after
// `vite build` (client) and `vite build --ssr` (server entry, in dist/server),
// inlines the stylesheet and writes dist/sitemap-cv.xml. The build time and the commit are baked in
// and handed to the client for hydration.
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PAGES } from '../src/content.js';
import { headTags, sitemap } from './head.mjs';

const REPO = 'https://github.com/volempdoge/volempdoge.github.io';
const dist = resolve('dist');
const serverDir = resolve(dist, 'server');

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function commit() {
  try {
    const sha = process.env.GITHUB_SHA || git('rev-parse', 'HEAD');
    return {
      sha,
      url: REPO + '/commit/' + sha,
      date: git('show', '-s', '--format=%cs', sha),
      time: git('show', '-s', '--format=%cI', sha),
    };
  } catch {
    return null;
  }
}

function fill(template, marker, value) {
  if (!template.includes(marker)) throw new Error('index.html has no ' + marker);
  return template.replace(marker, () => value);
}

const { render } = await import(pathToFileURL(resolve(serverDir, 'entry-server.js')).href);
// Inline the stylesheet (~10 KB gzipped): one round trip less before first paint.
let template = await readFile(resolve(dist, 'index.html'), 'utf8');
const cssLink = template.match(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/);
if (!cssLink) throw new Error('index.html has no stylesheet link');
const css = await readFile(resolve(dist, '.' + cssLink[1]), 'utf8');
if (css.includes('</style')) throw new Error('stylesheet contains </style');
template = template.replace(cssLink[0], () => '<style>' + css + '</style>');
await rm(resolve(dist, '.' + cssLink[1]));
const c = commit();
const now = new Date().toISOString();

for (const lang of Object.keys(PAGES)) {
  const page = PAGES[lang];
  const data = { lang, now, commit: c && { sha: c.sha, url: c.url, date: c.date } };
  let html = template.replace(/<html lang="[^"]*"/, `<html lang="${page.htmlLang}"`);
  html = html.replace(/<!--head:start-->[\s\S]*?<!--head:end-->/, () => headTags(lang, { dateModified: c?.time }));
  html = fill(html, '<!--app-html-->', render(data));
  html = fill(html, '<!--app-data-->', JSON.stringify(data).replace(/</g, '\\u003c'));
  const out = resolve(dist, '.' + page.path, 'index.html');
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, html);
  console.log('prerendered ' + page.path);
}

await writeFile(resolve(dist, 'sitemap-cv.xml'), sitemap(c?.time));
await rm(serverDir, { recursive: true, force: true });
console.log('commit ' + (c ? c.sha.slice(0, 7) : 'unknown'));
