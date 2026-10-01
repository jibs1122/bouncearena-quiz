import type { Brand, DealLink } from './brands';

/** Must match QUIZ_BLOCK_RE in app/(site)/[slug]/page.tsx, which swaps it for the quiz card. */
export const QUIZ_CTA_BLOCK = `### Take the Quiz

Our Trampoline Quiz guides you through the key decisions you should make when choosing a trampoline and recommends the best options based on your preferences.

[Take the Quiz](/quiz)`;

const MONTH_HEADING_PREFIX = '## Australia Trampoline Sales ';

export function codeSentence(brand: Brand): string | null {
  if (!brand.promo) return null;
  const clauses = brand.promo.codes.map((code, index) => {
    const note = brand.codeNotes[code];
    if (!note) throw new Error(`${brand.name}: no codeNotes entry for promo code ${code} in scripts/deals/brands.ts.`);
    return `${index === 0 ? 'Code' : 'code'} **${code}** ${note}`;
  });
  return `${clauses.join(', and ')}.`;
}

function linkLine(link: DealLink, partner: boolean): string {
  // SmartLink marks partner links sponsored. A brand we have no program with gets a plain
  // nofollow link, which markdown can't express. MDX doesn't pass raw <a> tags through
  // SmartLink, so the tag sets its own target.
  return partner
    ? `[${link.label}](${link.href})`
    : `<a href="${link.href}" target="_blank" rel="nofollow noopener noreferrer">${link.label}</a>`;
}

export function brandBlock(brand: Brand, paragraph: string, onSale: boolean): string {
  const code = codeSentence(brand);
  const body = code ? `${paragraph} ${code}` : paragraph;
  return `### ${brand.name}\n\n${body}\n\n${linkLine(onSale ? brand.saleLink : brand.noSaleLink, brand.partner)}`;
}

export function monthSection(monthYear: string, blocks: string[]): string {
  return `${MONTH_HEADING_PREFIX}${monthYear}\n\n${blocks.join('\n\n')}\n\n${QUIZ_CTA_BLOCK}\n`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Replaces this month's section if it exists, otherwise adds it above the previous months. */
export function insertMonthSection(post: string, section: string, monthYear: string): string {
  const withoutQuiz = post.replace(new RegExp(`${escapeRegExp(QUIZ_CTA_BLOCK)}\\s*`, 'g'), '').trimEnd();
  const thisMonth = new RegExp(
    `^${escapeRegExp(MONTH_HEADING_PREFIX + monthYear)}\\n[\\s\\S]*?(?=^${escapeRegExp(MONTH_HEADING_PREFIX)}|(?![\\s\\S]))`,
    'm',
  );
  const rest = withoutQuiz.replace(thisMonth, '').replace(/\n{3,}/g, '\n\n').trimEnd();

  const firstMonth = rest.search(new RegExp(`^${escapeRegExp(MONTH_HEADING_PREFIX)}`, 'm'));
  if (firstMonth === -1) throw new Error(`No "${MONTH_HEADING_PREFIX}..." heading found in the deals post.`);

  return `${rest.slice(0, firstMonth)}${section}\n${rest.slice(firstMonth)}`.trimEnd() + '\n';
}
