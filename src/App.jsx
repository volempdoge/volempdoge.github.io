import { Component, createRef } from 'react';
import { DEFAULTS, EMAIL, PAGES, ROLES, SECTION_IDS, TEXT, THEMES, cvFor, expDuration } from './content.js';
import { Button, Icon, Kbd, Prompt, Toast, Window } from './ds/index.js';
import { readJSON, readStore, urlRole, writeJSON, writeStore, writeUrlRole } from './lib/storage.js';
import { TextFx } from './lib/textfx.js';
import { Footer, Header } from './page/Chrome.jsx';
import { About, Contact, Education, Experience, Projects, Skills } from './page/Sections.jsx';
import { TermLine } from './page/TermOutput.jsx';
import { palItems, palModel } from './palette.js';
import { candidates, highlight, suggestion } from './shell/complete.js';
import { exec } from './shell/exec.js';
import { CV_DIR, buildFs, label } from './shell/fs.js';
import { commonPrefix } from './lib/fuzzy.js';

// Terminal window geometry, px. CH_W/CH_H: one character cell, for the size readout.
const TITLEBAR = 34;
const MIN_W = 340;
const MIN_H = 132;
const DEF_W = 520;
const DEF_H = 260;
const CH_W = 7.8;
const CH_H = 22.1;
const NARROW = 820;

// Language / focus switch: 'type' | 'wave' | 'scramble' | 'fade' | 'off'. Theme switch: 'blend' | 'off'.
const LANG_ANIM = 'type';
const LANG_ANIM_MS = 900;
const THEME_ANIM = 'blend';
const THEME_ANIM_MS = 700;

// Registered as <color> so a theme switch can transition them.
const THEME_TOKENS = [
  '--surface-desktop',
  '--surface-window',
  '--surface-window-solid',
  '--surface-titlebar',
  '--surface-raised',
  '--surface-hover',
  '--surface-active',
  '--surface-inset',
  '--surface-overlay',
  '--border-hairline',
  '--border-strong',
  '--border-focus',
  '--text-heading',
  '--text-body',
  '--text-muted',
  '--text-subtle',
  '--text-disabled',
  '--text-on-accent',
  '--text-link',
  '--accent',
  '--accent-hover',
  '--accent-soft',
  '--selection',
  '--success',
  '--warning',
  '--danger',
  '--info',
  '--tl-close',
  '--tl-min',
  '--tl-max',
  '--pattern-dot',
];
let themeTokensReady = null;
function registerThemeTokens() {
  if (themeTokensReady !== null) return themeTokensReady;
  if (!window.CSS || !CSS.registerProperty) return (themeTokensReady = false);
  THEME_TOKENS.forEach((name) => {
    try {
      CSS.registerProperty({ name, syntax: '<color>', inherits: true, initialValue: 'transparent' });
    } catch {
      // already registered
    }
  });
  return (themeTokensReady = true);
}

const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/** Points the address bar, tab title and description at the page for `lang` (/ or /uk/). */
function showPage(lang) {
  const page = PAGES[lang];
  document.documentElement.lang = page.htmlLang;
  document.title = page.title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', page.description);
  try {
    window.history.replaceState(window.history.state, '', page.path + window.location.search + window.location.hash);
  } catch {
    // address bar not updated
  }
}

/**
 * The CV page. Props: `lang` (of the page: / is en, /uk/ is ua), `now` (ISO
 * time of the build) and `commit` ({ sha, url, date } or null). The first
 * render uses DEFAULTS for the rest, so it matches the prerendered HTML; the
 * saved theme and focus are applied once mounted.
 */
export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...DEFAULTS,
      lang: props.lang || DEFAULTS.lang,
      now: new Date(props.now),
      active: 'about',
      roleMenuOpen: false,
      palOpen: false,
      palQuery: '',
      palIndex: 0,
      palRecent: [],
      palPos: null,
      palMin: false,
      palHiding: false,
      palMax: false,
      palDragging: false,
      termOpen: false,
      termClosing: false,
      termMin: false,
      termMax: false,
      termPos: null,
      termW: DEF_W,
      termH: DEF_H,
      dragging: false,
      resizing: false,
      termLines: [],
      termInput: '',
      termMenu: null,
      termHistIdx: -1,
      cwd: CV_DIR,
      prevCwd: null,
      toasts: [],
      top: 'term',
      vh: 800,
      width: 1280,
    };
    this.history = [];
    this.lineId = 0;
    this.toastId = 0;
    this.rootRef = createRef();
    this.roleMenuRef = createRef();
    this.palListRef = createRef();
    this.fx = new TextFx(() => this.rootRef.current);
  }

  termBoxRef = (el) => {
    if (this._termObs) {
      this._termObs.forEach((o) => o.disconnect());
      this._termObs = null;
    }
    this._termBox = el;
    if (!el) return;
    // Keep the newest output in view unless the reader scrolled up.
    this._stick = true;
    el.addEventListener(
      'scroll',
      () => {
        this._stick = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      },
      { passive: true },
    );
    const pin = () => {
      if (this._stick) el.scrollTop = el.scrollHeight;
    };
    const mo = new MutationObserver(pin);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(pin) : null;
    if (ro) ro.observe(el);
    this._termObs = [mo].concat(ro ? [ro] : []);
  };
  termInputRef = (el) => {
    this._termInput = el;
  };
  palInputRef = (el) => {
    this._palInput = el;
  };
  sizeRef = (el) => {
    this._sizeEl = el;
  };

  componentDidMount() {
    registerThemeTokens();
    const theme = readStore('theme', DEFAULTS.theme, THEMES);
    const role = urlRole() || readStore('role', DEFAULTS.role, ROLES);
    this.history = readJSON('hist', []);
    document.documentElement.dataset.theme = theme;
    this.setState(
      {
        theme,
        role,
        palRecent: readJSON('recent', []),
        now: new Date(),
        width: window.innerWidth,
        vh: window.innerHeight,
      },
      () => {
        this.finishBoot();
        this.spy();
      },
    );

    window.addEventListener('beforeprint', this.onBeforePrint);
    window.addEventListener('afterprint', this.onAfterPrint);
    document.addEventListener('pointerdown', this.onDown);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('keydown', this.onKey);

    // Cyrillic subsets load on first use; fetch them early so a switch to ua does not flash.
    const warm = () => {
      if (!document.fonts) return;
      [
        '300 16px "IBM Plex Sans"',
        '400 16px "IBM Plex Sans"',
        '500 16px "IBM Plex Sans"',
        '600 16px "IBM Plex Sans"',
        '400 13px "IBM Plex Mono"',
        '500 13px "IBM Plex Mono"',
      ].forEach((f) => document.fonts.load(f, 'Жї').catch(() => null));
    };
    this._warmT = setTimeout(() => (window.requestIdleCallback || ((f) => setTimeout(f, 300)))(warm), 1500);
  }

  componentWillUnmount() {
    window.removeEventListener('beforeprint', this.onBeforePrint);
    window.removeEventListener('afterprint', this.onAfterPrint);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('keydown', this.onKey);
    document.removeEventListener('pointerdown', this.onDown);
    cancelAnimationFrame(this._spyRaf);
    clearTimeout(this._closeT);
    clearTimeout(this._palT);
    clearTimeout(this._warmT);
    clearTimeout(this._themeT);
    this.fx.stop(false);
    if (this._termObs) this._termObs.forEach((o) => o.disconnect());
    this.endPointer();
  }

  componentDidUpdate(_, prev) {
    const s = this.state;
    if (
      (prev.termLines !== s.termLines ||
        prev.termMenu !== s.termMenu ||
        prev.termH !== s.termH ||
        prev.termMax !== s.termMax) &&
      this._termBox
    ) {
      this.pinTerm();
      if (prev.termMax !== s.termMax) setTimeout(() => this.pinTerm(), 240);
    }
    if (!prev.palOpen && s.palOpen) setTimeout(() => this._palInput && this._palInput.focus(), 0);
    if (prev.palIndex !== s.palIndex || prev.palQuery !== s.palQuery) {
      const l = this.palListRef.current;
      const el = l && l.querySelector('[data-pal-active="true"]');
      if (el) {
        if (el.offsetTop < l.scrollTop + 4) l.scrollTop = el.offsetTop - 30;
        else if (el.offsetTop + el.offsetHeight > l.scrollTop + l.clientHeight) {
          l.scrollTop = el.offsetTop + el.offsetHeight - l.clientHeight + 6;
        }
      }
    }
  }

  /**
   * The inline script in index.html sets <html data-boot> and shows the boot
   * screen when the saved language or focus differs from the prerender. Once
   * they are applied and the fonts are in, the boot screen fades out.
   */
  finishBoot() {
    const de = document.documentElement;
    if (!de.hasAttribute('data-boot')) return;
    const sample = this.state.lang === 'ua' ? 'Aa Жж Її' : 'Aa';
    const faces = [
      '300 16px "IBM Plex Sans"',
      '400 16px "IBM Plex Sans"',
      '500 16px "IBM Plex Sans"',
      '600 16px "IBM Plex Sans"',
      '400 13px "IBM Plex Mono"',
      '500 13px "IBM Plex Mono"',
    ];
    const fontsReady = document.fonts
      ? Promise.all(
          faces
            .map((f) => document.fonts.load(f, sample).catch(() => null))
            .concat(document.fonts.load('400 20px "Material Symbols Outlined"', 'search').catch(() => null)),
        )
      : Promise.resolve();
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(() => {
      const sk = document.querySelector('.cv-boot');
      if (!sk) return de.removeAttribute('data-boot');
      const bar = sk.querySelector('.cv-boot__bar');
      if (bar) {
        const m = getComputedStyle(bar).transform;
        bar.style.animation = 'none';
        bar.style.transform = m === 'none' ? 'scaleX(0)' : m;
        void bar.offsetWidth;
        bar.style.transition = 'transform 160ms cubic-bezier(.2,.7,.2,1)';
        bar.style.transform = 'scaleX(1)';
      }
      setTimeout(() => {
        sk.style.opacity = '0';
        setTimeout(() => de.removeAttribute('data-boot'), 260);
      }, 120);
    });
  }

  onResize = () => this.setState((s) => ({ width: window.innerWidth, vh: window.innerHeight, ...this.fitTerm(s) }));
  onScroll = () => {
    if (this._spyRaf) return;
    this._spyRaf = requestAnimationFrame(() => {
      this._spyRaf = 0;
      this.spy();
    });
  };
  onDown = (e) => {
    this._lastPt = { x: e.clientX, y: e.clientY };
    if (this.state.roleMenuOpen && this.roleMenuRef.current && !this.roleMenuRef.current.contains(e.target)) {
      this.setState({ roleMenuOpen: false });
    }
  };
  onKey = (e) => {
    if (e.key === 'Escape' && this.state.roleMenuOpen) {
      this.setState({ roleMenuOpen: false });
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (this.state.palOpen) this.closePal();
      else this.openPal();
      return;
    }
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '`') {
      e.preventDefault();
      this.toggleTerm();
      return;
    }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= SECTION_IDS.length) this.goTo(SECTION_IDS[n - 1]);
  };

  // ── navigation ──

  goTo = (id) => {
    const el = document.getElementById('cv-' + id);
    if (!el) return;
    const top = id === 'about' ? 0 : el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion() ? 'auto' : 'smooth' });
    this.setState({ active: id });
  };
  goTop = (e) => {
    e.preventDefault();
    this.goTo('about');
  };
  spy() {
    let cur = SECTION_IDS[0];
    const doc = document.documentElement;
    if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) cur = SECTION_IDS[SECTION_IDS.length - 1];
    else {
      for (const id of SECTION_IDS) {
        const el = document.getElementById('cv-' + id);
        if (el && el.getBoundingClientRect().top <= 140) cur = id;
      }
    }
    if (cur !== this.state.active) this.setState({ active: cur });
  }

  // ── settings ──

  setRole = (role) => {
    if (role !== 'embedded' && role !== 'software') return;
    writeStore('role', role);
    writeUrlRole(role);
    if (role === this.state.role) return;
    this.toast({ tone: 'accent', icon: 'check', title: '✓ focus ' + role });
    const mode = reducedMotion() ? 'off' : LANG_ANIM;
    if (mode === 'off') {
      this.setState({ role });
      return;
    }
    const snap = this.fx.snapshot();
    this.setState({ role }, () => this.fx.run(snap, mode === 'fade' ? 'type' : mode, LANG_ANIM_MS, this.state.lang));
  };

  setTheme = (theme) => {
    if (theme === this.state.theme) return;
    writeStore('theme', theme);
    const de = document.documentElement;
    const apply = () => {
      de.dataset.theme = theme;
      this.setState({ theme });
    };
    if (reducedMotion() || THEME_ANIM === 'off' || !registerThemeTokens()) {
      apply();
      return;
    }
    de.style.transition = THEME_TOKENS.map((p) => p + ' ' + THEME_ANIM_MS + 'ms cubic-bezier(.4,0,.2,1)').join(',');
    void de.offsetWidth;
    apply();
    clearTimeout(this._themeT);
    this._themeT = setTimeout(() => {
      de.style.transition = '';
    }, THEME_ANIM_MS + 120);
  };

  setLang = (lang) => {
    if (lang === this.state.lang) return;
    writeStore('lang', lang);
    showPage(lang);
    const mode = reducedMotion() ? 'off' : LANG_ANIM;
    if (mode === 'off') {
      this.fx.stop(true);
      this.setState({ lang });
      return;
    }
    if (mode === 'fade') {
      this.fadeTo({ lang });
      return;
    }
    const snap = this.fx.snapshot();
    this.setState({ lang }, () => this.fx.run(snap, mode, LANG_ANIM_MS, lang));
  };

  fadeTo(update) {
    const el = this.rootRef.current;
    this.fx.stop(true);
    if (!el || !el.animate) {
      this.setState(update);
      return;
    }
    if (this._fadeAnim) this._fadeAnim.cancel();
    const out = el.animate(
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'translateY(3px)' },
      ],
      { duration: LANG_ANIM_MS * 0.4, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' },
    );
    this._fadeAnim = out;
    out.onfinish = () => {
      this.setState(update, () => {
        out.cancel();
        this._fadeAnim = el.animate(
          [
            { opacity: 0, transform: 'translateY(-3px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: LANG_ANIM_MS * 0.6, easing: 'cubic-bezier(0,0,.2,1)' },
        );
      });
    };
  }

  // ── toasts, clipboard ──

  toast = (x) => {
    const id = ++this.toastId;
    const close = () => this.setState((s) => ({ toasts: s.toasts.filter((y) => y.id !== id) }));
    this.setState((s) => ({ toasts: s.toasts.concat({ ...x, id, close }) }));
    setTimeout(close, 3200);
  };
  copyText(text, title, body) {
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    this.toast({ tone: 'accent', icon: 'content_copy', title, body });
  }
  copyEmail = () => {
    const t = TEXT[this.state.lang];
    this.copyText(EMAIL, t.copied, EMAIL + ' ' + t.copiedBody);
  };
  copyLink = () => {
    const t = TEXT[this.state.lang];
    let url = window.location.href;
    try {
      const u = new URL(url);
      u.searchParams.set('role', this.state.role);
      u.hash = '';
      url = u.toString();
    } catch {
      // copy the address as is
    }
    this.copyText(url, t.linkCopied, url);
  };
  openUrl = (url) => window.open(url, '_blank', 'noreferrer');

  // ── print ──

  printPage = () => window.print();
  onBeforePrint = () => {
    const el = document.documentElement;
    if (this._printPrev) return;
    this._printPrev = { theme: el.getAttribute('data-theme'), title: document.title };
    el.setAttribute('data-theme', 'light');
    document.title = 'Volodymyr Myronenko — CV (' + this.state.role + ')';
  };
  onAfterPrint = () => {
    const p = this._printPrev;
    if (!p) return;
    document.documentElement.setAttribute('data-theme', p.theme);
    document.title = p.title;
    this._printPrev = null;
  };
  printNote() {
    const { lang, role, now } = this.state;
    const d = now.toLocaleDateString(lang === 'ua' ? 'uk-UA' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return lang === 'ua'
      ? 'Скорочена версія, згенерована із сайту volempdoge.github.io ' +
          d +
          ' (фокус: ' +
          role +
          '). Повне CV можна отримати в мене: volempdoge@gmail.com.'
      : 'Short version generated from volempdoge.github.io on ' +
          d +
          ' (focus: ' +
          role +
          '). For the full CV, email me at volempdoge@gmail.com.';
  }

  // ── terminal window ──

  fitTerm(s) {
    if (!s.termPos) return {};
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.max(Math.min(s.termW, vw - 16), Math.min(MIN_W, vw - 16));
    const h = Math.max(Math.min(s.termH, vh - TITLEBAR - 16), MIN_H);
    const x = Math.min(Math.max(8, s.termPos.x), vw - w - 8);
    const y = Math.min(Math.max(8, s.termPos.y), Math.max(8, vh - h - TITLEBAR - 8));
    return { termW: w, termH: h, termPos: { x, y } };
  }
  focusTerm() {
    setTimeout(() => this._termInput && this._termInput.focus(), 60);
  }
  focusTermClick = () => {
    if (!window.getSelection().toString() && this._termInput) this._termInput.focus();
  };
  toggleTerm = () => {
    const s = this.state;
    if (s.termOpen && !s.termMin && !s.termClosing) this.closeTerm();
    else this.openTerm();
  };
  openTerm = () => {
    clearTimeout(this._closeT);
    this.setState({ top: 'term' });
    if (this.state.termOpen && this.state.termMin) {
      this.setState({ termMin: false, termClosing: false });
      this.focusTerm();
      return;
    }
    if (this.state.termOpen) {
      this.focusTerm();
      return;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(this.state.termW, vw - 32);
    const h = Math.min(this.state.termH, vh - TITLEBAR - 48);
    const pos = this.state.termPos || { x: vw - w - 24, y: vh - h - TITLEBAR - 24 };
    this.setState((st) => ({
      termOpen: true,
      termMin: false,
      termClosing: false,
      ...this.fitTerm({ ...st, termW: w, termH: h, termPos: pos }),
    }));
    this.focusTerm();
  };
  closeTerm = () => {
    if (!this.state.termOpen || this.state.termClosing) return;
    this.endPointer();
    this.setState({ termClosing: true, termMin: false });
    clearTimeout(this._closeT);
    this._closeT = setTimeout(
      () =>
        this.setState({
          termOpen: false,
          termClosing: false,
          termMax: false,
          termLines: [],
          termInput: '',
          termMenu: null,
          cwd: CV_DIR,
          prevCwd: null,
          termHistIdx: -1,
        }),
      170,
    );
  };
  minimizeTerm = () => {
    if (!this.state.termOpen || this.state.termMin) return;
    this.endPointer();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    this.setState({ termMin: true });
  };
  maximizeTerm = () => {
    this.setState((s) => ({ termMax: !s.termMax, top: 'term' }));
    this.focusTerm();
  };
  onTermDouble = (e) => {
    if (e.target.closest && e.target.closest('.cv-window__bar') && !e.target.closest('button')) this.maximizeTerm();
  };
  resetSize = (e) => {
    e.stopPropagation();
    this.setState((s) => this.fitTerm({ ...s, termW: DEF_W, termH: DEF_H }));
  };
  startDrag = (e) => {
    this.focusWin('term');
    const bar = e.target.closest && e.target.closest('.cv-window__bar');
    if (!bar || e.target.closest('button') || this.state.termMax || this.state.width < NARROW || e.button !== 0) return;
    e.preventDefault();
    const win = e.currentTarget;
    const s0 = this.state;
    const start = { mx: e.clientX, my: e.clientY, x: s0.termPos.x, y: s0.termPos.y };
    const w = s0.termW;
    const hh = s0.termH + TITLEBAR;
    this._live = null;
    this.beginPointer(
      'grabbing',
      (ev) => {
        const x = Math.min(Math.max(8, start.x + ev.clientX - start.mx), window.innerWidth - w - 8);
        const y = Math.min(Math.max(8, start.y + ev.clientY - start.my), Math.max(8, window.innerHeight - hh - 8));
        this._live = { x, y };
        if (win) win.style.transform = 'translate3d(' + (x - start.x) + 'px,' + (y - start.y) + 'px,0)';
      },
      () => {
        const L = this._live;
        this._live = null;
        if (!L) {
          this.setState({ dragging: false });
          return;
        }
        this.setState({ termPos: L }, () => {
          if (win) win.style.transform = '';
          requestAnimationFrame(() => requestAnimationFrame(() => this.setState({ dragging: false })));
        });
      },
    );
    this.setState({ dragging: true });
  };
  startResize = (dir) => (e) => {
    if (this.state.termMax || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const box = this._termBox;
    const win = (box && box.closest('.cv-window')) || (e.currentTarget && e.currentTarget.closest('.cv-window'));
    const s0 = this.state;
    const start = { mx: e.clientX, my: e.clientY, x: s0.termPos.x, y: s0.termPos.y, w: s0.termW, h: s0.termH };
    const cursor = {
      n: 'ns-resize',
      s: 'ns-resize',
      e: 'ew-resize',
      w: 'ew-resize',
      ne: 'nesw-resize',
      sw: 'nesw-resize',
      nw: 'nwse-resize',
      se: 'nwse-resize',
    }[dir];
    this._live = null;
    this.beginPointer(
      cursor,
      (ev) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const dx = ev.clientX - start.mx;
        const dy = ev.clientY - start.my;
        let { x, y, w, h } = start;
        if (dir.includes('e')) w = Math.min(Math.max(MIN_W, start.w + dx), vw - start.x - 8);
        if (dir.includes('w')) {
          w = Math.min(Math.max(MIN_W, start.w - dx), start.x + start.w - 8);
          x = start.x + start.w - w;
        }
        if (dir.includes('s')) h = Math.min(Math.max(MIN_H, start.h + dy), vh - start.y - TITLEBAR - 8);
        if (dir.includes('n')) {
          h = Math.min(Math.max(MIN_H, start.h - dy), start.y + start.h - 8);
          y = start.y + start.h - h;
        }
        x = Math.round(x);
        y = Math.round(y);
        w = Math.round(w);
        h = Math.round(h);
        this._live = { x, y, w, h };
        if (win) {
          win.style.left = x + 'px';
          win.style.top = y + 'px';
          win.style.width = w + 'px';
        }
        if (box) {
          box.style.height = h + 'px';
          box.scrollTop = box.scrollHeight;
        }
        if (this._sizeEl) {
          this._sizeEl.textContent =
            Math.max(1, Math.floor((w - 32) / CH_W)) + ' × ' + Math.max(1, Math.floor((h - 24) / CH_H));
        }
      },
      () => {
        const L = this._live;
        this._live = null;
        this.setState(
          L ? { termW: L.w, termH: L.h, termPos: { x: L.x, y: L.y }, resizing: false } : { resizing: false },
          () => this.pinTerm(),
        );
      },
    );
    this.setState({ resizing: true });
  };
  resizers = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((d) => [d, this.startResize(d)]);
  focusWin(w) {
    if (this.state.top !== w) this.setState({ top: w });
  }
  beginPointer(cursor, move, end) {
    if (this._move || this._up) this.endPointer();
    this._prevCursor = document.body.style.cursor;
    this._prevSelect = document.body.style.userSelect;
    document.body.style.cursor = cursor;
    document.body.style.userSelect = 'none';
    let raf = 0;
    let last = null;
    this._end = end || null;
    this._move = (ev) => {
      last = ev;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (last && this._move) move(last);
        });
      }
    };
    this._up = () => {
      cancelAnimationFrame(raf);
      if (last) move(last);
      this.endPointer();
    };
    window.addEventListener('pointermove', this._move);
    window.addEventListener('pointerup', this._up);
    window.addEventListener('pointercancel', this._up);
  }
  endPointer() {
    const active = !!(this._move || this._up);
    if (this._move) window.removeEventListener('pointermove', this._move);
    if (this._up) {
      window.removeEventListener('pointerup', this._up);
      window.removeEventListener('pointercancel', this._up);
    }
    if (active) {
      document.body.style.cursor = this._prevCursor || '';
      document.body.style.userSelect = this._prevSelect || '';
    }
    this._move = this._up = null;
    const end = this._end;
    this._end = null;
    if (active && end) end();
  }
  pinTerm() {
    this._stick = true;
    const pin = () => {
      const b = this._termBox;
      if (b) b.scrollTop = b.scrollHeight;
    };
    pin();
    requestAnimationFrame(pin);
  }

  // ── shell ──

  fs() {
    const { lang, role } = this.state;
    const key = lang + role;
    if (!this._fs || this._fs.key !== key) this._fs = { key, root: buildFs({ lang, role, now: new Date() }) };
    return this._fs.root;
  }
  shellActs = {
    goTo: (id) => this.goTo(id),
    setRole: (r) => this.setRole(r),
    setTheme: (x) => this.setTheme(x),
    setLang: (l) => this.setLang(l),
    setCwd: (target) => this.setState((s) => ({ prevCwd: s.cwd, cwd: target })),
    copyEmail: () => this.copyEmail(),
    openUrl: (url) => this.openUrl(url),
    mailto: () => {
      window.location.href = 'mailto:' + EMAIL;
    },
    print: () => this.printPage(),
    close: () => this.closeTerm(),
    toggleMax: () => this.maximizeTerm(),
    minimize: () => this.minimizeTerm(),
    clearHistory: () => {
      this.history = [];
      writeJSON('hist', []);
    },
  };
  submit(raw) {
    const s = this.state;
    const line = { id: ++this.lineId, kind: 'cmd', path: label(s.cwd), text: raw };
    const trimmed = raw.trim();
    const reset = { termInput: '', termMenu: null, termHistIdx: -1 };
    if (!trimmed) {
      this.setState((st) => ({ termLines: st.termLines.concat(line), ...reset }));
      return;
    }
    if (this.history[this.history.length - 1] !== trimmed) this.history = this.history.concat(trimmed).slice(-100);
    writeJSON('hist', this.history);
    const res = exec(trimmed, {
      lang: s.lang,
      role: s.role,
      theme: s.theme,
      cwd: s.cwd,
      prevCwd: s.prevCwd,
      history: this.history,
      termMax: s.termMax,
      now: new Date(),
      ua: navigator.userAgent,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      act: this.shellActs,
    });
    if (res === 'clear') {
      this.setState({ termLines: [], ...reset });
      return;
    }
    const out = res.map((r) => ({ id: ++this.lineId, ...(typeof r === 'string' ? { kind: 'out', text: r } : r) }));
    this.setState((st) => ({ termLines: st.termLines.concat(line, out).slice(-400), ...reset }));
  }
  runInTerminal = (raw) => {
    const wasOpen = this.state.termOpen;
    this.openTerm();
    setTimeout(
      () => {
        this.submit(raw);
        this.pinTerm();
      },
      wasOpen ? 0 : 80,
    );
  };
  complete(back) {
    const s = this.state;
    const menu = s.termMenu;
    if (menu) {
      const n = menu.items.length;
      const index = menu.index < 0 ? (back ? n - 1 : 0) : (menu.index + (back ? -1 : 1) + n) % n;
      this.setState({ termMenu: { ...menu, index }, termInput: menu.before + menu.items[index].name });
      return;
    }
    const c = candidates(s.termInput, { fs: this.fs(), cwd: s.cwd });
    if (!c.items.length) return;
    if (c.items.length === 1) {
      const it = c.items[0];
      this.setState({ termInput: c.before + it.name + (it.kind === 'dir' ? '' : ' ') });
      return;
    }
    const cp = commonPrefix(c.items.map((x) => x.name));
    if (cp.length > c.word.length) {
      this.setState({ termInput: c.before + cp });
      return;
    }
    this.setState({ termMenu: { before: c.before, items: c.items, mode: c.mode, index: -1 } });
  }
  ghost() {
    return this.state.termMenu ? '' : suggestion(this.state.termInput, this.history);
  }
  onTermInput = (e) => {
    this.setState({ termInput: e.target.value, termMenu: null, termHistIdx: -1 });
    this.pinTerm();
  };
  onTermKey = (e) => {
    this.pinTerm();
    const s = this.state;
    const el = e.target;
    const atEnd = el.selectionStart === el.value.length && el.selectionEnd === el.value.length;
    if (e.key === 'Tab') {
      e.preventDefault();
      this.complete(e.shiftKey);
      return;
    }
    if (e.key === 'Escape' && s.termMenu) {
      e.preventDefault();
      e.stopPropagation();
      this.setState({ termMenu: null });
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (s.termMenu && s.termMenu.index >= 0) {
        const it = s.termMenu.items[s.termMenu.index];
        this.setState({ termMenu: null, termInput: s.termMenu.before + it.name + (it.kind === 'dir' ? '' : ' ') });
        return;
      }
      this.submit(s.termInput);
      return;
    }
    if (s.termMenu && ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) {
      e.preventDefault();
      this.complete(e.key === 'ArrowUp' || e.key === 'ArrowLeft');
      return;
    }
    if ((e.key === 'ArrowRight' || e.key === 'End' || (e.ctrlKey && (e.key === 'e' || e.key === 'f'))) && atEnd) {
      const g = this.ghost();
      if (g) {
        e.preventDefault();
        this.setState({ termInput: s.termInput + g });
        return;
      }
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const H = this.history;
      if (!H.length) return;
      let i = s.termHistIdx;
      if (e.key === 'ArrowUp') i = i < 0 ? H.length - 1 : Math.max(0, i - 1);
      else i = i < 0 ? -1 : i + 1;
      if (i >= H.length) i = -1;
      this.setState({ termHistIdx: i, termInput: i < 0 ? '' : H[i] });
      return;
    }
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      this.setState((st) => ({
        termLines: st.termLines.concat({
          id: ++this.lineId,
          kind: 'cmd',
          path: label(st.cwd),
          text: st.termInput + '^C',
        }),
        termInput: '',
        termMenu: null,
        termHistIdx: -1,
      }));
      return;
    }
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      this.setState({ termLines: [] });
      return;
    }
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      this.setState({ termInput: '', termMenu: null });
    }
  };
  pickMenuItem = (it) => (e) => {
    e.stopPropagation();
    const menu = this.state.termMenu;
    this.setState({ termMenu: null, termInput: menu.before + it.name + (it.kind === 'dir' ? '' : ' ') });
    this.focusTerm();
  };

  // ── command palette ──

  openPal = () => {
    clearTimeout(this._palT);
    this.setState({ top: 'pal' });
    if (this.state.palMin) {
      this.setState({ palOpen: true, palMin: false, palHiding: false, roleMenuOpen: false });
      return;
    }
    this.setState({ palOpen: true, palHiding: false, palQuery: '', palIndex: 0, roleMenuOpen: false });
  };
  closePal = () => {
    clearTimeout(this._palT);
    this.setState({ palOpen: false, palMin: false, palHiding: false, palMax: false });
  };
  minimizePal = () => {
    if (!this.state.palOpen || this.state.palHiding) return;
    this.setState({ palHiding: true });
    clearTimeout(this._palT);
    this._palT = setTimeout(() => this.setState({ palOpen: false, palHiding: false, palMin: true }), 160);
  };
  maximizePal = () => {
    this.setState((s) => ({ palMax: !s.palMax, top: 'pal' }));
    setTimeout(() => this._palInput && this._palInput.focus(), 0);
  };
  onPalDouble = (e) => {
    if (e.target.closest && e.target.closest('.cv-window__bar') && !e.target.closest('button')) this.maximizePal();
  };
  startPalDrag = (e) => {
    this.focusWin('pal');
    if (this.state.palMax) return;
    const bar = e.target.closest && e.target.closest('.cv-window__bar');
    if (!bar || e.target.closest('button') || this.state.width < NARROW || e.button !== 0) return;
    e.preventDefault();
    const win = e.currentTarget;
    const r = win.getBoundingClientRect();
    const start = { mx: e.clientX, my: e.clientY, x: r.left, y: r.top };
    if (!this.state.palPos) this.setState({ palPos: { x: r.left, y: r.top } });
    this.setState({ palDragging: true });
    this._live = null;
    this.beginPointer(
      'grabbing',
      (ev) => {
        const x = Math.min(Math.max(8, start.x + ev.clientX - start.mx), window.innerWidth - r.width - 8);
        const y = Math.min(
          Math.max(8, start.y + ev.clientY - start.my),
          Math.max(8, window.innerHeight - r.height - 8),
        );
        this._live = { x, y };
        win.style.transform = 'translate3d(' + (x - start.x) + 'px,' + (y - start.y) + 'px,0)';
      },
      () => {
        const L = this._live;
        this._live = null;
        this.setState(L ? { palPos: L } : {}, () => {
          win.style.transform = '';
          if (this._palInput) this._palInput.focus();
          requestAnimationFrame(() => requestAnimationFrame(() => this.setState({ palDragging: false })));
        });
      },
    );
  };
  palActs = {
    goTo: (id) => this.goTo(id),
    setRole: (r) => this.setRole(r),
    copyLink: () => this.copyLink(),
    setTheme: (x) => this.setTheme(x),
    setLang: (l) => this.setLang(l),
    toggleTerm: () => this.toggleTerm(),
    runInTerminal: (c) => this.runInTerminal(c),
    print: () => this.printPage(),
    copyEmail: () => this.copyEmail(),
    openUrl: (url) => this.openUrl(url),
  };
  palModel() {
    const s = this.state;
    const termVisible = s.termOpen && !s.termMin && !s.termClosing;
    return palModel(s.palQuery, {
      lang: s.lang,
      items: palItems({ lang: s.lang, theme: s.theme, role: s.role, termVisible }, this.palActs),
      recent: s.palRecent,
      runInTerminal: this.runInTerminal,
    });
  }
  runPalItem(it) {
    if (!it) return;
    const baseId = it.baseId || it.id;
    if (!baseId.startsWith('run') && !baseId.startsWith('cmd-')) {
      const rec = [baseId].concat(this.state.palRecent.filter((x) => x !== baseId)).slice(0, 4);
      writeJSON('recent', rec);
      this.setState({ palRecent: rec });
    }
    this.closePal();
    if (it.run) it.run();
  }
  onPalInput = (e) => this.setState({ palQuery: e.target.value, palIndex: 0 });
  onPalKey = (e) => {
    const { items } = this.palModel();
    const n = items.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (n) this.setState((s) => ({ palIndex: (s.palIndex + 1) % n }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (n) this.setState((s) => ({ palIndex: (s.palIndex - 1 + n) % n }));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.runPalItem(items[Math.min(this.state.palIndex, n - 1)]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.closePal();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (!this.state.palQuery.startsWith('>')) this.setState({ palQuery: '> ', palIndex: 0 });
    }
  };

  // ── render ──

  render() {
    const s = this.state;
    const t = TEXT[s.lang];
    const cv = cvFor(s.lang, s.role);
    const termVisible = s.termOpen && !s.termMin && !s.termClosing;
    const termZ = s.top === 'term' ? 64 : 62;
    const palZ = s.top === 'pal' ? 64 : 62;
    const termTitle = 'zsh · ' + label(s.cwd);
    const palTitle = '⌘K · ' + t.commands;
    return (
      <>
        <div ref={this.rootRef} className="cv-app desktop">
          <Header
            t={t}
            active={s.active}
            theme={s.theme}
            lang={s.lang}
            termVisible={termVisible}
            palOpen={s.palOpen}
            onLogo={this.goTop}
            onTab={this.goTo}
            onTheme={this.setTheme}
            onLang={this.setLang}
            onTerm={this.toggleTerm}
            onPal={this.openPal}
          />
          <main className="cv-main">
            <div className="cv-print-note" data-print-only="">
              {this.printNote()}
            </div>
            <About
              t={t}
              role={s.role}
              onPrint={this.printPage}
              roleMenu={{
                open: s.roleMenuOpen,
                menuRef: this.roleMenuRef,
                onToggle: () => this.setState((st) => ({ roleMenuOpen: !st.roleMenuOpen })),
                onPick: (r) => {
                  this.setState({ roleMenuOpen: false });
                  this.setRole(r);
                },
              }}
            />
            <Experience t={t} points={cv.points} duration={expDuration(s.lang, s.now)} />
            <Projects t={t} projects={cv.projects} />
            <Skills t={t} skills={cv.skills} />
            <Education t={t} edu={cv.edu} />
            <Contact t={t} onCopy={this.copyEmail} />
          </main>
          <Footer t={t} commit={this.props.commit} />
        </div>

        {s.termOpen && s.termMax && !s.termMin && !s.termClosing && (
          <div data-noprint="" className="cv-scrim" onClick={this.maximizeTerm} style={{ zIndex: termZ - 1 }} />
        )}
        {s.termOpen && this.renderTerminal(t, termZ, termTitle)}

        <div data-noprint="" className="cv-dock">
          {s.palMin && (
            <Button variant="secondary" size="sm" icon="search" onClick={this.openPal}>
              {palTitle}
            </Button>
          )}
          {s.termMin && (
            <Button variant="secondary" size="sm" icon="terminal" onClick={this.openTerm}>
              {termTitle}
            </Button>
          )}
        </div>

        {s.palOpen && s.palMax && !s.palHiding && (
          <div data-noprint="" className="cv-scrim" onClick={this.maximizePal} style={{ zIndex: palZ - 1 }} />
        )}
        {s.palOpen && this.renderPalette(t, palZ, palTitle)}

        <div className="cv-toasts">
          {s.toasts.map((x) => (
            <Toast key={x.id} tone={x.tone} icon={x.icon} title={x.title} onClose={x.close}>
              {x.body}
            </Toast>
          ))}
        </div>
      </>
    );
  }

  renderTerminal(t, zIndex, title) {
    const s = this.state;
    const narrow = s.width < NARROW;
    const vw = s.width;
    const vh = s.vh;
    const pos = s.termPos || { x: 24, y: 24 };
    const ease = '220ms var(--ease-out)';
    const still = s.dragging || s.resizing;
    const hidden = s.termClosing || s.termMin;
    const mobileH = Math.round(Math.max(160, Math.min(vh * 0.55, vh - 140)));
    const edge = narrow ? 8 : 16;
    let geo;
    if (s.termMax) geo = { left: edge, top: edge, width: vw - edge * 2 };
    else if (narrow) geo = { left: 8, top: vh - mobileH - TITLEBAR - 8, width: vw - 16 };
    else geo = { left: pos.x, top: pos.y, width: s.termW };
    const style = {
      position: 'fixed',
      zIndex,
      transformOrigin: '100% 100%',
      ...geo,
      background: 'color-mix(in srgb, var(--surface-window-solid) 46%, transparent)',
      animation: hidden ? 'cv-term-out 170ms var(--ease-out) forwards' : 'cv-term-in var(--dur-base) var(--ease-out)',
      pointerEvents: hidden ? 'none' : undefined,
      visibility: s.termMin ? 'hidden' : 'visible',
      boxShadow: s.resizing ? '0 0 0 1px var(--accent-soft), var(--shadow-window)' : undefined,
      transition: still
        ? 'none'
        : (s.termMin ? 'visibility 0s linear 170ms, ' : '') + 'left ' + ease + ', top ' + ease + ', width ' + ease,
    };
    const boxH = s.termMax ? vh - edge * 2 - TITLEBAR : narrow ? mobileH : s.termH;
    const menu = s.termMenu;
    const hl = highlight(s.termInput, { fs: this.fs(), cwd: s.cwd, hint: t.termHint, ghost: this.ghost() });
    const canResize = !s.termMax && !narrow;
    return (
      <Window
        title={title}
        lights
        onClose={this.closeTerm}
        onMinimize={this.minimizeTerm}
        onMaximize={this.maximizeTerm}
        onPointerDown={this.startDrag}
        onDoubleClick={this.onTermDouble}
        style={style}
        bodyStyle={{ background: 'color-mix(in srgb, var(--surface-inset) 55%, transparent)', overflow: 'hidden' }}
      >
        <div
          ref={this.termBoxRef}
          className="cv-term cv-term--win"
          onClick={this.focusTermClick}
          style={{ height: boxH + 'px', transition: still ? 'none' : 'height ' + ease }}
        >
          {s.termLines.map((ln) => (
            <TermLine key={ln.id} line={ln} />
          ))}
          <Prompt path={label(s.cwd)}>
            <div className="cv-term__field">
              <div aria-hidden="true" className="cv-term__hl">
                {hl.map((h, i) => (
                  <span key={i} style={{ color: h.color, textDecoration: h.deco }}>
                    {h.text}
                  </span>
                ))}
              </div>
              <input
                ref={this.termInputRef}
                value={s.termInput}
                onChange={this.onTermInput}
                onKeyDown={this.onTermKey}
                aria-label="command"
                className="cv-term__in"
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="off"
              />
            </div>
          </Prompt>
          {menu && (
            <div
              className="cv-term__menu"
              style={{
                gridTemplateColumns: menu.mode === 'cmd' ? 'minmax(0,1fr)' : 'repeat(auto-fill,minmax(150px,1fr))',
              }}
            >
              {menu.items.map((it, i) => (
                <div
                  key={it.name}
                  className="cv-term__mi"
                  onClick={this.pickMenuItem(it)}
                  style={{ background: i === menu.index ? 'var(--accent-soft)' : 'transparent' }}
                >
                  <span
                    style={{
                      color:
                        it.kind === 'dir'
                          ? 'var(--accent)'
                          : it.kind === 'cmd'
                            ? 'var(--text-heading)'
                            : it.kind === 'dot'
                              ? 'var(--text-subtle)'
                              : 'var(--text-body)',
                      minWidth: menu.mode === 'cmd' ? '10ch' : 0,
                    }}
                  >
                    {it.display}
                  </span>
                  <span>{it.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {canResize &&
          this.resizers.map(([d, onDown]) => (
            <div
              key={d}
              className={'cv-rz cv-rz--' + d}
              onPointerDown={onDown}
              onDoubleClick={d === 'se' ? this.resetSize : undefined}
              title={d === 'se' ? t.resizeHint : undefined}
            />
          ))}
        {s.resizing && (
          <div ref={this.sizeRef} className="cv-term__size">
            {Math.max(1, Math.floor((s.termW - 32) / CH_W))} × {Math.max(1, Math.floor((s.termH - 24) / CH_H))}
          </div>
        )}
      </Window>
    );
  }

  renderPalette(t, zIndex, title) {
    const s = this.state;
    const narrow = s.width < NARROW;
    const vw = s.width;
    const vh = s.vh;
    const edge = narrow ? 8 : 16;
    const ease = '220ms var(--ease-out)';
    const pw = Math.min(620, vw - 32);
    const pp = s.palPos;
    let geo;
    if (s.palMax) geo = { left: edge, top: edge, width: vw - edge * 2 };
    else if (pp && !narrow) {
      geo = { left: Math.min(Math.max(8, pp.x), vw - 200), top: Math.min(Math.max(8, pp.y), vh - 120), width: pw };
    } else geo = { left: Math.round((vw - pw) / 2), top: Math.round(vh * (narrow ? 0.08 : 0.14)), width: pw };
    const style = {
      position: 'fixed',
      margin: 0,
      zIndex,
      transformOrigin: '50% 0',
      ...geo,
      animation: s.palHiding
        ? 'cv-term-out 160ms var(--ease-out) forwards'
        : 'cv-pal-in var(--dur-base) var(--ease-out)',
      transition: s.palDragging ? 'none' : 'left ' + ease + ', top ' + ease + ', width ' + ease,
    };
    const listMax = s.palMax ? vh - edge * 2 - TITLEBAR - 48 - 33 + 'px' : 'min(400px, 52vh)';
    const pm = this.palModel();
    const palIndex = Math.min(s.palIndex, Math.max(0, pm.items.length - 1));
    const q = s.palQuery;
    const rows = [];
    let lastGroup = null;
    pm.items.forEach((it, i) => {
      if (pm.grouped && it.group !== lastGroup) {
        rows.push(
          <div key={'g-' + it.group} className="cv-palette__group">
            {it.group}
          </div>,
        );
        lastGroup = it.group;
      }
      const act = i === palIndex;
      rows.push(
        <button
          key={it.id}
          type="button"
          className={'cv-palette__item' + (act ? ' cv-palette__item--active' : '')}
          data-pal-active={act ? 'true' : 'false'}
          onMouseMove={() => {
            if (this.state.palIndex !== i) this.setState({ palIndex: i });
          }}
          onClick={() => this.runPalItem(it)}
        >
          <Icon name={it.icon} size={18} />
          <span className="cv-palette__label">
            {it.segs.map((sg, j) => (
              <span key={j} style={{ color: sg.color, fontWeight: sg.weight }}>
                {sg.text}
              </span>
            ))}
          </span>
          {it.hint && <span className="cv-palette__hint">{it.hint}</span>}
          {it.kbd && it.kbd.length > 0 && <Kbd keys={it.kbd} />}
        </button>,
      );
    });
    return (
      <Window
        title={title}
        lights
        onClose={this.closePal}
        onMinimize={this.minimizePal}
        onMaximize={this.maximizePal}
        onPointerDown={this.startPalDrag}
        onDoubleClick={this.onPalDouble}
        style={style}
      >
        <div className="cv-palette__search">
          <Icon name={q.trim().startsWith('>') ? 'terminal' : 'search'} size={18} />
          <input
            ref={this.palInputRef}
            value={q}
            onChange={this.onPalInput}
            onKeyDown={this.onPalKey}
            placeholder={t.palPh}
            aria-label={t.commands}
            autoComplete="off"
            spellCheck={false}
          />
          {q.trim() && (
            <span className="cv-palette__count">
              {pm.items.length} {t.palResults}
            </span>
          )}
          <Kbd>esc</Kbd>
        </div>
        <div ref={this.palListRef} className="cv-palette__list" style={{ maxHeight: listMax }}>
          {rows}
          {!pm.items.length && (
            <div className="cv-palette__empty">
              {t.palEmpty}: &quot;{q}&quot;
            </div>
          )}
        </div>
        <div className="cv-palette__foot">
          <span>
            <Kbd keys={['↑', '↓']} /> {t.palNav}
          </span>
          <span>
            <Kbd>↵</Kbd> {t.palRunLbl}
          </span>
          <span>
            <Kbd>&gt;</Kbd> terminal
          </span>
          <span className="cv-palette__close">
            <Kbd>esc</Kbd> {t.palClose}
          </span>
        </div>
      </Window>
    );
  }
}
