// Animates the visible text of a subtree from one render to the next.
// Usage: const snap = fx.snapshot(); <re-render>; fx.run(snap, mode, ms, lang).
// Modes: 'type' (masked reveal with a block cursor), 'wave', 'scramble'.

const LAT = 'abcdefghijklmnopqrstuvwxyz';
const CYR = 'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя';
const SKIP = 'script,style,input,textarea,svg,.ms,.cv-icon';

export class TextFx {
  constructor(getRoot) {
    this.getRoot = getRoot;
    this.raf = 0;
    this.revealRaf = 0;
    this.jobs = null;
    this.reveal = null;
    this.locks = null;
  }

  textNodes() {
    const root = this.getRoot();
    const out = [];
    if (!root) return out;
    const vh = window.innerHeight;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        n.nodeValue.trim() && !n.parentNode.closest(SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    while (w.nextNode()) {
      const n = w.currentNode;
      const r = n.parentNode.getBoundingClientRect();
      if (r.width && r.bottom > -60 && r.top < vh + 60) out.push(n);
    }
    return out;
  }

  /** The nearest non-inline ancestor, whose size is held while text animates. */
  lockTarget(node) {
    const root = this.getRoot();
    let el = node.parentElement;
    while (el && el !== root && getComputedStyle(el).display === 'inline') el = el.parentElement;
    return el;
  }

  /** Text of every visible node, plus the sizes of their blocks. Call before the re-render. */
  snapshot() {
    this.stop(true);
    const m = new Map();
    const sizes = new Map();
    this.textNodes().forEach((n) => {
      const el = this.lockTarget(n);
      if (el && !sizes.has(el)) {
        const r = el.getBoundingClientRect();
        sizes.set(el, { w: r.width, h: r.height });
      }
      m.set(n, n.nodeValue);
    });
    m.sizes = sizes;
    return m;
  }

  lockSizes(els, sizes) {
    this.unlockSizes();
    const locks = [];
    els.forEach((el) => {
      const old = sizes.get(el);
      if (!old || !el.isConnected) return;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const content = cs.boxSizing !== 'border-box';
      const padX = content
        ? parseFloat(cs.paddingLeft) +
          parseFloat(cs.paddingRight) +
          parseFloat(cs.borderLeftWidth) +
          parseFloat(cs.borderRightWidth)
        : 0;
      const padY = content
        ? parseFloat(cs.paddingTop) +
          parseFloat(cs.paddingBottom) +
          parseFloat(cs.borderTopWidth) +
          parseFloat(cs.borderBottomWidth)
        : 0;
      locks.push({ el, minW: el.style.minWidth, minH: el.style.minHeight });
      el.style.minHeight = Math.max(old.h, r.height) - padY + 'px';
      const parentW = el.parentElement ? el.parentElement.clientWidth : 0;
      if (r.width < parentW - 1 || cs.display.startsWith('inline')) {
        el.style.minWidth = Math.max(old.w, r.width) - padX + 'px';
      }
    });
    this.locks = locks;
  }

  unlockSizes() {
    if (!this.locks) return;
    this.locks.forEach((l) => {
      l.el.style.minWidth = l.minW;
      l.el.style.minHeight = l.minH;
    });
    this.locks = null;
  }

  /** Stops any animation; with `finish`, jumps text to its final value. */
  stop(finish) {
    cancelAnimationFrame(this.raf);
    if (finish && this.jobs) {
      this.jobs.forEach((j) => {
        if (j.node.nodeValue === j.last) j.node.nodeValue = j.to;
      });
    }
    this.jobs = null;
    this.unlockSizes();
    this.stopReveal();
  }

  stopReveal() {
    cancelAnimationFrame(this.revealRaf);
    if (this.reveal) this.reveal.forEach((j) => clearMask(j));
    this.reveal = null;
  }

  run(snap, mode, dur, lang) {
    if (mode === 'type') {
      this.stopReveal();
      this.typeReveal(snap, dur);
      return;
    }
    this.scramble(snap, mode, dur, lang);
  }

  typeReveal(snap, dur) {
    const root = this.getRoot();
    const changed = [];
    snap.forEach((from, node) => {
      if (node.isConnected && node.nodeValue !== from) changed.push(node);
    });
    if (!changed.length || !root) return;
    const set = new Set();
    changed.forEach((n) => {
      let el = n.parentElement;
      while (el && el !== root && getComputedStyle(el).display === 'inline') el = el.parentElement;
      if (el && el !== root) set.add(el);
    });
    let els = [...set].filter((el) => {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundColor;
      const filled = bg && bg !== 'transparent' && !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(bg);
      const boxed = ['Top', 'Right', 'Bottom', 'Left'].every((d) => parseFloat(cs['border' + d + 'Width']) > 0);
      return !filled && !boxed;
    });
    els = els.filter((el) => !els.some((o) => o !== el && o.contains(el)));
    if (!els.length) return;
    const vh = window.innerHeight;
    const SPREAD = 0.45;
    const jobs = els.map((el) => {
      const r = el.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = [...range.getClientRects()]
        .filter((x) => x.width > 0.5 && x.height > 0.5)
        .sort((a, b) => a.top - b.top || a.left - b.left);
      const lines = [];
      rects.forEach((x) => {
        const last = lines[lines.length - 1];
        const mid = x.top + x.height / 2;
        if (last && mid > last.top && mid < last.bottom) {
          last.left = Math.min(last.left, x.left);
          last.right = Math.max(last.right, x.right);
          last.top = Math.min(last.top, x.top);
          last.bottom = Math.max(last.bottom, x.bottom);
        } else lines.push({ left: x.left, right: x.right, top: x.top, bottom: x.bottom });
      });
      const rel = lines.map((l) => ({
        x: l.left - r.left,
        y: l.top - r.top - 3,
        w: l.right - l.left,
        h: l.bottom - l.top + 6,
      }));
      const total = rel.reduce((a, l) => a + l.w, 0) || 1;
      return {
        el,
        r,
        lines: rel,
        total,
        delay: Math.min(1, Math.max(0, r.top / vh)) * SPREAD,
        cursor: null,
        sx: window.scrollX,
        sy: window.scrollY,
      };
    });
    jobs.forEach((j) => {
      setMask(j, [], [], []);
      buildSkel(j);
    });
    this.reveal = jobs;
    const start = performance.now();
    const G = 'linear-gradient(#000,#000)';
    const frame = (now) => {
      const p = Math.min(1, (now - start) / dur);
      let active = 0;
      for (const j of this.reveal) {
        if (j.done) continue;
        const local = Math.min(1, Math.max(0, (p - j.delay) / (1 - SPREAD)));
        if (local >= 1 || !j.el.isConnected) {
          clearMask(j);
          j.done = true;
          continue;
        }
        active++;
        if (local <= 0) continue;
        let reveal = local * j.total;
        if (j.bars) {
          let rem = reveal;
          j.lines.forEach((l, i) => {
            const b = j.bars[i];
            const done = Math.max(0, Math.min(l.w, rem));
            rem -= l.w;
            if (done >= l.w) {
              if (b.style.display !== 'none') b.style.display = 'none';
              return;
            }
            b.style.left = l.x + done + (done > 0 ? 10 : 0) + 'px';
            b.style.width = Math.max(0, l.w - done - (done > 0 ? 10 : 0)) + 'px';
          });
        }
        const imgs = [];
        const sizes = [];
        const pos = [];
        let cx = null;
        let cy = 0;
        let ch = 0;
        for (let i = 0; i < j.lines.length; i++) {
          const l = j.lines[i];
          if (reveal <= 0) break;
          const w = Math.min(l.w, reveal);
          const full = w >= l.w;
          imgs.push(G);
          sizes.push((full ? j.r.width + 40 : l.x + w) + 'px ' + l.h + 'px');
          pos.push((full ? -20 : 0) + 'px ' + l.y + 'px');
          if (!full) {
            cx = l.x + w;
            cy = l.y + 3;
            ch = l.h - 6;
          }
          reveal -= l.w;
        }
        if (!j.cursor) {
          const c = document.createElement('span');
          c.setAttribute('aria-hidden', 'true');
          c.className = 'cv-fx-cursor';
          document.body.appendChild(c);
          j.cursor = c;
        }
        if (cx === null) {
          const l = j.lines[j.lines.length - 1];
          cx = l ? l.x + l.w : 0;
          cy = l ? l.y + 3 : 0;
          ch = l ? l.h - 6 : 16;
        }
        const fs = parseFloat(getComputedStyle(j.el).fontSize) || 16;
        j.cursor.style.left = j.r.left + j.sx + cx + 1 + 'px';
        j.cursor.style.top = j.r.top + j.sy + cy + ch * 0.08 + 'px';
        j.cursor.style.height = ch * 0.84 + 'px';
        j.cursor.style.width = Math.max(4, fs * 0.5) + 'px';
        setMask(j, imgs, sizes, pos);
      }
      if (p < 1 && active) this.revealRaf = requestAnimationFrame(frame);
      else this.stopReveal();
    };
    this.revealRaf = requestAnimationFrame(frame);
  }

  scramble(snap, mode, dur, lang) {
    const vh = window.innerHeight;
    const pool = lang === 'ua' ? CYR : LAT;
    const SPREAD = 0.22;
    const jobs = [];
    snap.forEach((from, node) => {
      if (!node.isConnected) return;
      const to = node.nodeValue;
      if (from === to) return;
      const top = node.parentNode.getBoundingClientRect().top;
      const n = Math.max(to.length, from.length);
      jobs.push({
        node,
        from,
        to,
        n,
        last: to,
        glyphs: new Array(n),
        delay: Math.min(1, Math.max(0, top / vh)) * SPREAD,
        band: Math.max(3, Math.min(12, Math.round(n * 0.18))),
      });
    });
    if (!jobs.length) return;
    if (snap.sizes) {
      this.lockSizes(new Set(jobs.map((j) => this.lockTarget(j.node)).filter(Boolean)), snap.sizes);
    }
    jobs.forEach((j) => {
      j.node.nodeValue = j.from;
      j.last = j.from;
    });
    this.jobs = jobs;
    const start = performance.now();
    let frameNo = 0;
    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const keep = (c) => /[\s\d·→\-.,:;()/"'’&+]/.test(c);
    const glyph = (j, i, refresh) => {
      if (!j.glyphs[i] || refresh) {
        const src = j.to[i] || j.from[i] || 'a';
        const g = pool[(Math.random() * pool.length) | 0];
        j.glyphs[i] = src !== src.toLowerCase() ? g.toUpperCase() : g;
      }
      return j.glyphs[i];
    };
    const frame = (now) => {
      frameNo++;
      const p = Math.min(1, (now - start) / dur);
      const refresh = frameNo % 3 === 0;
      this.jobs = this.jobs.filter((j) => j.node.isConnected && j.node.nodeValue === j.last);
      for (const j of this.jobs) {
        const local = Math.min(1, Math.max(0, (p - j.delay) / (1 - SPREAD)));
        if (local >= 1) {
          if (j.last !== j.to) {
            j.node.nodeValue = j.to;
            j.last = j.to;
          }
          continue;
        }
        if (local <= 0) continue;
        const e = ease(local);
        let out = '';
        if (mode === 'wave') {
          const head = e * (j.n + j.band);
          for (let i = 0; i < j.n; i++) {
            if (i < head - j.band) out += j.to[i] ?? '';
            else if (i < head) {
              const c = j.to[i];
              out += c !== undefined && keep(c) ? c : glyph(j, i, refresh);
            } else out += j.from[i] ?? '';
          }
        } else {
          const len = Math.round(j.from.length + (j.to.length - j.from.length) * e);
          for (let i = 0; i < len; i++) {
            const c = j.to[i];
            const thr = (i / Math.max(1, j.n)) * 0.6 + (((i * 37) % 11) / 11) * 0.4;
            out += c !== undefined && (e >= thr || keep(c)) ? c : glyph(j, i, refresh);
          }
        }
        if (out !== j.last) {
          j.node.nodeValue = out;
          j.last = out;
        }
      }
      if (p < 1 && this.jobs.length) this.raf = requestAnimationFrame(frame);
      else {
        this.jobs.forEach((j) => {
          if (j.node.nodeValue === j.last) j.node.nodeValue = j.to;
        });
        this.jobs = null;
        this.unlockSizes();
      }
    };
    this.raf = requestAnimationFrame(frame);
  }
}

function clearMask(j) {
  const st = j.el.style;
  st.maskImage = st.webkitMaskImage = '';
  st.maskSize = st.webkitMaskSize = '';
  st.maskPosition = st.webkitMaskPosition = '';
  st.maskRepeat = st.webkitMaskRepeat = '';
  if (j.cursor) {
    j.cursor.remove();
    j.cursor = null;
  }
  if (j.skel) {
    j.skel.remove();
    j.skel = null;
    j.bars = null;
  }
}

function setMask(j, imgs, sizes, pos) {
  const st = j.el.style;
  st.maskImage = st.webkitMaskImage = imgs.length ? imgs.join(',') : 'linear-gradient(transparent,transparent)';
  st.maskSize = st.webkitMaskSize = sizes.length ? sizes.join(',') : '0 0';
  st.maskPosition = st.webkitMaskPosition = pos.length ? pos.join(',') : '0 0';
  st.maskRepeat = st.webkitMaskRepeat = 'no-repeat';
}

/** Placeholder bars over the lines that are still hidden. */
function buildSkel(j) {
  const wrap = document.createElement('div');
  wrap.setAttribute('aria-hidden', 'true');
  wrap.className = 'cv-fx-skel';
  Object.assign(wrap.style, {
    left: j.r.left + j.sx + 'px',
    top: j.r.top + j.sy + 'px',
    width: j.r.width + 'px',
    height: j.r.height + 'px',
  });
  j.bars = j.lines.map((l, i) => {
    const b = document.createElement('div');
    const bh = Math.max(6, Math.round((l.h - 6) * 0.56));
    b.className = 'cv-fx-skel__bar';
    Object.assign(b.style, {
      animationDelay: (i * 0.06).toFixed(2) + 's',
      top: l.y + (l.h - bh) / 2 + 'px',
      height: bh + 'px',
      left: l.x + 'px',
      width: l.w + 'px',
    });
    wrap.appendChild(b);
    return b;
  });
  document.body.appendChild(wrap);
  j.skel = wrap;
}
