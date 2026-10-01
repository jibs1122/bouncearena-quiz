/**
 * Adds this month's section to content/blog/trampoline-deals-sales.mdx.
 *
 * For each brand: load its pages in a real browser, read structured price data where the
 * store exposes it, have Claude record the trampoline deal as facts, keep only facts that
 * can be traced to the evidence, write a paragraph from those facts alone, and check the
 * paragraph against the house voice. Links and promo codes are added in code. A brand that
 * fails any step is left out and listed in the report rather than published.
 *
 *   npm run update:trampoline-deals                 # all brands
 *   npm run update:trampoline-deals -- --dry-run    # print the section, write nothing to the post
 *   npm run update:trampoline-deals -- --brand Vuly # one brand (repeatable), always a dry run
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { Browser } from 'playwright';
import { BRANDS, type Brand } from './deals/brands';
import { capturePage, launchBrowser, type PageCapture } from './deals/capture';
import { extractFacts, transcribeBanners, writeParagraph, type Facts } from './deals/claude';
import { checkParagraph, factsForWriter, verifyFacts, type DroppedFact } from './deals/checks';
import { brandBlock, insertMonthSection, monthSection } from './deals/page';
import {
  fetchShopifyTrampolines,
  parseVulyTiles,
  summariseStructured,
  type StructuredData,
} from './deals/structured';

const ROOT = process.cwd();
const POST_FILE = path.join(ROOT, 'content', 'blog', 'trampoline-deals-sales.mdx');
const HISTORY_DIR = path.join(ROOT, 'deals-history');
const CACHE_DIR = path.join(ROOT, '.deals-cache');
const TIME_ZONE = 'Australia/Melbourne';

type Status = 'published' | 'code-only' | 'no-deal' | 'dropped';

type BrandResult = {
  brand: Brand;
  status: Status;
  reason?: string;
  block?: string;
  paragraph?: string;
  facts?: Facts;
  droppedFacts: DroppedFact[];
  copyProblems: string[];
  structured?: StructuredData;
  pages: { url: string; status: number | null; ok: boolean; error?: string }[];
};

function parseArgs(argv: string[]) {
  const options = { dryRun: false, brands: [] as string[] };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--dry-run') options.dryRun = true;
    else if (argv[i] === '--brand' && argv[i + 1]) options.brands.push(argv[(i += 1)]);
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  // Writing a single brand would replace the whole month's section with that one brand.
  if (options.brands.length > 0) options.dryRun = true;
  return options;
}

function dateParts(now: Date) {
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-AU', { timeZone: TIME_ZONE, ...options }).format(now);
  return {
    monthYear: format({ month: 'long', year: 'numeric' }),
    month: format({ month: 'long' }),
    day: format({ day: 'numeric', month: 'long' }),
    fullDate: format({ day: 'numeric', month: 'long', year: 'numeric' }),
    key: `${format({ year: 'numeric' })}-${format({ month: '2-digit' })}`,
  };
}

async function loadStructured(brand: Brand, captures: PageCapture[]): Promise<StructuredData | undefined> {
  const source = brand.structured;
  if (!source) return undefined;
  if (source.kind === 'shopify') return fetchShopifyTrampolines(source.productsUrl);
  const page = captures.find((capture) => capture.url === source.pageUrl && capture.ok);
  if (!page) throw new Error(`${source.pageUrl} did not load.`);
  return parseVulyTiles(page.html, source.pageUrl);
}

async function linkLoads(browser: Browser, url: string, captures: PageCapture[]): Promise<boolean> {
  const captured = captures.find((capture) => capture.url === url);
  if (captured) return captured.ok;
  return (await capturePage(browser, url, false)).ok;
}

async function processBrand(brand: Brand, browser: Browser, dates: ReturnType<typeof dateParts>): Promise<BrandResult> {
  const result: BrandResult = { brand, status: 'dropped', droppedFacts: [], copyProblems: [], pages: [] };
  const drop = (reason: string) => Object.assign(result, { status: 'dropped' as const, reason });

  const captures: PageCapture[] = [];
  for (const page of brand.pages) captures.push(await capturePage(browser, page.url, page.screenshot));
  result.pages = captures.map(({ url, status, ok, error }) => ({ url, status, ok, error }));
  await saveCaptures(dates.key, brand, captures);

  const loaded = captures.filter((capture) => capture.ok && capture.text);
  if (loaded.length === 0) return drop('none of its pages loaded');

  try {
    result.structured = await loadStructured(brand, captures);
  } catch (error) {
    return drop(`structured price data failed: ${error instanceof Error ? error.message : error}`);
  }
  const structured = result.structured ? summariseStructured(result.structured) : null;

  const facts = await extractFacts(brand.name, dates.fullDate, structured, loaded);
  result.facts = facts;
  const pageText = loaded.map((capture) => capture.text).join('\n');

  if (!facts.trampolineDeal) {
    if (!brand.promo) return Object.assign(result, { status: 'no-deal' as const });
    const paragraph = `${brand.name} wasn't running a trampoline sale on ${dates.day}.`;
    return finish(result, brand, browser, captures, paragraph, false, 'code-only');
  }

  const usesImages = [...facts.offers, ...facts.examples, ...facts.conditions].some((f) => f.source === 'image');
  const bannerText = usesImages ? await transcribeBanners(loaded.flatMap((capture) => capture.screenshots)) : [];
  const verified = verifyFacts(facts, {
    text: `${pageText}\n${structured ? JSON.stringify(structured) : ''}`,
    bannerText,
  });
  result.droppedFacts = verified.dropped;
  if (verified.facts.offers.length === 0 && verified.facts.examples.length === 0) {
    return drop('a sale was found but none of its details could be traced to the evidence');
  }

  const writerFacts = factsForWriter(verified.facts);
  let paragraph = await writeParagraph(brand.name, dates.monthYear, writerFacts);
  let problems = checkParagraph(paragraph, writerFacts, pageText, dates.fullDate);
  if (problems.length > 0) {
    paragraph = await writeParagraph(brand.name, dates.monthYear, writerFacts, problems);
    problems = checkParagraph(paragraph, writerFacts, pageText, dates.fullDate);
  }
  result.paragraph = paragraph;
  result.copyProblems = problems;
  if (problems.length > 0) return drop('the paragraph failed the copy checks twice');

  return finish(result, brand, browser, captures, paragraph, true, 'published');
}

async function finish(
  result: BrandResult,
  brand: Brand,
  browser: Browser,
  captures: PageCapture[],
  paragraph: string,
  onSale: boolean,
  status: Status,
): Promise<BrandResult> {
  const link = onSale ? brand.saleLink : brand.noSaleLink;
  if (!(await linkLoads(browser, link.checkUrl, captures))) {
    return Object.assign(result, { status: 'dropped' as const, reason: `link target did not load: ${link.checkUrl}` });
  }
  return Object.assign(result, { status, paragraph, block: brandBlock(brand, paragraph, onSale) });
}

async function saveCaptures(key: string, brand: Brand, captures: PageCapture[]) {
  const dir = path.join(CACHE_DIR, key, brand.name.toLowerCase().replace(/\W+/g, '-'));
  await fs.mkdir(dir, { recursive: true });
  for (const [index, capture] of captures.entries()) {
    await fs.writeFile(path.join(dir, `page-${index + 1}.txt`), `${capture.url}\n\n${capture.text}`);
    for (const [tile, image] of capture.screenshots.entries()) {
      await fs.writeFile(path.join(dir, `page-${index + 1}-tile-${tile + 1}.jpg`), image);
    }
  }
}

function report(results: BrandResult[], dates: ReturnType<typeof dateParts>): string {
  const lines = [`# Trampoline deals: ${dates.monthYear}`, '', `Checked ${dates.fullDate}.`, ''];
  for (const result of results) {
    const label = {
      published: 'Published',
      'code-only': 'Published (no sale, promo code only)',
      'no-deal': 'Left out (no trampoline sale)',
      dropped: 'Left out (failed a check)',
    }[result.status];
    lines.push(`## ${result.brand.name}: ${label}`, '');
    if (result.reason) lines.push(`Reason: ${result.reason}`, '');
    for (const page of result.pages.filter((p) => !p.ok)) {
      lines.push(`- Page failed: ${page.url} (${page.error ?? `HTTP ${page.status}`})`);
    }
    for (const fact of result.droppedFacts) lines.push(`- Fact left out: "${fact.fact}" (${fact.reason})`);
    for (const problem of result.copyProblems) lines.push(`- Copy check: ${problem}`);
    if (result.paragraph) lines.push('', `> ${result.paragraph}`);
    lines.push('');
  }
  return lines.join('\n');
}

async function main() {
  try {
    process.loadEnvFile(path.join(ROOT, '.env.local'));
  } catch {
    // CI passes ANTHROPIC_API_KEY as an environment variable instead.
  }

  const options = parseArgs(process.argv.slice(2));
  const dates = dateParts(new Date());
  const brands =
    options.brands.length > 0
      ? BRANDS.filter((brand) => options.brands.some((name) => name.toLowerCase() === brand.name.toLowerCase()))
      : BRANDS;
  if (brands.length === 0) throw new Error(`No brands match ${options.brands.join(', ')}.`);

  console.log(`Checking ${brands.length} brand(s) for ${dates.monthYear}...`);
  const browser = await launchBrowser();
  let results: BrandResult[];
  try {
    results = await Promise.all(
      brands.map(async (brand) => {
        try {
          const result = await processBrand(brand, browser, dates);
          console.log(`${brand.name}: ${result.status}${result.reason ? ` (${result.reason})` : ''}`);
          return result;
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          console.log(`${brand.name}: dropped (${reason})`);
          return { brand, status: 'dropped' as const, reason, droppedFacts: [], copyProblems: [], pages: [] };
        }
      }),
    );
  } finally {
    await browser.close();
  }

  const reportText = report(results, dates);
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(path.join(CACHE_DIR, 'report.md'), reportText);
  if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, reportText);

  const needsAttention = results.some((r) => r.status === 'dropped' || r.droppedFacts.length > 0);
  if (process.env.GITHUB_OUTPUT) {
    await fs.appendFile(process.env.GITHUB_OUTPUT, `needs_attention=${needsAttention}\n`);
  }

  // Sales first, then brands listed only for their promo code.
  const blocks = [
    ...results.filter((r) => r.status === 'published'),
    ...results.filter((r) => r.status === 'code-only'),
  ].map((r) => r.block as string);

  if (blocks.length === 0) {
    console.error('Nothing passed the checks, so the post was not changed. See .deals-cache/report.md.');
    process.exitCode = 1;
    return;
  }

  const section = monthSection(dates.monthYear, blocks);
  if (options.dryRun) {
    console.log(`\n${section}\n${reportText}`);
    return;
  }

  const post = await fs.readFile(POST_FILE, 'utf8');
  await fs.writeFile(POST_FILE, insertMonthSection(post, section, dates.monthYear));

  await fs.mkdir(HISTORY_DIR, { recursive: true });
  const history = results.map((r) => ({
    brand: r.brand.name,
    status: r.status,
    reason: r.reason ?? null,
    facts: r.facts ?? null,
    droppedFacts: r.droppedFacts,
    paragraph: r.paragraph ?? null,
    prices: r.structured?.rows ?? null,
  }));
  await fs.writeFile(
    path.join(HISTORY_DIR, `${dates.key}.json`),
    `${JSON.stringify({ checked: dates.fullDate, brands: history }, null, 2)}\n`,
  );

  console.log(`\nUpdated ${path.relative(ROOT, POST_FILE)} with ${blocks.length} brand(s).\n\n${reportText}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
