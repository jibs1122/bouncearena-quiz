import type { Facts } from './claude';

/** "$1,099.00" -> ["1099"], "30%" -> ["30"], "6 October" -> ["6"]. */
export function numberTokens(text: string): string[] {
  const withoutThousands = text.replace(/(\d),(?=\d{3}\b)/g, '$1');
  return (withoutThousands.match(/\d+(?:\.\d+)?/g) ?? []).map((token) => token.replace(/\.0+$/, ''));
}

/** Lowercase words only, so "UP TO $250 OFF*" and "Up to $250 off" compare equal. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/(\d),(?=\d{3}\b)/g, '$1')
    .replace(/\$/g, ' $') // "$719.00$469.00" in a quote is "$719.00\n$469.00" on the page
    .replace(/[^a-z0-9%$]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Quotes may join fragments from different parts of a page with "...". Each must be on the page. */
function quoteFound(quote: string, text: string): boolean {
  const haystack = normalise(text);
  const fragments = quote
    .split(/\.{3}|…/)
    .map(normalise)
    .filter((fragment) => fragment.length >= 3);
  return fragments.length > 0 && fragments.every((fragment) => haystack.includes(fragment));
}

export type Evidence = {
  /** Visible page text plus the structured price data. */
  text: string;
  /** An independent transcription of banner text, for facts read from screenshots. */
  bannerText: string[];
};

type Item = { statement: string; source: Facts['offers'][number]['source']; evidence: string };

function checkItem(item: Item, evidence: Evidence): string | null {
  const text = item.source === 'image' ? evidence.bannerText.join('\n') : evidence.text;
  const numbers = new Set(numberTokens(text));
  const missing = numberTokens(item.statement).filter((token) => !numbers.has(token));
  if (missing.length > 0) {
    return `numbers not found in the ${item.source === 'image' ? 'banner transcription' : 'page evidence'}: ${missing.join(', ')}`;
  }
  // Structured evidence is a description of JSON fields, so only the numbers can be matched.
  if (item.source !== 'structured' && !quoteFound(item.evidence, text)) {
    return `quoted evidence not found ("${item.evidence}")`;
  }
  return null;
}

export type DroppedFact = { fact: string; reason: string };

/** Keeps only the facts that can be traced to the captured evidence. */
export function verifyFacts(facts: Facts, evidence: Evidence): { facts: Facts; dropped: DroppedFact[] } {
  const dropped: DroppedFact[] = [];
  const keep = <T>(items: T[], toItem: (item: T) => Item): T[] =>
    items.filter((entry) => {
      const item = toItem(entry);
      const reason = checkItem(item, evidence);
      if (reason) dropped.push({ fact: item.statement, reason });
      return !reason;
    });

  const offers = keep(facts.offers, (o) => ({ statement: o.offer, source: o.source, evidence: o.evidence }));
  const examples = keep(facts.examples, (e) => ({
    statement: `${e.product} ${e.saving}`,
    source: e.source,
    evidence: e.evidence,
  }));
  const conditions = keep(facts.conditions, (c) => ({
    statement: c.condition,
    source: c.source,
    evidence: c.evidence,
  }));

  // The end date and sale name carry no evidence field of their own, so their numbers must
  // appear somewhere in what was captured.
  const allNumbers = new Set(numberTokens(`${evidence.text}\n${evidence.bannerText.join('\n')}`));
  const traceable = (value: string | null, label: string) => {
    if (!value) return null;
    const missing = numberTokens(value).filter((token) => !allNumbers.has(token));
    if (missing.length === 0) return value;
    dropped.push({ fact: `${label}: ${value}`, reason: `numbers not found: ${missing.join(', ')}` });
    return null;
  };

  return {
    facts: {
      ...facts,
      saleName: traceable(facts.saleName, 'sale name'),
      ends: traceable(facts.ends, 'end date'),
      offers,
      examples,
      conditions,
    },
    dropped,
  };
}

/** The facts the writer sees: no evidence quotes, so it never reads the brand's own wording. */
export function factsForWriter(facts: Facts) {
  return {
    saleName: facts.saleName,
    ends: facts.ends,
    offers: facts.offers.map((o) => o.offer),
    examples: facts.examples.map((e) => ({ product: e.product, saving: e.saving })),
    conditions: facts.conditions.map((c) => c.condition),
  };
}

const BANNED: [RegExp, string][] = [
  [/!/, 'exclamation mark'],
  [/—|\s–\s/, 'em dash'],
  [/\?/, 'question'],
  [
    // "Biggest saving" is a plain comparison; "biggest sale ever" is hype.
    /\b(massive|huge|incredible|amazing|unbeatable|biggest (sale|deal|event)s?|(biggest|best)[- ]ever|epic|whopping|stunning|fantastic|awesome|exciting|unmissable|bargains?|steal|blowout|mega savings)\b/i,
    'hype word',
  ],
  [
    /\b(don'?t miss|do not miss|limited[- ]time|hurry|act fast|grab|snap up|while you can|take advantage|don'?t forget|be sure to|make sure)\b/i,
    'sales pressure',
  ],
  [/\b(shop now|check out|head to|sale now on|get yours)\b/i, 'call to action'],
  [/(^|[.]\s+)(buy|shop|grab|get|use|apply|check|head|visit|save|order|enjoy|take)\b/i, 'tells the reader what to do'],
  [/\b(seamless|robust|unlock|elevate|game[- ]chang\w*|must[- ]have|boasts?|perfect|ideal|great value|it'?s worth noting|look no further)\b/i, 'stock phrase'],
  [/\b(promo code|discount code|coupon|bounce arena)\b|\bcode\b/i, 'mentions codes or the site, which are added separately'],
  [/\bwe (tested|tried|reviewed)\b/i, 'claims testing'],
];

const DISCOUNT_WORDS =
  /\b(off|save|saves|saving|savings|discount|discounted|worth|valued|over|under|less|reduced|cheaper|spend|minimum)\b/i;
const OVERLAP_WORDS = 8;

export function checkParagraph(paragraph: string, writerFacts: unknown, pageText: string, month: string): string[] {
  const problems: string[] = [];

  for (const [pattern, label] of BANNED) {
    const match = paragraph.match(pattern);
    if (match) problems.push(`${label}: "${match[0].trim()}"`);
  }

  const words = paragraph.split(/\s+/).filter(Boolean);
  if (words.length < 8 || words.length > 100) problems.push(`${words.length} words; keep it between 8 and 100`);

  const allowed = new Set(numberTokens(`${JSON.stringify(writerFacts)} ${month}`));
  const invented = numberTokens(paragraph).filter((token) => !allowed.has(token));
  if (invented.length > 0) problems.push(`numbers that aren't in the facts: ${invented.join(', ')}`);

  // House voice: no exact prices in prose. A dollar figure has to read as a saving or a threshold.
  for (const match of paragraph.matchAll(/\$\s?[\d,]+(?:\.\d+)?/g)) {
    const start = match.index ?? 0;
    const window = paragraph.slice(Math.max(0, start - 30), start + match[0].length + 20);
    if (!DISCOUNT_WORDS.test(window)) problems.push(`states a price rather than a saving: "${match[0]}"`);
  }

  const source = ` ${normalise(pageText)} `;
  const tokens = normalise(paragraph).split(' ');
  for (let i = 0; i + OVERLAP_WORDS <= tokens.length; i += 1) {
    const phrase = tokens.slice(i, i + OVERLAP_WORDS).join(' ');
    if (source.includes(` ${phrase} `)) {
      problems.push(`repeats the brand's own wording: "${phrase}"`);
      break;
    }
  }

  return problems;
}
