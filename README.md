# volempdoge.github.io

The root of `https://volempdoge.github.io/`: my CV, and what only a host's
root can do for the project sites under it.

## CV

A React page, prerendered at build time and hydrated in the browser, so the
whole CV is in the HTML for crawlers and for readers without JavaScript. The
design is the Terminal CV design system from Claude Design (`CV.dc.html`).
There is one prerendered page per language: `/` (English) and `/uk/`
(Ukrainian), linked to each other with `hreflang`.

```bash
npm ci
npm run dev        # dev server, client-rendered
npm run build      # dist/: client build, then the prerender
npm run preview    # serve dist/ on :4173
npm run check      # everything CI runs
```

- `index.html`: the page shell. Its inline script runs before first paint:
  it sends a reader who chose Ukrainian from `/` to `/uk/`, applies the saved
  theme and, for a saved or linked software focus, shows the boot screen until
  the app has switched. The language switch moves between `/` and `/uk/`.
- `src/App.jsx`: page state and behaviour. `src/page/`: the sections, header,
  footer and terminal output. `src/content.js`: all CV text, en and ua.
- `src/shell/`: the terminal's virtual filesystem, commands and completion.
  `src/palette.js`: the ⌘K palette. Both are plain functions, unit tested.
- `src/ds/`: React port of the design system components the page uses.
  `src/styles/ds/`: its CSS, vendored as is (not formatted or linted).
- `scripts/prerender.mjs`: renders `dist/index.html` and `dist/uk/index.html`,
  inlines the stylesheet, writes `dist/sitemap-cv.xml` (with `hreflang` and the
  commit date as `lastmod`) and bakes in the build time and commit.
- `scripts/head.mjs`: each page's title, description, canonical and `hreflang`
  links, Open Graph and Twitter cards and ProfilePage JSON-LD, from `PAGES` in
  `src/content.js`.
- `public/og/en.png`, `public/og/uk.png`: the social preview cards (1200×630),
  drawn from HTML by `node scripts/og-image.mjs`; rerun it after changing the
  name or titles.
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
- `sitemap.xml` (`public/`): an index of this site's `sitemap-cv.xml`
  (generated) and the project sitemaps.
- `public/404.html`: served by Pages for any missing path on the host; not
  indexed.

The icons are copied from `site/assets/` in
[betaflight-designer-fonts](https://github.com/volempdoge/betaflight-designer-fonts),
made by its `tools/favicon.py`.
