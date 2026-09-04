/**
 * Validates content/compare/*.mdx against the comparison content contract.
 *
 * Runs as a prebuild hook, so a page that claims a spec the data doesn't support,
 * collides with an existing URL, or drops a required section fails the build
 * rather than shipping.
 *
 *   npm run validate:comparisons
 */

import fs from 'fs';
import path from 'path';
import { TRAMPOLINES, type Trampoline } from '../data/trampolines';
import { getAllComparePages, resolveSideRows, type ComparePage } from '../lib/comparePages';
import { getAllSlugs } from '../lib/content';

const REQUIRED_SECTIONS = ['Quick verdict', 'Full spec comparison'];

/** Routes that would collide with /compare/<slug>/ or a root-level MDX slug. */
const RESERVED_SLUGS = new Set([
  'quiz',
  'results',
  'compare',
  'models',
  'comparisons',
  'reviews',
  'blog',
  'search',
  'about',
  'contact',
  'privacy-policy',
  'terms-of-use',
  'earnings-disclaimer',
  'admin',
  'go',
  'api',
]);

const BANNED_PHRASES = [
  'the best trampoline',
  'best trampoline on the market',
  'unbeatable',
  'the winner is',
  'hands down',
  'guaranteed safe',
  'completely safe',
  'number one',
  '#1 trampoline',
];

const MAX_DESCRIPTION_LENGTH = 160;

type Issue = { file: string; message: string };

const errors: Issue[] = [];
const warnings: Issue[] = [];

function error(file: string, message: string) {
  errors.push({ file, message });
}

function warn(file: string, message: string) {
  warnings.push({ file, message });
}

function sectionHeadings(content: string): string[] {
  return [...content.matchAll(/^##\s+(.+?)\s*$/gm)].map((match) => match[1]);
}

/**
 * Every number a page states in prose should trace to a value on one of its own
 * resolved rows, so a data refresh can't leave stale figures behind.
 */
function checkProseNumbers(page: ComparePage, file: string) {
  let rows;
  try {
    rows = page.sides.flatMap(resolveSideRows);
  } catch {
    return; // Resolution errors are reported separately.
  }

  const known = new Set<number>();
  for (const row of rows) {
    for (const value of [
      row.priceAud,
      row.maxWeightKg,
      row.combinedWeightKg,
      row.staticWeightKg,
      row.springCount,
      row.warrantyFrameYrs,
      row.warrantyMatYrs,
      row.warrantyNetYrs,
      row.warrantyPartsYrs,
      row.overallDiamCm,
      row.overallLenCm,
      row.overallWidCm,
      row.matDiamCm,
      row.matLenCm,
      row.matWidCm,
      row.totalHeightCm,
      row.baScore,
    ]) {
      if (typeof value !== 'number') continue;
      known.add(value);
      known.add(Math.round(value / 30.48)); // feet
      known.add(Math.round((value / 30.48) * 10) / 10);
      known.add(Math.round(value / 100)); // metres
      known.add(Math.round((value / 100) * 10) / 10);
    }

    // Nominal sizes ("15 ft", "10 x 15 ft", "2.4 m x 3.4 m") are strings in the data
    // but read as numbers in prose, so treat their components as known values too.
    for (const match of `${row.size} ${row.priceBasis}`.matchAll(/(\d+(?:\.\d+)?)/g)) {
      known.add(Number(match[1]));
    }
  }

  // Differences between two known values are legitimate derivations.
  const derived = new Set<number>();
  for (const a of known) {
    for (const b of known) {
      if (a > b) derived.add(a - b);
    }
  }

  const body = page.content;
  const claims = [
    ...body.matchAll(/\$\s?([\d,]+(?:\.\d+)?)/g),
    ...body.matchAll(/(\d+(?:\.\d+)?)\s?(?:kg|kilograms?)/gi),
    ...body.matchAll(/(\d+(?:\.\d+)?)[-\s]?(?:year|yr)s?\b/gi),
    ...body.matchAll(/(\d+(?:\.\d+)?)\s?(?:cm|centimetres?)/gi),
    ...body.matchAll(/(\d+(?:\.\d+)?)\s?(?:ft|feet|foot)\b/gi),
  ];

  for (const claim of claims) {
    const value = Number(claim[1].replace(/,/g, ''));
    if (!Number.isFinite(value)) continue;
    if (known.has(value) || derived.has(value)) continue;
    // Small integers are usually counts of things ("two sizes"), not spec claims.
    if (value <= 12 && Number.isInteger(value)) continue;

    warn(
      file,
      `prose mentions "${claim[0].trim()}" but no resolved spec row (or difference between rows) has that value — verify it against data/trampolines.ts`,
    );
  }
}

type NumericSpecField =
  | 'maxWeightKg'
  | 'combinedWeightKg'
  | 'staticWeightKg'
  | 'warrantyFrameYrs'
  | 'warrantyMatYrs'
  | 'warrantyNetYrs'
  | 'warrantyPartsYrs';

function checkTypedNumericClaims(page: ComparePage, file: string) {
  let rows: Trampoline[];
  try {
    rows = page.sides.flatMap(resolveSideRows);
  } catch {
    return;
  }

  const valuesFor = (field: NumericSpecField) =>
    new Set(
      rows
        .map((row) => row[field])
        .filter((value): value is number => typeof value === 'number'),
    );

  const claimGroups: Array<{
    field: NumericSpecField;
    label: string;
    patterns: RegExp[];
  }> = [
    {
      field: 'combinedWeightKg',
      label: 'combined weight limit',
      patterns: [
        /(\d+(?:\.\d+)?)\s?(?:kg|kilograms?)\s+(?:combined|total user)\b/gi,
        /(?:combined|total user)\s+(?:weight|capacity|rating|limit)[^.!?\n]{0,40}?(\d+(?:\.\d+)?)\s?(?:kg|kilograms?)/gi,
      ],
    },
    {
      field: 'staticWeightKg',
      label: 'static weight rating',
      patterns: [
        /(\d+(?:\.\d+)?)\s?(?:kg|kilograms?)\s+(?:static|frame[- ]tested|test load)\b/gi,
        /(?:static|frame[- ]tested|test load)[^.!?\n]{0,40}?(\d+(?:\.\d+)?)\s?(?:kg|kilograms?)/gi,
      ],
    },
    {
      field: 'maxWeightKg',
      label: 'single-jumper limit',
      patterns: [
        /(\d+(?:\.\d+)?)\s?(?:kg|kilograms?)\s+(?:per|for (?:a |one )?)\s*jumper\b/gi,
      ],
    },
  ];

  for (const { field, label, patterns } of claimGroups) {
    const known = valuesFor(field);
    for (const pattern of patterns) {
      for (const match of page.content.matchAll(pattern)) {
        const value = Number(match[1]);
        if (!known.has(value)) {
          error(
            file,
            `prose assigns ${value} to the ${label}, but no resolved ${field} value has that number`,
          );
        }
      }
    }
  }

  const warrantyFields: Record<string, NumericSpecField> = {
    frame: 'warrantyFrameYrs',
    mat: 'warrantyMatYrs',
    net: 'warrantyNetYrs',
    part: 'warrantyPartsYrs',
    parts: 'warrantyPartsYrs',
  };

  for (const match of page.content.matchAll(
    /(\d+(?:\.\d+)?)[-\s]year\s+(frame|mat|net|parts?)\s+warrant(?:y|ies)/gi,
  )) {
    const value = Number(match[1]);
    const component = match[2].toLowerCase();
    const field = warrantyFields[component];
    if (!valuesFor(field).has(value)) {
      error(
        file,
        `prose assigns a ${value}-year ${component} warranty, but no resolved ${field} value has that number`,
      );
    }
  }
}

function validatePage(page: ComparePage, file: string, seenSlugs: Map<string, string>) {
  if (!page.title.trim()) error(file, 'title is required');
  if (!page.date.trim()) error(file, 'date is required');
  if (!page.description.trim()) error(file, 'description is required');
  if (page.description.length > MAX_DESCRIPTION_LENGTH) {
    error(
      file,
      `description is ${page.description.length} characters (max ${MAX_DESCRIPTION_LENGTH})`,
    );
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug)) {
    error(file, `slug "${page.slug}" must be lowercase kebab-case`);
  }

  const previous = seenSlugs.get(page.slug);
  if (previous) error(file, `slug "${page.slug}" is also used by ${previous}`);
  seenSlugs.set(page.slug, file);

  if (RESERVED_SLUGS.has(page.slug)) {
    error(file, `slug "${page.slug}" collides with an existing route`);
  }

  // Sides must resolve against the live spec data.
  for (const [index, side] of page.sides.entries()) {
    try {
      const rows = resolveSideRows(side);
      if (rows.length === 0) error(file, `sides[${index}] resolved to no rows`);
    } catch (cause) {
      error(file, `sides[${index}]: ${(cause as Error).message}`);
    }
  }

  // Body structure.
  const headings = sectionHeadings(page.content);
  for (const required of REQUIRED_SECTIONS) {
    if (!headings.some((heading) => heading.toLowerCase() === required.toLowerCase())) {
      error(file, `missing required section "## ${required}"`);
    }
  }

  const extra = headings.filter(
    (heading) => !REQUIRED_SECTIONS.some((required) => required.toLowerCase() === heading.toLowerCase()),
  );
  if (extra.length > 0) {
    error(file, `unexpected section heading(s): ${extra.map((h) => `"## ${h}"`).join(', ')}`);
  }

  const order = REQUIRED_SECTIONS.map((required) =>
    headings.findIndex((heading) => heading.toLowerCase() === required.toLowerCase()),
  );
  if (order.every((index) => index >= 0)) {
    const sorted = [...order].sort((a, b) => a - b);
    if (order.join() !== sorted.join()) {
      error(file, `sections must appear in order: ${REQUIRED_SECTIONS.join(' → ')}`);
    }
  }

  if (/^#\s+/m.test(page.content)) {
    error(file, 'body must not contain an H1 — the title frontmatter renders it');
  }

  if (/^\s*\|?[\s-]*\|[\s|-]*$/m.test(page.content) && /\|/.test(page.content)) {
    error(
      file,
      'body contains a markdown table — spec tables are rendered from data/trampolines.ts, not authored',
    );
  }

  // Internal links need the trailing slash the site enforces.
  for (const link of page.content.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    if (!link[1].endsWith('/') && !link[1].includes('#')) {
      error(file, `internal link "${link[1]}" must end with a trailing slash`);
    }
  }

  const lowerBody = page.content.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lowerBody.includes(phrase)) {
      warn(file, `contains "${phrase}" — comparisons segment by use case rather than declaring winners`);
    }
  }

  if (!/choose /i.test(page.content)) {
    warn(file, 'no "Choose X if…" guidance found — the intro should close with the two-sided verdict');
  }

  checkProseNumbers(page, file);
  checkTypedNumericClaims(page, file);
}

function main() {
  const compareDir = path.join(process.cwd(), 'content', 'compare');
  if (!fs.existsSync(compareDir)) {
    console.log('No content/compare directory — nothing to validate.');
    return;
  }

  let pages: ComparePage[];
  try {
    pages = getAllComparePages();
  } catch (cause) {
    console.error(`\n✖ Could not read comparison pages: ${(cause as Error).message}\n`);
    process.exit(1);
  }

  const postSlugs = new Set(getAllSlugs());
  const seenSlugs = new Map<string, string>();

  for (const page of pages) {
    const file = `content/compare/${page.slug}.mdx`;
    validatePage(page, file, seenSlugs);

    if (postSlugs.has(page.slug) && page.publishStatus === 'draft') {
      // While the replacement is a draft, the root-level article remains live.
      // Ready comparisons are intentionally handled by getSupersededSlugs(): the
      // article redirects and is removed from listings and the sitemap.
      warnings.push({
        file,
        message: `draft also exists as an article at /${page.slug}/ — the article remains live until this comparison is ready`,
      });
    }
  }

  const readyCount = pages.filter((page) => page.publishStatus === 'ready').length;
  const draftCount = pages.length - readyCount;

  for (const { file, message } of warnings) {
    console.warn(`⚠ ${file}: ${message}`);
  }
  for (const { file, message } of errors) {
    console.error(`✖ ${file}: ${message}`);
  }

  console.log(
    `\n${pages.length} comparison page(s): ${readyCount} ready, ${draftCount} draft. ` +
      `${TRAMPOLINES.length} spec rows available. ` +
      `${errors.length} error(s), ${warnings.length} warning(s).`,
  );

  if (errors.length > 0) process.exit(1);
}

main();
