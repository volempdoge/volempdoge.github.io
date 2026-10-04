import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { candidates, highlight, suggestion } from '../../src/shell/complete.js';
import { exec, manPage, usage } from '../../src/shell/exec.js';
import { CV_DIR, HOME, buildFs, label, nodeAt, resolve, sectionOf, sortedEntries } from '../../src/shell/fs.js';
import { CMD_NAMES, MAN } from '../../src/shell/commands.js';

const NOW = new Date('2026-10-04T12:00:00Z');

function makeEnv(over = {}) {
  const act = {
    goTo: vi.fn(),
    setRole: vi.fn(),
    setTheme: vi.fn(),
    setLang: vi.fn(),
    setCwd: vi.fn(),
    copyEmail: vi.fn(),
    openUrl: vi.fn(),
    mailto: vi.fn(),
    print: vi.fn(),
    close: vi.fn(),
    toggleMax: vi.fn(),
    minimize: vi.fn(),
    clearHistory: vi.fn(),
  };
  return {
    lang: 'en',
    role: 'embedded',
    theme: 'dark',
    cwd: CV_DIR,
    prevCwd: null,
    history: [],
    termMax: false,
    now: NOW,
    ua: 'Mozilla/5.0 Chrome/140.0',
    viewport: { w: 1280, h: 800 },
    act,
    ...over,
  };
}

const texts = (lines) => lines.map((l) => (typeof l === 'string' ? l : (l.text ?? l.segs.map((s) => s.text).join(''))));

describe('fs', () => {
  const fs = buildFs({ lang: 'en', role: 'embedded', now: NOW });

  it('resolves relative, home, absolute and parent paths', () => {
    expect(resolve(CV_DIR, 'projects')).toEqual([...CV_DIR, 'projects']);
    expect(resolve(CV_DIR, '..')).toEqual(HOME);
    expect(resolve(CV_DIR, '~')).toEqual(HOME);
    expect(resolve(CV_DIR, '~/cv/./projects/')).toEqual([...CV_DIR, 'projects']);
    expect(resolve(CV_DIR, '/home')).toEqual(['home']);
  });

  it('labels paths like a shell prompt', () => {
    expect(label(HOME)).toBe('~');
    expect(label(CV_DIR)).toBe('~/cv');
    expect(label(['home'])).toBe('/home');
    expect(label([])).toBe('/');
  });

  it('maps directories under ~/cv to page sections', () => {
    expect(sectionOf([...CV_DIR, 'projects'])).toBe('projects');
    expect(sectionOf(CV_DIR)).toBeNull();
  });

  it('lists directories first and hides dotfiles unless asked', () => {
    expect(sortedEntries(nodeAt(fs, HOME), false)).toEqual(['cv']);
    expect(sortedEntries(nodeAt(fs, HOME), true)).toEqual(['cv', '.zshrc']);
    expect(sortedEntries(nodeAt(fs, CV_DIR), false)[0]).toBe('projects');
  });

  it('shows the KSE project only in the software focus', () => {
    const emb = nodeAt(fs, [...CV_DIR, 'projects']);
    const sw = nodeAt(buildFs({ lang: 'en', role: 'software', now: NOW }), [...CV_DIR, 'projects']);
    expect(Object.keys(emb.children)).toEqual(['betaflight-osd-fonts.md']);
    expect(Object.keys(sw.children)).toEqual(['betaflight-osd-fonts.md', 'kse-club-site.md']);
  });
});

describe('exec', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('documents every command in help, man and usage', () => {
    for (const c of CMD_NAMES) {
      expect(MAN[c], c).toBeDefined();
      expect(texts(manPage(c))[0]).toContain(c.toUpperCase() + '(1)');
      expect(texts(usage(c))[0]).toBe('usage: ' + MAN[c].syn);
    }
    expect(texts(exec('help', makeEnv())).join('\n')).toContain('man <command>');
    expect(texts(exec('ls --help', makeEnv()))[0]).toBe('usage: ' + MAN.ls.syn);
  });

  it('reports unknown commands like zsh', () => {
    expect(exec('frobnicate', makeEnv())).toEqual([{ kind: 'err', text: 'zsh: command not found: frobnicate' }]);
  });

  it('lists the cv directory, long and short', () => {
    expect(texts(exec('ls', makeEnv()))).toEqual(['projects/  contact.txt  edu.log  README.md  skills.txt  work.log']);
    const long = texts(exec('ll ~', makeEnv()));
    expect(long[0]).toMatch(/^drwxr-xr-x {2}volempdoge {2}4.0K {2}cv\/$/);
    expect(long[1]).toMatch(/\.zshrc$/);
    expect(texts(exec('ls nope', makeEnv()))).toEqual(["ls: cannot access 'nope': No such file or directory"]);
  });

  it('changes directory and scrolls to the section', () => {
    const env = makeEnv();
    expect(exec('cd projects', env)).toEqual([]);
    expect(env.act.setCwd).toHaveBeenCalledWith([...CV_DIR, 'projects']);
    vi.runAllTimers();
    expect(env.act.goTo).toHaveBeenCalledWith('projects');
    expect(texts(exec('cd README.md', makeEnv()))).toEqual(['cd: not a directory: README.md']);
    expect(texts(exec('cd -', makeEnv()))).toEqual(['cd: no previous directory']);
    expect(texts(exec('cd -', makeEnv({ prevCwd: HOME })))).toEqual(['~']);
  });

  it('prints a section file, by name or section, and scrolls to it', () => {
    const env = makeEnv();
    const out = texts(exec('cat skills', env));
    expect(out[0]).toBe('embedded: STM32, ESP32, FreeRTOS, LoRa, SWD/JTAG');
    vi.runAllTimers();
    expect(env.act.goTo).toHaveBeenCalledWith('skills');
    expect(texts(exec('cat work.log', makeEnv()))[0]).toBe('oct 2023 → now · 3y');
    expect(texts(exec('cat projects', makeEnv()))).toEqual(['cat: projects: Is a directory']);
  });

  it('switches focus, theme and language through the page actions', () => {
    const env = makeEnv();
    expect(texts(exec('focus software', env))).toEqual(['✓ focus software']);
    expect(texts(exec('theme night', env))).toEqual(['✓ theme night']);
    expect(texts(exec('lang ua', env))).toEqual(['✓ lang ua']);
    expect(env.act.setTheme).toHaveBeenCalledWith('night');
    vi.runAllTimers();
    expect(env.act.setRole).toHaveBeenCalledWith('software');
    expect(env.act.setLang).toHaveBeenCalledWith('ua');
    expect(texts(exec('theme pink', env))).toEqual(['theme: dark | light | night']);
    expect(texts(exec('whoami', env))).toEqual(['Volodymyr Myronenko, embedded engineer']);
  });

  it('expands variables in echo and keeps history', () => {
    const env = makeEnv({ role: 'software', history: ['ls', 'pwd'] });
    expect(exec('echo $USER is $FOCUS', env)).toEqual(['volempdoge is software']);
    expect(exec('history', env)).toEqual(['   1  ls', '   2  pwd']);
    exec('history -c', env);
    expect(env.act.clearHistory).toHaveBeenCalled();
    expect(exec('clear', env)).toBe('clear');
  });

  it('describes the browser in neofetch', () => {
    const [line] = exec('neofetch', makeEnv());
    expect(line.kind).toBe('fetch');
    expect(Object.fromEntries(line.info)).toMatchObject({
      terminal: 'chrome 1280×800',
      focus: 'embedded',
      theme: 'dark',
    });
  });
});

describe('completion', () => {
  const ctx = { fs: buildFs({ lang: 'en', role: 'embedded', now: NOW }), cwd: CV_DIR };

  it('completes commands, flags, fixed values and paths', () => {
    expect(candidates('he', ctx).items.map((i) => i.name)).toEqual(['help']);
    expect(candidates('ls -', ctx).items.map((i) => i.name)).toEqual(['-l', '-a', '-la', '--help']);
    expect(candidates('theme ', ctx).items.map((i) => i.name)).toEqual(['dark', 'light', 'night']);
    expect(candidates('whoami --focus s', ctx).items.map((i) => i.name)).toEqual(['software']);
    expect(candidates('cat s', ctx).items.map((i) => i.name)).toEqual(['skills.txt']);
    expect(candidates('cd ', ctx).items.map((i) => i.name)).toEqual(['projects/']);
    expect(candidates('cat projects/b', ctx).items.map((i) => i.name)).toEqual(['projects/betaflight-osd-fonts.md']);
  });

  it('suggests from history first, then command names', () => {
    expect(suggestion('ca', ['cat edu.log'])).toBe('t edu.log');
    expect(suggestion('neo', [])).toBe('fetch');
    expect(suggestion('', ['ls'])).toBe('');
  });

  it('colours known and unknown commands and underlines existing paths', () => {
    const segs = highlight('cat work.log', { ...ctx, hint: 'try: help', ghost: '' });
    expect(segs[0]).toMatchObject({ text: 'cat', color: 'var(--success)' });
    expect(segs[2]).toMatchObject({ text: 'work.log', deco: 'underline' });
    expect(highlight('nope', { ...ctx, hint: '', ghost: '' })[0].color).toBe('var(--danger)');
    expect(highlight('', { ...ctx, hint: 'try: help', ghost: '' })[0].text).toBe('try: help');
  });
});
