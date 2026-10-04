# volempdoge.github.io

The root of `https://volempdoge.github.io/`: my CV, and what only a host's
root can do for the project sites under it.

## CV

A React page, prerendered at build time and hydrated in the browser, so the
whole CV is in the HTML for crawlers and for readers without JavaScript. The
design is the Terminal CV design system from Claude Design (`CV.dc.html`).

```bash
npm ci
npm run dev        # dev server, client-rendered
npm run build      # dist/: client build, then the prerender
npm run preview    # serve dist/ on :4173
npm run check      # everything CI runs
```

- `index.html`: the page shell. Its inline script runs before first paint:
  it applies the saved theme and, when the saved language or focus differs
  from the prerendered default (en, embedded), shows the boot screen until the
  app has switched.
- `src/App.jsx`: page state and behaviour. `src/page/`: the sections, header,
  footer and terminal output. `src/content.js`: all CV text, en and ua.
- `src/shell/`: the terminal's virtual filesystem, commands and completion.
  `src/palette.js`: the ⌘K palette. Both are plain functions, unit tested.
- `src/ds/`: React port of the design system components the page uses.
  `src/styles/ds/`: its CSS, vendored as is (not formatted or linted).
- `scripts/prerender.mjs`: renders the page into `dist/index.html` and bakes
  in the build time and commit.
- `public/fonts/`: IBM Plex subsets and a Material Symbols subset with only the
  icons in `scripts/icons.txt`. After adding an icon, add it there and run
  `node scripts/subset-icons.mjs`; an e2e test fails on missing icons.
- `public/index.md`: the full CV, both focuses, in Markdown. `llms.txt`
  points to it.

## CI and deploy

`.github/workflows/ci.yml` runs on pushes, pull requests and monthly:
Prettier, ESLint, Stylelint, Vitest (unit, prerender and hydration), the
build, html-validate and Playwright (desktop and mobile Chromium). On `main`
it deploys `dist/` to GitHub Pages; the repository's Pages source must be
"GitHub Actions".

## Host root

- `public/favicon.*` and the `<link rel="icon">` in `index.html`: Google
  Search keeps one favicon per host and reads it off this page.
- `public/robots.txt`: only read at the root of a host, so this is where the
  project sitemaps are listed.
- `public/sitemap.xml`: an index of this page's sitemap and the project
  sitemaps.

The icons are copied from `site/assets/` in
[betaflight-designer-fonts](https://github.com/volempdoge/betaflight-designer-fonts),
made by its `tools/favicon.py`.
