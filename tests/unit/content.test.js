import { describe, expect, it, vi } from 'vitest';
import { TEXT, cvFor, expDuration } from '../../src/content.js';
import { commonPrefix, fuzzy } from '../../src/lib/fuzzy.js';
import { palItems, palModel } from '../../src/palette.js';

describe('expDuration', () => {
  it('counts whole months since October 2023', () => {
    expect(expDuration('en', new Date(2023, 9, 15))).toBe('');
    expect(expDuration('en', new Date(2024, 2, 1))).toBe('5m');
    expect(expDuration('en', new Date(2026, 9, 4))).toBe('3y');
    expect(expDuration('en', new Date(2026, 11, 1))).toBe('3y 2m');
    expect(expDuration('ua', new Date(2026, 11, 1))).toBe('3 р 2 міс');
  });
});

describe('cvFor', () => {
  it('orders points and skills by focus, and hides coursework for software', () => {
    const emb = cvFor('en', 'embedded');
    const sw = cvFor('en', 'software');
    expect(emb.points.map((p) => p.h)[0]).toBe('Test rigs for hardware components.');
    expect(sw.points).toHaveLength(3);
    expect(emb.skills.map((s) => s.key)).toEqual(['emb', 'lang', 'hw', 'tools']);
    expect(sw.skills.map((s) => s.key)).toEqual(['lang', 'tools', 'emb']);
    expect(emb.edu[0].courses).toHaveLength(3);
    expect(sw.edu[0].courses).toEqual([]);
  });

  it('has the same keys in both languages', () => {
    const keys = (o) =>
      Object.keys(o)
        .sort()
        .flatMap((k) =>
          o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) ? [k, ...keys(o[k]).map((x) => k + '.' + x)] : [k],
        );
    expect(keys(TEXT.ua)).toEqual(keys(TEXT.en));
  });
});

describe('fuzzy', () => {
  it('matches subsequences and prefers word starts', () => {
    expect(fuzzy('xyz', 'skills')).toBeNull();
    expect(fuzzy('sk', 'skills').hits).toEqual([0, 1]);
    expect(fuzzy('tl', 'theme: light').score).toBeGreaterThan(fuzzy('tl', 'theme: dark mode tile').score);
  });

  it('finds the common prefix', () => {
    expect(commonPrefix(['projects/', 'proj', 'pro'])).toBe('pro');
    expect(commonPrefix([])).toBe('');
  });
});

describe('palette', () => {
  const act = new Proxy({}, { get: () => vi.fn() });
  const items = palItems({ lang: 'en', theme: 'dark', role: 'embedded', termVisible: false }, act);

  it('groups everything, recent first, when the query is empty', () => {
    const m = palModel('', { lang: 'en', items, recent: ['th-night'], runInTerminal: vi.fn() });
    expect(m.grouped).toBe(true);
    expect(m.items[0]).toMatchObject({ id: 'r-th-night', baseId: 'th-night', group: 'recent' });
    expect(m.items).toHaveLength(items.length + 1);
  });

  it('ranks fuzzy matches by label', () => {
    const m = palModel('educ', { lang: 'en', items, recent: [], runInTerminal: vi.fn() });
    expect(m.grouped).toBe(false);
    expect(m.items[0].id).toBe('go-education');
  });

  it('offers terminal commands after >', () => {
    const run = vi.fn();
    const m = palModel('> ls -la', { lang: 'en', items, recent: [], runInTerminal: run });
    expect(m.items[0]).toMatchObject({ id: 'run', label: 'ls -la' });
    m.items[0].run();
    expect(run).toHaveBeenCalledWith('ls -la');
  });
});
