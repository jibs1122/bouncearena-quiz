export type SearchItemKind =
  | 'brand'
  | 'model'
  | 'review'
  | 'comparison'
  | 'guide'
  | 'page';

export type SearchItem = {
  id: string;
  title: string;
  href: string;
  kind: SearchItemKind;
  description: string;
  keywords: string[];
  priority?: number;
  suggested?: boolean;
};

export type SearchResult = {
  item: SearchItem;
  score: number;
};

const KIND_BONUS: Record<SearchItemKind, number> = {
  brand: 8,
  model: 6,
  comparison: 4,
  review: 3,
  guide: 2,
  page: 1,
};

export function getSearchKindLabel(kind: SearchItemKind): string {
  if (kind === 'brand') return 'Brand';
  if (kind === 'model') return 'Model';
  if (kind === 'review') return 'Review';
  if (kind === 'comparison') return 'Comparison';
  if (kind === 'guide') return 'Guide';
  return 'Page';
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function toSearchAnchor(value: string): string {
  return normalizeSearchText(value).replace(/\s+/g, '-');
}

function singularize(token: string): string {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 4 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let aIndex = 1; aIndex <= a.length; aIndex += 1) {
    const current = [aIndex];
    for (let bIndex = 1; bIndex <= b.length; bIndex += 1) {
      const substitution = previous[bIndex - 1] + (a[aIndex - 1] === b[bIndex - 1] ? 0 : 1);
      current[bIndex] = Math.min(
        current[bIndex - 1] + 1,
        previous[bIndex] + 1,
        substitution,
      );
    }
    previous = current;
  }

  return previous[b.length];
}

function tokenScore(queryToken: string, candidateToken: string): number {
  if (queryToken === candidateToken) return 20;
  if (singularize(queryToken) === singularize(candidateToken)) return 18;
  if (queryToken.length >= 2 && candidateToken.startsWith(queryToken)) return 14;
  if (candidateToken.length >= 3 && queryToken.startsWith(candidateToken)) return 10;

  const maxDistance = queryToken.length >= 8 ? 2 : queryToken.length >= 4 ? 1 : 0;
  if (maxDistance > 0 && Math.abs(queryToken.length - candidateToken.length) <= maxDistance) {
    const distance = editDistance(queryToken, candidateToken);
    if (distance <= maxDistance) return 9 - distance;
  }

  return 0;
}

function scoreItem(item: SearchItem, normalizedQuery: string): number {
  const queryTokens = normalizedQuery.split(' ');
  const title = normalizeSearchText(item.title);
  const description = normalizeSearchText(item.description);
  const keywords = item.keywords.map(normalizeSearchText).filter(Boolean);
  const fields = [title, description, ...keywords];
  const candidateTokens = [...new Set(fields.flatMap((field) => field.split(' ')))];
  let score = 0;

  if (title === normalizedQuery) score += 150;
  else if (title.startsWith(normalizedQuery)) score += 90;
  else if (title.includes(normalizedQuery)) score += 60;

  if (keywords.some((keyword) => keyword === normalizedQuery)) score += 100;
  else if (keywords.some((keyword) => keyword.startsWith(normalizedQuery))) score += 55;
  else if (fields.some((field) => field.includes(normalizedQuery))) score += 30;

  for (const queryToken of queryTokens) {
    let bestTokenScore = 0;
    for (const candidateToken of candidateTokens) {
      bestTokenScore = Math.max(bestTokenScore, tokenScore(queryToken, candidateToken));
      if (bestTokenScore === 20) break;
    }

    // Every word must have a plausible match. This keeps broad terms such as
    // "trampoline" from rescuing an otherwise unrelated result.
    if (bestTokenScore === 0) return 0;
    score += bestTokenScore;
  }

  score += KIND_BONUS[item.kind];
  score += Math.min(item.priority ?? 0, 100) / 100;
  return score;
}

export function searchSite(
  items: SearchItem[],
  query: string,
  limit = Number.POSITIVE_INFINITY,
): SearchResult[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return items
      .filter((item) => item.suggested)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.title.localeCompare(b.title))
      .slice(0, limit)
      .map((item) => ({ item, score: item.priority ?? 0 }));
  }

  return items
    .map((item) => ({ item, score: scoreItem(item, normalizedQuery) }))
    .filter((result) => result.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.item.priority ?? 0) - (a.item.priority ?? 0) ||
        a.item.title.localeCompare(b.item.title),
    )
    .slice(0, limit);
}
