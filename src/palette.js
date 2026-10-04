import { SECTION_ICONS, SECTION_IDS, TEXT } from './content.js';
import { fuzzy } from './lib/fuzzy.js';
import { CMDS, CMD_NAMES } from './shell/commands.js';

/**
 * Every palette entry. `act` holds the page actions: goTo, setRole, copyLink,
 * setTheme, setLang, toggleTerm, runInTerminal, print, copyEmail, openUrl.
 */
export function palItems({ lang, theme, role, termVisible }, act) {
  const t = TEXT[lang];
  return [
    ...SECTION_IDS.map((id, i) => ({
      id: 'go-' + id,
      group: t.palGo,
      label: t.nav[id],
      keywords: id + ' section',
      icon: SECTION_ICONS[id],
      kbd: [String(i + 1)],
      run: () => act.goTo(id),
    })),
    ...['embedded', 'software'].map((r) => ({
      id: 'f-' + r,
      group: t.palFocus,
      label: t.titles[r],
      keywords: 'focus role ' + r,
      icon: r === 'embedded' ? 'memory' : 'code',
      hint: role === r ? '●' : '',
      run: () => act.setRole(r),
    })),
    { id: 'cl', group: t.palFocus, label: t.copyLink, keywords: 'share url link', icon: 'link', run: act.copyLink },
    ...['dark', 'light', 'night'].map((x) => ({
      id: 'th-' + x,
      group: t.palLook,
      label: t.themeLabel + ': ' + x,
      keywords: 'theme color mode',
      icon: { night: 'bedtime', dark: 'dark_mode', light: 'light_mode' }[x],
      hint: theme === x ? '●' : '',
      run: () => act.setTheme(x),
    })),
    {
      id: 'l-en',
      group: t.palLang,
      label: t.langLabel,
      keywords: 'language en',
      icon: 'language',
      hint: lang === 'en' ? '●' : '',
      run: () => act.setLang('en'),
    },
    {
      id: 'l-ua',
      group: t.palLang,
      label: t.langLabelUa,
      keywords: 'language ua мова',
      icon: 'language',
      hint: lang === 'ua' ? '●' : '',
      run: () => act.setLang('ua'),
    },
    {
      id: 'term',
      group: t.palTerm,
      label: t.termToggle,
      keywords: 'terminal shell zsh console',
      icon: 'terminal',
      hint: termVisible ? '●' : '',
      kbd: ['`'],
      run: () => setTimeout(act.toggleTerm, 0),
    },
    {
      id: 'fetch',
      group: t.palTerm,
      label: t.fetchLabel,
      keywords: 'neofetch fastfetch system',
      icon: 'monitor',
      run: () => act.runInTerminal('neofetch'),
    },
    {
      id: 'pdf',
      group: t.palAct,
      label: t.pdfCta,
      keywords: 'pdf print download save cv resume',
      icon: 'download',
      kbd: ['⌘', 'P'],
      run: () => setTimeout(act.print, 120),
    },
    { id: 'cp', group: t.palAct, label: t.copy, keywords: 'email mail copy', icon: 'content_copy', run: act.copyEmail },
    {
      id: 'gh',
      group: t.palAct,
      label: 'github',
      keywords: 'code repo',
      icon: 'open_in_new',
      run: () => act.openUrl('https://github.com/volempdoge'),
    },
    {
      id: 'li',
      group: t.palAct,
      label: 'linkedin',
      keywords: 'profile',
      icon: 'open_in_new',
      run: () => act.openUrl('https://linkedin.com/in/volempdoge'),
    },
  ];
}

const plain = (label) => [{ text: label, color: 'inherit', weight: 'inherit' }];

/** Label split into runs, with the fuzzy hits in the accent colour. */
export function highlightHits(label, hits) {
  if (!hits) return plain(label);
  const set = new Set(hits);
  const out = [];
  for (let i = 0; i < label.length; i++) {
    const hit = set.has(i);
    const last = out[out.length - 1];
    if (last && last.hit === hit) last.text += label[i];
    else out.push({ text: label[i], hit, color: hit ? 'var(--accent)' : 'inherit', weight: hit ? 600 : 'inherit' });
  }
  return out;
}

/**
 * What the palette lists for `query`: everything grouped (recent first) when
 * empty, terminal commands after '>', and fuzzy-ranked results otherwise.
 */
export function palModel(query, { lang, items, recent, runInTerminal }) {
  const t = TEXT[lang];
  const q = query.trim();
  if (q.startsWith('>')) {
    const cmd = q.slice(1).trim();
    const first = cmd.split(/\s+/)[0] || '';
    const out = [];
    if (cmd) {
      out.push({
        id: 'run',
        group: t.palRunIn,
        label: cmd,
        icon: 'terminal',
        segs: plain(cmd),
        kbd: ['↵'],
        run: () => runInTerminal(cmd),
      });
    }
    CMD_NAMES.filter((c) => c.startsWith(first) && c !== cmd)
      .slice(0, 8)
      .forEach((c) =>
        out.push({
          id: 'cmd-' + c,
          group: t.palRunIn,
          label: c,
          icon: 'chevron_right',
          segs: highlightHits(c, first ? Array.from({ length: first.length }, (_, i) => i) : null),
          hint: CMDS[c],
          run: () => runInTerminal(c),
        }),
      );
    return { grouped: true, items: out };
  }
  if (!q) {
    const recentItems = recent
      .map((id) => items.find((x) => x.id === id))
      .filter(Boolean)
      .slice(0, 4)
      .map((x) => ({ ...x, id: 'r-' + x.id, baseId: x.id, group: t.palRecent, icon: 'history' }));
    return { grouped: true, items: recentItems.concat(items).map((x) => ({ ...x, segs: plain(x.label) })) };
  }
  const scored = [];
  items.forEach((x) => {
    const m = fuzzy(q, x.label);
    if (m) {
      scored.push({ ...x, score: m.score + 2, segs: highlightHits(x.label, m.hits), hint: x.hint || x.group });
      return;
    }
    const m2 = fuzzy(q, x.label + ' ' + (x.keywords || '') + ' ' + x.group);
    if (m2) scored.push({ ...x, score: m2.score - 4, segs: plain(x.label), hint: x.hint || x.group });
  });
  scored.sort((a, b) => b.score - a.score);
  return { grouped: false, items: scored };
}
