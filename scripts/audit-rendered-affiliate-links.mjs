const base = process.argv[2] ?? 'http://127.0.0.1:3017';
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => new URL(match[1]).pathname,
);

const springfreeAliases = new Set([
  'springfree',
  'springfree-trampolines',
  'springfree-mini-round',
  'springfree-compact-round',
  'springfree-medium-round',
  'springfree-jumbo-round',
  'springfree-compact-oval',
  'springfree-medium-oval',
  'springfree-large-oval',
  'springfree-jumbo-oval',
  'springfree-medium-square',
  'springfree-large-square',
  'springfree-jumbo-square',
  'spring-vs-springless',
  'how-much-space-do-you-need-for-a-trampoline',
  'trampoline-standards',
  'springfree-rectangle-vs-round-trampoline',
  'springfree-compare-trampoline-models',
]);
const internalRequest = { headers: { 'x-forwarded-for': '127.0.0.1' } };

const pages = [];
for (let index = 0; index < paths.length; index += 12) {
  const batch = await Promise.all(
    paths.slice(index, index + 12).map(async (path) => ({
      path,
      html: await (await fetch(`${base}${path}`, internalRequest)).text(),
    })),
  );
  pages.push(...batch);
}

const anchors = pages.flatMap(({ path, html }) =>
  [...html.matchAll(/<a\b[^>]*\bhref=(?:"([^"]*)"|'([^']*)')[^>]*>/gi)].map(
    (match) => ({
      page: path,
      href: (match[1] || match[2]).replaceAll('&amp;', '&'),
    }),
  ),
);

const vulyLinks = anchors.filter(({ href }) => {
  try {
    return /(^|\.)vulyplay\.com$/i.test(new URL(href, base).hostname);
  } catch {
    return false;
  }
});
const badVulyLinks = vulyLinks.filter(({ href }) => {
  const { pathname } = new URL(href, base);
  return pathname !== '/aff/100' && pathname !== '/aff/100/';
});
const directSpringfreeLinks = anchors.filter(({ href }) =>
  /springfreetrampoline\.com\.au|t\.cfjump\.com/i.test(href),
);
const springfreeGoLinks = anchors.filter(({ href }) => {
  try {
    const match = new URL(href, base).pathname.match(/^\/go\/([^/]+)\/?$/);
    return Boolean(match && springfreeAliases.has(match[1]));
  } catch {
    return false;
  }
});
const renderedSpringfreePaths = [
  ...new Set(springfreeGoLinks.map(({ href }) => new URL(href, base).pathname)),
].sort();
const springfreePathsToTest = [...springfreeAliases]
  .map((slug) => `/go/${slug}/`)
  .sort();

const redirectTests = [];
for (const path of springfreePathsToTest) {
  const response = await fetch(`${base}${path}`, {
    ...internalRequest,
    redirect: 'manual',
  });
  const location = response.headers.get('location');
  redirectTests.push({
    path,
    status: response.status,
    location,
    commissionFactory: /^https:\/\/t\.cfjump\.com\/59728\/t\/87128(?:\?|$)/.test(
      location ?? '',
    ),
  });
}

const result = {
  pages: pages.length,
  anchors: anchors.length,
  vulyLinks: vulyLinks.length,
  badVulyLinks,
  directSpringfreeLinks,
  springfreeGoLinks: springfreeGoLinks.length,
  renderedSpringfreePaths,
  redirectTests,
};

console.log(JSON.stringify(result, null, 2));

if (
  badVulyLinks.length > 0 ||
  directSpringfreeLinks.length > 0 ||
  redirectTests.length === 0 ||
  redirectTests.some(({ status, commissionFactory }) => status !== 308 || !commissionFactory)
) {
  process.exitCode = 1;
}
