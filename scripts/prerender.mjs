// Renders the page into dist/index.html after `vite build` (client) and
// `vite build --ssr` (server entry, in dist/server). The build time and the
// commit are baked in and handed to the client for hydration.
import { execFileSync } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = 'https://github.com/volempdoge/volempdoge.github.io';
const dist = resolve('dist');
const serverDir = resolve(dist, 'server');

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function commit() {
  try {
    const sha = process.env.GITHUB_SHA || git('rev-parse', 'HEAD');
    return { sha, url: REPO + '/commit/' + sha, date: git('show', '-s', '--format=%cs', sha) };
  } catch {
    return null;
  }
}

const { render } = await import(pathToFileURL(resolve(serverDir, 'entry-server.js')).href);
const data = { now: new Date().toISOString(), commit: commit() };
const template = await readFile(resolve(dist, 'index.html'), 'utf8');
if (!template.includes('<!--app-html-->') || !template.includes('<!--app-data-->')) {
  throw new Error('dist/index.html has no <!--app-html--> / <!--app-data--> placeholder');
}
const html = template
  .replace('<!--app-html-->', () => render(data))
  .replace('<!--app-data-->', () => JSON.stringify(data).replace(/</g, '\\u003c'));
await writeFile(resolve(dist, 'index.html'), html);
await rm(serverDir, { recursive: true, force: true });
console.log('prerendered dist/index.html' + (data.commit ? ' at ' + data.commit.sha.slice(0, 7) : ''));
