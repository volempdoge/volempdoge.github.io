// The language-dependent part of <head>: title, description, canonical and
// hreflang links, Open Graph and Twitter cards, and ProfilePage structured
// data. scripts/prerender.mjs puts it between <!--head:start--> and
// <!--head:end--> in index.html.
import { EMAIL, GITHUB_URL, LINKEDIN_URL, PAGES, SITE_URL, SKILLS, TEXT } from '../src/content.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const meta = (attr, key, content) => `<meta ${attr}="${key}" content="${esc(content)}" />`;

export const pageUrl = (lang) => SITE_URL + PAGES[lang].path;
export const ogImage = (lang) => SITE_URL + '/og/' + PAGES[lang].htmlLang + '.png';
export const OG_SIZE = { width: 1200, height: 630 };

/** JSON-LD for the page, see https://developers.google.com/search/docs/appearance/structured-data/profile-page */
export function structuredData(lang, dateModified) {
  const other = lang === 'en' ? 'ua' : 'en';
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: pageUrl(lang),
    inLanguage: PAGES[lang].htmlLang,
    ...(dateModified ? { dateModified } : {}),
    mainEntity: {
      '@type': 'Person',
      name: TEXT[lang].name,
      alternateName: TEXT[other].name,
      jobTitle: [TEXT.en.titles.embedded, TEXT.en.titles.software],
      url: pageUrl('en'),
      email: 'mailto:' + EMAIL,
      address: { '@type': 'PostalAddress', addressLocality: 'Kyiv', addressCountry: 'UA' },
      alumniOf: [
        { '@type': 'CollegeOrUniversity', name: 'Kyiv School of Economics' },
        { '@type': 'CollegeOrUniversity', name: 'Kyiv National University of Construction and Architecture' },
      ],
      knowsAbout: [...SKILLS.lang, ...SKILLS.emb, 'Embedded systems', 'Firmware', 'Test automation'],
      knowsLanguage: ['uk', 'en'],
      sameAs: [GITHUB_URL, LINKEDIN_URL],
    },
  };
}

export function headTags(lang, { dateModified } = {}) {
  const p = PAGES[lang];
  const other = lang === 'en' ? 'ua' : 'en';
  const url = pageUrl(lang);
  const image = ogImage(lang);
  const json = JSON.stringify(structuredData(lang, dateModified)).replace(/</g, '\\u003c');
  const tags = [
    `<title>${esc(p.title)}</title>`,
    meta('name', 'description', p.description),
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" hreflang="en" href="${pageUrl('en')}" />`,
    `<link rel="alternate" hreflang="uk" href="${pageUrl('ua')}" />`,
    `<link rel="alternate" hreflang="x-default" href="${pageUrl('en')}" />`,
    meta('property', 'og:type', 'profile'),
    meta('property', 'og:site_name', 'volempdoge'),
    meta('property', 'og:url', url),
    meta('property', 'og:title', p.title),
    meta('property', 'og:description', p.description),
    meta('property', 'og:locale', p.locale),
    meta('property', 'og:locale:alternate', PAGES[other].locale),
    meta('property', 'og:image', image),
    meta('property', 'og:image:type', 'image/png'),
    meta('property', 'og:image:width', OG_SIZE.width),
    meta('property', 'og:image:height', OG_SIZE.height),
    meta('property', 'og:image:alt', p.ogImageAlt),
    meta('property', 'profile:first_name', TEXT[lang].name.split(' ')[0]),
    meta('property', 'profile:last_name', TEXT[lang].name.split(' ')[1]),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', p.title),
    meta('name', 'twitter:description', p.description),
    meta('name', 'twitter:image', image),
    meta('name', 'twitter:image:alt', p.ogImageAlt),
    `<script type="application/ld+json">${json}</script>`,
  ];
  // The Ukrainian page needs the Cyrillic subsets for its first paint.
  if (lang === 'ua') {
    for (const f of ['sans-cyrillic-300', 'sans-cyrillic-400', 'mono-cyrillic-400', 'mono-cyrillic-500']) {
      tags.push(`<link rel="preload" href="/fonts/ibm-plex-${f}.woff2" as="font" type="font/woff2" crossorigin />`);
    }
  }
  return tags.join('\n    ');
}

/** sitemap-cv.xml: both pages, each listing the other as an alternate. */
export function sitemap(lastmod) {
  const alternates = ['en', 'ua']
    .map((l) => `    <xhtml:link rel="alternate" hreflang="${PAGES[l].htmlLang}" href="${pageUrl(l)}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl('en')}"/>`)
    .join('\n');
  const urls = ['en', 'ua']
    .map((l) =>
      [
        `  <url>`,
        `    <loc>${pageUrl(l)}</loc>`,
        alternates,
        ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
        `  </url>`,
      ].join('\n'),
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}
