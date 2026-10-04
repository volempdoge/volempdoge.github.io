import { EMAIL, GITHUB_URL, LINKEDIN_URL, SECTION_FILES, SECTION_IDS, TEXT, expDuration } from '../content.js';
import { ALIASES, CMDS, MAN } from './commands.js';
import {
  CV_DIR,
  HOME,
  buildFs,
  entryColor,
  fileSize,
  label,
  nodeAt,
  resolve,
  sectionOf,
  sortedEntries,
  treeLines,
} from './fs.js';

const E = (text) => ({ kind: 'err', text });
const O = (text) => ({ kind: 'ok', text });
const D = (text) => ({ kind: 'dim', text });

// Page effects run a beat after the output is printed, so the line is seen first.
const later = (fn, ms) => setTimeout(fn, ms);

export function usage(cmd, name) {
  const m = MAN[cmd];
  if (!m) return [E((name || cmd) + ': no help available')];
  return [
    {
      kind: 'segs',
      segs: [
        { text: 'usage: ', color: 'var(--text-subtle)' },
        { text: m.syn, color: 'var(--text-heading)' },
      ],
    },
    m.desc,
    ...(m.opts ? m.opts.map((o) => '  ' + o[0].padEnd(8, ' ') + o[1]) : []),
    D('see: man ' + cmd),
  ];
}

export function manPage(cmd) {
  const m = MAN[cmd];
  const up = cmd.toUpperCase() + '(1)';
  const H = (x) => ({ kind: 'segs', segs: [{ text: x, color: 'var(--text-heading)' }] });
  const I = '       ';
  let out = [
    D(up + '    v2OS manual    ' + up),
    '',
    H('NAME'),
    I + cmd + ' · ' + CMDS[cmd],
    '',
    H('SYNOPSIS'),
    { kind: 'segs', segs: [{ text: I }, { text: m.syn, color: 'var(--accent)' }] },
    '',
    H('DESCRIPTION'),
    I + m.desc,
  ];
  if (m.opts) {
    out = out.concat(
      ['', H('OPTIONS')],
      m.opts.map((o) => ({
        kind: 'segs',
        segs: [
          { text: I },
          { text: o[0].padEnd(8, ' '), color: 'var(--accent)' },
          { text: o[1], color: 'var(--text-body)' },
        ],
      })),
    );
  }
  out = out.concat(['', H('HELP'), I + cmd + ' --help']);
  if (m.ex) {
    out = out.concat(
      ['', H('EXAMPLES')],
      m.ex.map((x) => ({
        kind: 'segs',
        segs: [
          { text: I + '$ ', color: 'var(--text-subtle)' },
          { text: x, color: 'var(--text-body)' },
        ],
      })),
    );
  }
  if (m.alias) out = out.concat(['', H('ALIASES'), I + m.alias]);
  return out;
}

function browserName(ua) {
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Edg\//.test(ua)) return 'edge';
  if (/Chrome\//.test(ua)) return 'chrome';
  if (/Safari\//.test(ua)) return 'safari';
  return 'browser';
}

const HELP = [
  D('navigation'),
  '  man <command>       manual page, or <command> --help',
  '  ls [-la] [path]     list directory',
  '  cd <path>           change directory, scrolls the page',
  '  cat <file>          print a file, scrolls the page',
  '  tree [path]         show directory tree',
  '  open <section>      scroll the page to a section',
  D('settings'),
  '  focus <embedded|software> · theme <dark|light|night> · lang <en|ua>',
  D('contact'),
  '  mail --to volempdoge · email · github · linkedin · pdf',
  D('system'),
  '  whoami [--focus] · neofetch · pwd · date · uptime · echo · history',
  '  max · min · clear · exit',
  D('keys'),
  '  tab complete · → accept suggestion · ↑↓ history · ctrl+c cancel · ctrl+l clear',
];

/**
 * Runs one command line. Returns the lines to print, or 'clear'.
 *
 * `env` is the shell state: { lang, role, theme, cwd, prevCwd, history,
 * termMax, now, ua, viewport: { w, h } } and `act`, the page actions:
 * { goTo, setRole, setTheme, setLang, setCwd, copyEmail, openUrl, mailto,
 * print, close, toggleMax, minimize, clearHistory }.
 *
 * Lines are strings or { kind: 'out' | 'err' | 'ok' | 'dim', text },
 * { kind: 'segs', segs: [{ text, color }] } or { kind: 'fetch', info }.
 */
export function exec(raw, env) {
  const { act } = env;
  const t = TEXT[env.lang];
  const words = raw.trim().split(/\s+/).filter(Boolean);
  let cmd = words[0];
  if (ALIASES[cmd]) cmd = ALIASES[cmd];
  const args = words.slice(1);
  const flags = args.filter((a) => a.startsWith('-')).join('');
  const paths = args.filter((a) => !a.startsWith('-'));
  const arg = args[0];
  const fs = buildFs(env);
  const at = (p) => nodeAt(fs, resolve(env.cwd, p));

  if (cmd && (args.includes('--help') || (args.includes('-h') && cmd !== 'ls'))) return usage(cmd, words[0]);

  switch (cmd) {
    case 'man': {
      if (!arg) return [E('What manual page do you want?'), D('try: man ls')];
      const c = ALIASES[arg] || arg;
      return MAN[c] ? manPage(c) : [E('No manual entry for ' + arg)];
    }
    case 'help': {
      if (!arg) return HELP;
      const c = ALIASES[arg] || arg;
      return MAN[c] ? usage(c, arg) : [E('help: no help topics match ' + arg)];
    }
    case 'whoami': {
      const fi = args.indexOf('--focus');
      if (fi < 0) return [t.name + ', ' + t.titles[env.role].toLowerCase()];
      const v = args[fi + 1];
      if (!v) return [env.role];
      if (v !== 'embedded' && v !== 'software') return [E('whoami: --focus embedded | software')];
      if (v !== env.role) later(() => act.setRole(v), 200);
      return [t.name + ', ' + t.titles[v].toLowerCase()];
    }
    case 'mail': {
      const ti = args.indexOf('--to');
      const to = ti >= 0 ? args[ti + 1] : 'volempdoge';
      if (to !== 'volempdoge' && to !== EMAIL) {
        return [E('mail: unknown recipient: ' + (to || '')), D('try: mail --to volempdoge')];
      }
      act.mailto();
      return [O('→ mailto:' + EMAIL)];
    }
    case 'pdf':
      later(act.print, 150);
      return [O('→ print dialog · save as pdf')];
    case 'neofetch':
    case 'fastfetch':
    case 'fetch':
      return [
        {
          kind: 'fetch',
          info: [
            ['os', 'v2OS'],
            ['host', 'volempdoge.github.io'],
            ['kernel', 'chromium'],
            ['focus', env.role],
            ['uptime', expDuration(env.lang, env.now)],
            ['shell', 'zsh'],
            ['terminal', browserName(env.ua || '') + ' ' + env.viewport.w + '×' + env.viewport.h],
            ['theme', env.theme],
            ['locale', env.lang === 'ua' ? 'uk_UA.UTF-8' : 'en_US.UTF-8'],
          ],
        },
      ];
    case 'pwd':
      return ['/' + env.cwd.join('/')];
    case 'ls':
      return ls(words[0], flags, paths, at);
    case 'cd': {
      let target;
      if (!arg || arg === '~') target = HOME.slice();
      else if (arg === '-') {
        if (!env.prevCwd) return [E('cd: no previous directory')];
        target = env.prevCwd;
      } else target = resolve(env.cwd, arg);
      const node = nodeAt(fs, target);
      if (!node) return [E('cd: no such file or directory: ' + arg)];
      if (node.type !== 'dir') return [E('cd: not a directory: ' + arg)];
      act.setCwd(target);
      const sec = sectionOf(target);
      if (sec) later(() => act.goTo(sec), 120);
      return arg === '-' ? [label(target)] : [];
    }
    case 'cat': {
      if (!paths.length) return [E('usage: cat <file>')];
      const out = [];
      paths.forEach((p) => {
        let node = at(p);
        const bare = p.replace(/\/$/, '');
        if ((!node || node.type === 'dir') && SECTION_IDS.includes(bare) && SECTION_FILES[bare]) {
          node = nodeAt(fs, CV_DIR.concat(SECTION_FILES[bare]));
        }
        if (!node) return out.push(E('cat: ' + p + ': No such file or directory'));
        if (node.type === 'dir') return out.push(E('cat: ' + p + ': Is a directory'));
        const sec =
          paths.length === 1 &&
          Object.keys(SECTION_FILES).find((k) => nodeAt(fs, CV_DIR.concat(SECTION_FILES[k])) === node);
        if (sec) later(() => act.goTo(sec), 120);
        out.push(...node.lines);
      });
      return out;
    }
    case 'tree': {
      const node = at(paths[0] || '.');
      if (!node) return [E('tree: ' + paths[0] + ': No such file or directory')];
      if (node.type !== 'dir') return [paths[0]];
      return treeLines(node, '', [{ kind: 'segs', segs: [{ text: paths[0] || '.', color: 'var(--accent)' }] }]);
    }
    case 'date':
      return [env.now.toLocaleString(env.lang === 'ua' ? 'uk-UA' : 'en-GB')];
    case 'uptime':
      return ['up ' + expDuration(env.lang, env.now) + ', since oct 2023'];
    case 'echo':
      return [
        args
          .join(' ')
          .replace(/\$FOCUS/g, env.role)
          .replace(/\$USER/g, 'volempdoge')
          .replace(/\$HOME/g, '/home/volempdoge'),
      ];
    case 'history':
      if (flags.includes('c')) {
        act.clearHistory();
        return [O('✓ history cleared')];
      }
      return env.history.map((x, i) => String(i + 1).padStart(4, ' ') + '  ' + x);
    case 'sudo':
      return [E('volempdoge is not in the sudoers file. This incident will be reported.')];
    case 'clear':
      return 'clear';
    case 'exit':
      later(act.close, 150);
      return [O('→ exit')];
    case 'max':
      act.toggleMax();
      return [O(env.termMax ? '✓ restore' : '✓ maximize')];
    case 'min':
      later(act.minimize, 150);
      return [O('✓ minimize')];
    case 'email':
      act.copyEmail();
      return [O('✓ ' + EMAIL)];
    case 'github':
    case 'linkedin': {
      const url = cmd === 'github' ? GITHUB_URL : LINKEDIN_URL;
      act.openUrl(url);
      return [O('→ ' + url)];
    }
    case 'focus':
      if (!arg) return [env.role];
      if (arg === 'embedded' || arg === 'software') {
        later(() => act.setRole(arg), 200);
        return [O('✓ focus ' + arg)];
      }
      return [E('focus: embedded | software')];
    case 'open': {
      if (!arg) {
        later(() => act.goTo('about'), 120);
        return [O('→ about')];
      }
      const id = arg.replace(/\/$/, '');
      if (SECTION_IDS.includes(id)) {
        later(() => act.goTo(id), 120);
        return [O('→ ' + id)];
      }
      return [E('open: no such section: ' + arg)];
    }
    case 'theme':
      if (!arg) return [env.theme];
      if (['night', 'dark', 'light'].includes(arg)) {
        act.setTheme(arg);
        return [O('✓ theme ' + arg)];
      }
      return [E('theme: dark | light | night')];
    case 'lang':
      if (!arg) return [env.lang];
      if (['en', 'ua'].includes(arg)) {
        later(() => act.setLang(arg), 200);
        return [O('✓ lang ' + arg)];
      }
      return [E('lang: en | ua')];
    default:
      return [E(t.notFound + words[0])];
  }
}

function ls(invoked, flags, paths, at) {
  const all = flags.includes('a') || invoked === 'la' || invoked === 'll';
  const long = flags.includes('l') || invoked === 'll';
  const targets = paths.length ? paths : ['.'];
  const out = [];
  targets.forEach((p, ti) => {
    const node = at(p);
    if (!node) return out.push(E("ls: cannot access '" + p + "': No such file or directory"));
    if (targets.length > 1) out.push(D(p + ':'));
    if (node.type === 'file') {
      return out.push({ kind: 'segs', segs: [{ text: p.split('/').pop(), color: 'var(--text-body)' }] });
    }
    const names = sortedEntries(node, all);
    if (long) {
      names.forEach((n) => {
        const c = node.children[n];
        const isDir = c.type === 'dir';
        out.push({
          kind: 'segs',
          segs: [
            {
              text:
                (isDir ? 'drwxr-xr-x' : '-rw-r--r--') +
                '  volempdoge  ' +
                (isDir ? '4.0K' : fileSize(c)).padStart(4, ' ') +
                '  ',
              color: 'var(--text-subtle)',
            },
            { text: n + (isDir ? '/' : ''), color: entryColor(n, c) },
          ],
        });
      });
    } else if (names.length) {
      const segs = [];
      names.forEach((n, i) => {
        const c = node.children[n];
        if (i) segs.push({ text: '  ', color: 'inherit' });
        segs.push({ text: n + (c.type === 'dir' ? '/' : ''), color: entryColor(n, c) });
      });
      out.push({ kind: 'segs', segs });
    }
    if (ti < targets.length - 1) out.push('');
  });
  return out;
}
