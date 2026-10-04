import { EMAIL, SECTION_FILES, SECTION_IDS, STACK, TEXT, cvFor, expDuration } from '../content.js';

export const HOME = ['home', 'volempdoge'];
export const CV_DIR = HOME.concat('cv');

const file = (lines) => ({ type: 'file', lines });
const dir = (children) => ({ type: 'dir', children });
const dim = (text) => ({ kind: 'dim', text });

/** The lines `cat` prints for a section of the page. */
export function catSection(id, { lang, role, now }) {
  const t = TEXT[lang];
  const cv = cvFor(lang, role);
  if (id === 'about') return ['# ' + t.name, dim(t.titles[role]), t.summary[role]];
  if (id === 'experience') {
    return [
      dim(t.job.period + ' · ' + expDuration(lang, now)),
      t.job.role,
      t.job.org + ' · ' + t.job.location,
      ...cv.points.map((p) => '→ ' + p.h + ' ' + p.t),
      dim('stack: ' + STACK.join(', ')),
    ];
  }
  if (id === 'projects') {
    return cv.projects.flatMap((p) => [
      { kind: 'ok', text: p.title + ' · ' + p.meta },
      p.body,
      ...(p.href ? [dim(p.href)] : []),
    ]);
  }
  if (id === 'skills') return cv.skills.map((s) => s.label + ': ' + s.items.join(', '));
  if (id === 'education') {
    return t.edu.flatMap((e) => [dim(e.period + (e.duration ? ' · ' + e.duration : '')), e.role, e.org]);
  }
  if (id === 'contact') {
    return ['email: ' + EMAIL, 'github: github.com/volempdoge', 'linkedin: linkedin.com/in/volempdoge'];
  }
  return null;
}

/** The virtual filesystem: ~/cv holds one file per section, ~/cv/projects one per project. */
export function buildFs({ lang, role, now }) {
  const proj = {};
  cvFor(lang, role).projects.forEach((p) => {
    proj[p.file] = file(['# ' + p.title, dim(p.meta), p.body, ...(p.href ? [dim(p.href)] : [])]);
  });
  const cv = {};
  SECTION_IDS.forEach((id) => {
    if (id === 'projects') cv.projects = dir(proj);
    else cv[SECTION_FILES[id]] = file(catSection(id, { lang, role, now }));
  });
  return dir({
    home: dir({
      volempdoge: dir({
        cv: dir(cv),
        '.zshrc': file([
          'export FOCUS=' + role,
          'export LANG=' + (lang === 'ua' ? 'uk_UA.UTF-8' : 'en_US.UTF-8'),
          'ZSH_THEME="v2"',
          'plugins=(git zsh-autosuggestions zsh-syntax-highlighting)',
        ]),
      }),
    }),
  });
}

/** Path segments for `p`, relative to `cwd`. Handles /, ~, . and .. */
export function resolve(cwd, p) {
  const s = p == null ? '' : p;
  let segs;
  if (s.startsWith('/')) segs = [];
  else if (s === '~' || s.startsWith('~/')) segs = HOME.slice();
  else segs = cwd.slice();
  const rest = s.startsWith('~') ? s.slice(1) : s;
  rest
    .split('/')
    .filter(Boolean)
    .forEach((part) => {
      if (part === '.') return;
      if (part === '..') segs.pop();
      else segs.push(part);
    });
  return segs;
}

export function nodeAt(root, segs) {
  let n = root;
  for (const p of segs) {
    if (!n || n.type !== 'dir' || !n.children[p]) return null;
    n = n.children[p];
  }
  return n;
}

/** Prompt label: ~/cv for paths under home, /etc otherwise. */
export function label(segs) {
  const isHome = HOME.every((p, i) => segs[i] === p);
  if (isHome) return '~' + (segs.length > HOME.length ? '/' + segs.slice(HOME.length).join('/') : '');
  return '/' + segs.join('/');
}

/** The page section a directory belongs to, e.g. ~/cv/projects → projects. */
export function sectionOf(segs) {
  if (
    segs.length > CV_DIR.length &&
    CV_DIR.every((p, i) => segs[i] === p) &&
    SECTION_IDS.includes(segs[CV_DIR.length])
  ) {
    return segs[CV_DIR.length];
  }
  return null;
}

export function entryColor(name, node) {
  if (node.type === 'dir') return 'var(--accent)';
  if (name.startsWith('.')) return 'var(--text-subtle)';
  return 'var(--text-body)';
}

/** Directories first, then files; dotfiles only with `all`. */
export function sortedEntries(node, all) {
  return Object.keys(node.children)
    .filter((n) => all || !n.startsWith('.'))
    .sort((a, b) => {
      const da = node.children[a].type === 'dir';
      const db = node.children[b].type === 'dir';
      if (da !== db) return da ? -1 : 1;
      return a.localeCompare(b);
    });
}

export function fileSize(node) {
  const n = node.lines.reduce((a, l) => a + (typeof l === 'string' ? l : l.text).length + 1, 0);
  return n > 999 ? (n / 1024).toFixed(1) + 'K' : String(n);
}

export function treeLines(node, prefix = '', out = []) {
  const names = sortedEntries(node, false);
  names.forEach((n, i) => {
    const last = i === names.length - 1;
    const child = node.children[n];
    out.push({
      kind: 'segs',
      segs: [
        { text: prefix + (last ? '└── ' : '├── '), color: 'var(--text-subtle)' },
        { text: n + (child.type === 'dir' ? '/' : ''), color: entryColor(n, child) },
      ],
    });
    if (child.type === 'dir') treeLines(child, prefix + (last ? '    ' : '│   '), out);
  });
  return out;
}
