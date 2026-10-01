import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

const MODEL = process.env.DEALS_MODEL ?? 'claude-opus-5';

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic({ maxRetries: 4 });
  return client;
}

const Source = z.enum(['structured', 'text', 'image']);

export const FactsSchema = z.object({
  trampolineDeal: z.boolean(),
  saleName: z.string().nullable(),
  ends: z.string().nullable(),
  offers: z.array(z.object({ offer: z.string(), source: Source, evidence: z.string() })),
  examples: z.array(
    z.object({ product: z.string(), saving: z.string(), source: Source, evidence: z.string() }),
  ),
  conditions: z.array(z.object({ condition: z.string(), source: Source, evidence: z.string() })),
});
export type Facts = z.infer<typeof FactsSchema>;

const BannerTextSchema = z.object({ lines: z.array(z.string()) });
const ParagraphSchema = z.object({ paragraph: z.string() });

type Content = Anthropic.Beta.BetaContentBlockParam[];

async function ask<T extends z.ZodType>(
  schema: T,
  system: string,
  content: Content,
  effort: 'medium' | 'high',
): Promise<z.infer<T>> {
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16_000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: { effort, format: betaZodOutputFormat(schema) },
    system,
    messages: [{ role: 'user', content }],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error(`Claude declined the request (${response.stop_details?.category ?? 'no category'}).`);
  }
  if (response.stop_reason === 'max_tokens') throw new Error('Claude ran out of output tokens.');
  if (!response.parsed_output) throw new Error('Claude returned no structured output.');
  return response.parsed_output;
}

function images(screenshots: Buffer[]): Content {
  return screenshots.map((data) => ({
    type: 'image',
    source: { type: 'base64', media_type: 'image/jpeg', data: data.toString('base64') },
  }));
}

export type EvidencePage = { url: string; title: string; text: string; screenshots: Buffer[] };

const EXTRACT_SYSTEM = `You read evidence captured from an Australian trampoline brand's website and record what trampoline sale or promotion is running on the day it was captured. Your output feeds a monthly deals page, and every fact you record is checked against the evidence before anything is published.

What counts:
- Trampolines and trampoline packages only. Ignore swing sets, monkey bars, playsets and accessories sold on their own. A free accessory that comes with a trampoline does count.
- Only offers a buyer can get from this website. An offer the site promotes but that is sold only through another retailer (such as a Costco-exclusive bundle) doesn't count, because the deals page links to this site.
- A deal is a current discount, reduced price, free item, or free delivery offered as part of a promotion. Finance options (Afterpay, Zip, interest-free), warranties, newsletter sign-ups, price-match policies, and delivery that is always free are not deals.
- If the evidence shows no current trampoline deal, set trampolineDeal to false and leave the lists empty. Record what the evidence shows, not what a store usually runs.

How to record it:
- offers: each distinct offer as one plain factual statement, e.g. "Up to $250 off FLEX and HERO trampolines". Strip hype and slogans ("massive", "biggest ever", "don't miss", "limited time"). Keep product names as the brand writes them.
- examples: specific trampolines with their saving, e.g. product "Thunder 2 Pro Large", saving "$200 off". At most four, choosing the biggest savings across different models.
- conditions: limits on the offer a buyer needs to know, such as regions, minimum spend, or what a claimed saving is measured against. Stock levels and shipping times of individual products, currency and GST notes, and general terms-and-conditions wording are not conditions.
- ends: the end date exactly as shown. If only a countdown timer is shown, leave it null.
- saleName: the sale's name as shown (e.g. "Spring Sale"), or null.
- Use the numbers exactly as they appear. Don't calculate new figures. The structured data already includes worked-out savings you can use.
- source: "structured" if it comes from the structured data, "text" if it appears in the page text, "image" if it only appears in a screenshot.
- evidence: the exact words from the page text or screenshot that show the fact, copied character for character with no description or commentary of your own. If the fact draws on separate parts of the page, join the fragments with " ... ". For structured data, name the product and the field values.`;

export function extractFacts(
  brand: string,
  checkedOn: string,
  structured: unknown,
  pages: EvidencePage[],
): Promise<Facts> {
  const content: Content = [];
  for (const page of pages) {
    if (page.screenshots.length === 0) continue;
    content.push({ type: 'text', text: `Screenshots of ${page.url}, top of the page downwards:` });
    content.push(...images(page.screenshots));
  }

  const sections = [
    `Brand: ${brand}`,
    `Captured: ${checkedOn}`,
    structured
      ? `<structured_data>\n${JSON.stringify(structured, null, 2)}\n</structured_data>`
      : 'No structured price data for this brand.',
    ...pages.map((page) => `<page url="${page.url}" title="${page.title}">\n${page.text}\n</page>`),
  ];
  content.push({ type: 'text', text: sections.join('\n\n') });

  return ask(FactsSchema, EXTRACT_SYSTEM, content, 'high');
}

const BANNER_SYSTEM = `You transcribe promotional text from website screenshots. List every line of text that appears in sale or promotion banners, badges and announcement bars, exactly as written, including every number, percentage and date. Skip navigation menus, product grid prices, phone numbers, and cookie or newsletter popups. If there is no promotional text, return an empty list.`;

/** An independent read of the banners, used to confirm facts the extraction says it read from an image. */
export async function transcribeBanners(screenshots: Buffer[]): Promise<string[]> {
  if (screenshots.length === 0) return [];
  const result = await ask(
    BannerTextSchema,
    BANNER_SYSTEM,
    [...images(screenshots), { type: 'text', text: 'Transcribe the promotional text in these screenshots.' }],
    'medium',
  );
  return result.lines;
}

const WRITE_SYSTEM = `You write one short entry for a monthly list of trampoline sales on Bounce Arena, an Australian trampoline buying guide. You get the verified facts about one brand's current trampoline sale as JSON. The brand's name is the heading above your paragraph, and a link and any promo code are added after it, so don't mention links, codes or Bounce Arena.

Write one paragraph of one to three sentences, under 70 words, that tells the reader what the sale offers.

Content:
- Use only the facts given. Every number you write must appear in the facts.
- Lead with the offer: what is discounted and by how much, starting with the biggest saving. Then name the models or sizes, then free items or conditions, then the end date if there is one.
- State discounts as savings ("up to $250 off", "15% off"). Don't give sale prices or regular prices.
- Use the sale's name only when it helps identify the sale, in sentence case.
- Leave out anything the facts don't cover. Don't point out missing details such as "no end date has been given".

Voice:
- Plain Australian English, written the way a knowledgeable person tells a friend the facts. Every sentence states a fact in the plainest words that carry it.
- No marketing language or hype: no "massive", "huge", "incredible", "biggest", "bargain", "don't miss", "limited time", "hurry", "grab", "snap up".
- Don't tell the reader what to do: no "buy", "shop", "use", "check out", "head to", and don't start a sentence with "Save".
- No exclamation marks, em dashes, rhetorical questions, triads for rhythm, or a closing line that sums up.
- Don't copy the brand's own sentences. Say the same facts in your own words.
- The brand can be the subject of a sentence ("Jumpflex has..."), but don't repeat its name.

Examples of the register, with made-up brands:
- "Northbound has up to $300 off its Orbit trampolines and $150 off the Comet range, and Orbit orders include a free ladder. The sale ends 14 March."
- "Every Skyline trampoline is 20% off, which takes $260 off the 12ft model. Delivery to metro areas is free while the sale runs."`;

export async function writeParagraph(
  brand: string,
  month: string,
  facts: unknown,
  feedback: string[] = [],
): Promise<string> {
  const request = [
    `Brand: ${brand}`,
    `Month: ${month}`,
    `<facts>\n${JSON.stringify(facts, null, 2)}\n</facts>`,
    ...(feedback.length > 0
      ? [
          `Your previous paragraph failed these checks. Write a new one that passes them:\n${feedback.map((item) => `- ${item}`).join('\n')}`,
        ]
      : []),
  ].join('\n\n');

  const result = await ask(ParagraphSchema, WRITE_SYSTEM, [{ type: 'text', text: request }], 'high');
  return tidy(result.paragraph);
}

/** Trademark symbols and whole-dollar cents come through from the facts; neither belongs in prose. */
function tidy(paragraph: string): string {
  return paragraph
    .replace(/[™®©]/g, '')
    .replace(/(\$[\d,]+)\.00\b/g, '$1')
    .trim();
}
