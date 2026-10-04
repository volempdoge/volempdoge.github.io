import { describe, expect, it } from 'vitest';
import { PAGES } from '../../src/content.js';
import { headTags, sitemap, structuredData } from '../../scripts/head.mjs';

const attr = (html, sel) => html.match(new RegExp(`${sel}" content="([^"]*)"`))?.[1];

describe('head', () => {
  it.each(['en', 'ua'])('has a complete social card for %s', (lang) => {
    const html = headTags(lang);
    const img = 'https://volempdoge.github.io/og/' + PAGES[lang].htmlLang + '.png';
    expect(html).toContain(`<title>${PAGES[lang].title.replace(/&/g, '&amp;')}</title>`);
    expect(attr(html, 'og:image')).toBe(img);
    expect(attr(html, 'twitter:image')).toBe(img);
    expect(attr(html, 'twitter:card')).toBe('summary_large_image');
    expect(attr(html, 'og:image:width')).toBe('1200');
    expect(attr(html, 'og:image:height')).toBe('630');
    expect(attr(html, 'og:url')).toBe('https://volempdoge.github.io' + PAGES[lang].path);
    expect(html).toContain(`<link rel="canonical" href="https://volempdoge.github.io${PAGES[lang].path}" />`);
  });

  it('keeps titles and descriptions within search result limits', () => {
    for (const p of Object.values(PAGES)) {
      expect(p.title.length).toBeLessThanOrEqual(60);
      expect(p.description.length).toBeGreaterThanOrEqual(110);
      expect(p.description.length).toBeLessThanOrEqual(160);
    }
  });

  it('links both languages both ways', () => {
    for (const lang of ['en', 'ua']) {
      const html = headTags(lang);
      expect(html).toContain('hreflang="en" href="https://volempdoge.github.io/"');
      expect(html).toContain('hreflang="uk" href="https://volempdoge.github.io/uk/"');
      expect(html).toContain('hreflang="x-default" href="https://volempdoge.github.io/"');
    }
  });

  it('describes the profile in JSON-LD that survives the script tag', () => {
    const html = headTags('ua', { dateModified: '2026-10-05T00:00:00+03:00' });
    const json = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
    expect(json).toEqual(structuredData('ua', '2026-10-05T00:00:00+03:00'));
    expect(json['@type']).toBe('ProfilePage');
    expect(json.mainEntity).toMatchObject({ '@type': 'Person', name: 'Володимир Мироненко' });
  });
});

describe('sitemap', () => {
  it('lists both pages with alternates and lastmod', () => {
    const xml = sitemap('2026-10-05T00:00:00+03:00');
    expect(xml.match(/<loc>/g)).toHaveLength(2);
    expect(xml).toContain('<loc>https://volempdoge.github.io/uk/</loc>');
    expect(xml.match(/hreflang="x-default"/g)).toHaveLength(2);
    expect(xml.match(/<lastmod>2026-10-05T00:00:00\+03:00<\/lastmod>/g)).toHaveLength(2);
  });
});
