import { getSearchItems } from '../lib/searchIndex';
import { searchSite } from '../lib/search';

const items = getSearchItems();

function assertMatch(query: string, expectedHref: string, expectedKind?: string) {
  const results = searchSite(items, query, 8);
  const match = results.find(
    ({ item }) => item.href === expectedHref && (!expectedKind || item.kind === expectedKind),
  );

  if (!match) {
    const returned = results.map(({ item }) => `${item.kind}: ${item.href}`).join(', ') || 'none';
    throw new Error(`Search for "${query}" did not return ${expectedHref}. Returned: ${returned}`);
  }
}

assertMatch('Kmart', '/brands/kmart/', 'brand');
assertMatch('Springfree', '/brands/springfree/', 'brand');
assertMatch('Gee Tramp', '/brands/geetramp/', 'brand');
assertMatch('Ultra 2', '/brands/vuly/#ultra-2', 'model');
assertMatch('springfre', '/brands/springfree/', 'brand');
assertMatch('safety', '/trampolines-with-safety-nets/', 'guide');

console.log(`Validated ${items.length} search entries across brands, models, comparisons and guides.`);
