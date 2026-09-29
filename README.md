# volempdoge.github.io

The root of `https://volempdoge.github.io/`. It exists for what only a host's
root can do for the project sites under it:

- `favicon.*` and the `<link rel="icon">` in `index.html`: Google Search keeps
  one favicon per host and reads it off this page.
- `robots.txt`: only read at the root of a host, so this is where the project
  sitemaps are listed.
- `sitemap.xml`: an index of the project sitemaps, so that `sitemap.xml`
  submitted in Search Console for the host resolves to something.

The icons are copied from `site/assets/` in
[betaflight-designer-fonts](https://github.com/volempdoge/betaflight-designer-fonts),
made by its `tools/favicon.py`.
