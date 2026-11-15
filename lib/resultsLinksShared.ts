// Client-safe half of the results page links: types and the choice of links for
// one set of recommendations. lib/resultsLinks.ts builds the index on the server.

export type LinkItem = { href: string; title: string };

export type CompareSideKey = {
  brand: string;
  /** Lower-case model names, or null when the side covers the whole brand. */
  models: string[] | null;
};

export type ResultsLinkIndex = {
  compare: Array<LinkItem & { sides: [CompareSideKey, CompareSideKey] }>;
  /** Keyed by quiz model slug. */
  models: Record<string, { brand: string; model: string; review?: LinkItem }>;
};

export type ResultsLinkGroup = { heading: string; links: LinkItem[] };

type Pick = { slug: string };

function sideMatches(side: CompareSideKey, model: { brand: string; model: string }): boolean {
  if (side.brand !== model.brand) return false;
  return side.models === null || side.models.includes(model.model.toLowerCase());
}

/** The comparison covering two recommended models: a model page first, then a brand page. */
function comparisonFor(
  index: ResultsLinkIndex,
  a: { brand: string; model: string },
  b: { brand: string; model: string },
): LinkItem | null {
  const matches = index.compare.filter(
    ({ sides }) =>
      (sideMatches(sides[0], a) && sideMatches(sides[1], b)) ||
      (sideMatches(sides[0], b) && sideMatches(sides[1], a)),
  );
  const specificity = (page: (typeof matches)[number]) => page.sides.filter((side) => side.models).length;
  const best = matches.sort((x, y) => specificity(y) - specificity(x))[0];
  return best ? { href: best.href, title: best.title } : null;
}

function unique(links: Array<LinkItem | null | undefined>): LinkItem[] {
  const seen = new Set<string>();
  return links.filter((link): link is LinkItem => {
    if (!link || seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}

export function selectResultLinks(index: ResultsLinkIndex, picks: Pick[]): ResultsLinkGroup[] {
  const models = picks.map((pick) => index.models[pick.slug]).filter(Boolean);

  const pairs: Array<[number, number]> = [[0, 1], [0, 2], [1, 2]];
  const comparisons = unique(
    pairs.map(([a, b]) => (models[a] && models[b] ? comparisonFor(index, models[a], models[b]) : null)),
  );
  const reviews = unique(models.map((model) => model.review));

  return [
    { heading: 'Compare your matches', links: comparisons },
    { heading: 'Video reviews', links: reviews },
  ].filter((group) => group.links.length > 0);
}
