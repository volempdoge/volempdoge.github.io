import { SECTION_IDS } from '../content.js';
import { ALIASES, CMDS, CMD_NAMES, MAN } from './commands.js';
import { nodeAt, resolve, sortedEntries } from './fs.js';

const PATH_CMDS = ['cd', 'cat', 'ls', 'tree'];

const cmdItems = (word) =>
  CMD_NAMES.filter((c) => c.startsWith(word)).map((c) => ({ name: c, display: c, desc: '-- ' + CMDS[c], kind: 'cmd' }));
const optItems = (list, word) =>
  list.filter((x) => x.startsWith(word)).map((x) => ({ name: x, display: x, desc: '', kind: 'opt' }));

/**
 * Completions for the last word of `input`: commands, flags, fixed values or
 * paths in `fs` relative to `cwd`. `mode` is 'cmd' (one per row, with
 * descriptions) or 'grid'.
 */
export function candidates(input, { fs, cwd }) {
  const parts = input.split(' ');
  const word = parts[parts.length - 1];
  const before = parts.slice(0, -1).join(' ') + (parts.length > 1 ? ' ' : '');
  const result = (mode, items) => ({ before, word, mode, items });
  if (parts.length === 1) return result('cmd', cmdItems(word));

  let cmd = parts[0];
  if (ALIASES[cmd]) cmd = ALIASES[cmd];
  if (word.startsWith('-')) {
    const m = MAN[cmd];
    const fl = (m && m.opts ? m.opts.map((o) => o[0]).filter((f) => f.startsWith('-') && f.length > 1) : []).concat(
      '--help',
    );
    return result('grid', optItems(fl, word));
  }
  if ((cmd === 'man' || cmd === 'help') && parts.length === 2) return result('cmd', cmdItems(word));

  const prevW = parts[parts.length - 2];
  let flagOpts = null;
  if (cmd === 'whoami') {
    if (parts.length === 2) flagOpts = ['--focus'];
    else if (prevW === '--focus') flagOpts = ['embedded', 'software'];
  } else if (cmd === 'mail') {
    if (parts.length === 2) flagOpts = ['--to'];
    else if (prevW === '--to') flagOpts = ['volempdoge'];
  }
  if (flagOpts) return result('grid', optItems(flagOpts, word));

  const fixed = {
    focus: ['embedded', 'software'],
    theme: ['dark', 'light', 'night'],
    lang: ['en', 'ua'],
    open: SECTION_IDS,
  }[cmd];
  if (fixed) return result('grid', optItems(fixed, word));
  if (!PATH_CMDS.includes(cmd)) return result('grid', []);

  const idx = word.lastIndexOf('/');
  const dirPart = idx >= 0 ? word.slice(0, idx + 1) : '';
  const base = idx >= 0 ? word.slice(idx + 1) : word;
  const node = nodeAt(fs, resolve(cwd, dirPart || '.'));
  if (!node || node.type !== 'dir') return result('grid', []);
  const items = sortedEntries(node, base.startsWith('.'))
    .filter((n) => n.startsWith(base))
    .filter((n) => cmd !== 'cd' || node.children[n].type === 'dir')
    .map((n) => {
      const isDir = node.children[n].type === 'dir';
      return {
        name: dirPart + n + (isDir ? '/' : ''),
        display: n + (isDir ? '/' : ''),
        desc: '',
        kind: isDir ? 'dir' : n.startsWith('.') ? 'dot' : 'file',
      };
    });
  return result('grid', items);
}

/** The ghost text after the cursor: the newest matching history entry, else a command name. */
export function suggestion(input, history) {
  if (!input) return '';
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i];
    if (h.startsWith(input) && h !== input) return h.slice(input.length);
  }
  if (!input.includes(' ')) {
    const c = CMD_NAMES.find((x) => x.startsWith(input) && x !== input);
    if (c) return c.slice(input.length);
  }
  return '';
}

/** Colour segments for the prompt input: known commands green, unknown red, existing paths underlined. */
export function highlight(input, { fs, cwd, hint, ghost }) {
  if (!input) return [{ text: hint, color: 'var(--text-disabled)', deco: 'none' }];
  const segs = [];
  const re = /(\s+)|(\S+)/g;
  let m;
  let first = true;
  let cmd = null;
  while ((m = re.exec(input))) {
    if (m[1]) {
      segs.push({ text: m[1], color: 'inherit', deco: 'none' });
      continue;
    }
    const w = m[2];
    if (first) {
      const ok = CMDS[w] || ALIASES[w];
      cmd = ALIASES[w] || w;
      segs.push({ text: w, color: ok ? 'var(--success)' : 'var(--danger)', deco: 'none' });
      first = false;
    } else if (w.startsWith('-')) segs.push({ text: w, color: 'var(--text-muted)', deco: 'none' });
    else {
      const exists = PATH_CMDS.includes(cmd) && nodeAt(fs, resolve(cwd, w));
      segs.push({ text: w, color: 'var(--text-body)', deco: exists ? 'underline' : 'none' });
    }
  }
  if (ghost) segs.push({ text: ghost, color: 'var(--text-disabled)', deco: 'none' });
  return segs;
}
