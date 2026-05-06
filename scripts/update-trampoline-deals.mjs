#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const postFile = path.join(rootDir, 'content', 'blog', 'trampoline-deals-sales.mdx');
const defaultConfigFile = path.join(rootDir, 'config', 'trampoline-deals-sources.json');
const envLocalFile = path.join(rootDir, '.env.local');
const MELBOURNE_TIME_ZONE = 'Australia/Melbourne';
const VULY_SOURCE_NAME = 'Vuly';
const VULY_PROMO_URL = 'https://www.vulyplay.com/aff/100/?url=promo';
const PREFERRED_ANTHROPIC_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
];
const QUIZ_CTA_BLOCK = `### Take the Quiz

Our Trampoline Quiz guides you through the key decisions you should make when choosing a trampoline and recommends the best options based on your preferences.

[Take the Quiz](/quiz)`;
const VULY_PROMO_BLOCK = `Apply promo codes **BOUNCE15** (discount) and **BOUNCESURGE** (free gift) at checkout.`;
const REQUEST_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'en-AU,en;q=0.9',
  pragma: 'no-cache',
  'cache-control': 'no-cache',
};
const FETCH_TIMEOUT_MS = 30000;
const execFileAsync = promisify(execFile);

async function loadEnvLocal() {
  try {
    const raw = await fs.readFile(envLocalFile, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;

      const [, key, value] = match;
      const normalized = value
        .trim()
        .replace(/^"(.*)"$/, '$1')
        .replace(/^'(.*)'$/, '$1');

      process.env[key] = normalized;
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

function formatError(error) {
  if (error instanceof Error) {
    const cause = error.cause;
    if (cause && typeof cause === 'object') {
      const parts = [];
      if ('code' in cause && cause.code) parts.push(String(cause.code));
      if ('message' in cause && cause.message) parts.push(String(cause.message));
      if (parts.length > 0) return `${error.message} (${parts.join(': ')})`;
    }
    return error.message;
  }
  return String(error);
}

function getCurrentMonthYear() {
  return new Intl.DateTimeFormat('en-AU', {
    month: 'long',
    year: 'numeric',
    timeZone: MELBOURNE_TIME_ZONE,
  }).format(new Date());
}

function decodeHtmlEntities(input) {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
}

function stripHtml(html) {
  return decodeHtmlEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function extractTextLines(html) {
  const normalized = decodeHtmlEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<\/?(?:p|div|section|article|main|aside|header|footer|nav|ul|ol|li|h1|h2|h3|h4|h5|h6|br|tr|td|th)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  );

  return normalized
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => line.length >= 20 && line.length <= 220);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseArgs(argv) {
  const options = {
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
    config: defaultConfigFile,
    dryRun: false,
    sites: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--no-ai') {
      options.ai = false;
      continue;
    }

    if (arg === '--config') {
      options.config = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg === '--site') {
      const raw = argv[i + 1];
      i += 1;
      if (!raw) {
        throw new Error('Missing value after --site. Use --site "Name|https://example.com".');
      }
      const [name, url] = raw.split('|');
      if (!name || !url) {
        throw new Error(`Invalid --site value "${raw}". Use --site "Name|https://example.com".`);
      }
      options.sites.push({ name: name.trim(), url: url.trim() });
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function normalizeSource(source) {
  const normalizedName = source.name.trim();
  return {
    name: normalizedName,
    url: normalizedName.toLowerCase() === VULY_SOURCE_NAME.toLowerCase()
      ? VULY_PROMO_URL
      : source.url.trim(),
  };
}

async function loadSources(options) {
  if (options.sites.length > 0) return options.sites.map(normalizeSource);

  const raw = await fs.readFile(options.config, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`No sources found in ${options.config}`);
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry.name !== 'string' || typeof entry.url !== 'string') {
      throw new Error(`Invalid source at index ${index} in ${options.config}`);
    }
    return normalizeSource({ name: entry.name, url: entry.url });
  });
}

function sortSources(sources) {
  return [...sources].sort((a, b) => {
    const aIsVuly = a.name.trim().toLowerCase() === VULY_SOURCE_NAME.toLowerCase();
    const bIsVuly = b.name.trim().toLowerCase() === VULY_SOURCE_NAME.toLowerCase();
    if (aIsVuly && !bIsVuly) return -1;
    if (!aIsVuly && bIsVuly) return 1;
    return 0;
  });
}

function extractMetaContent(html, propertyName) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escapeRegExp(propertyName)}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escapeRegExp(propertyName)}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${escapeRegExp(propertyName)}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escapeRegExp(propertyName)}["']`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1]).trim();
  }

  return '';
}

function extractTitle(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) return decodeHtmlEntities(titleMatch[1]).replace(/\s+/g, ' ').trim();
  return '';
}

function normalizeUrl(url, baseUrl) {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return '';
  }
}

function upgradeImageUrlForVision(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.searchParams.has('w')) {
      parsed.searchParams.set('w', '1600');
    }
    if (parsed.searchParams.has('width')) {
      parsed.searchParams.set('width', '1600');
    }
    return parsed.href;
  } catch {
    return rawUrl;
  }
}

function inferImageMediaType(url, contentType = '') {
  if (contentType.startsWith('image/')) return contentType.split(';')[0].trim();
  const lower = url.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function scoreImageUrl(url) {
  const lower = url.toLowerCase();
  let score = 0;

  if (/\.(png|jpe?g|webp|gif)(?:$|\?)/i.test(lower)) score += 2;
  if (/(sale|promo|promotion|deal|flash|banner|hero|slider|carousel)/i.test(lower)) score += 6;
  if (/(logo|icon|flag|avatar|cart|account|payment|badge)/i.test(lower)) score -= 8;
  if (/\/cdn\/shop\/files\//i.test(lower)) score += 1;

  return score;
}

function extractImageUrls(html, pageUrl) {
  const candidates = [];
  const addCandidate = (rawUrl) => {
    if (!rawUrl) return;
    const cleaned = rawUrl.split(',')[0]?.trim();
    const normalized = normalizeUrl(cleaned, pageUrl);
    if (!normalized) return;
    candidates.push(normalized);
  };

  const ogImage = extractMetaContent(html, 'og:image');
  const twitterImage = extractMetaContent(html, 'twitter:image');
  addCandidate(ogImage);
  addCandidate(twitterImage);

  const attrPatterns = [
    /\b(?:src|data-src|data-lazy-src|data-image|data-bg|data-background)=["']([^"']+)["']/gi,
    /\bsrcset=["']([^"']+)["']/gi,
  ];

  for (const pattern of attrPatterns) {
    for (const match of html.matchAll(pattern)) {
      const value = match[1];
      if (!value) continue;
      for (const part of value.split(',')) {
        const [url] = part.trim().split(/\s+/);
        addCandidate(url);
      }
    }
  }

  const unique = [...new Set(candidates)];
  return unique
    .map((url) => upgradeImageUrlForVision(url))
    .map((url) => ({ url, score: scoreImageUrl(url) }))
    .filter((entry) => entry.url.startsWith('https://'))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.url);
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function scoreSnippet(snippet) {
  const lower = snippet.toLowerCase();
  let score = 0;

  const keywords = [
    'sale',
    'deals',
    'discount',
    'save',
    'off',
    'free delivery',
    'free shipping',
    'promo',
    'black friday',
    'cyber',
    'stocktake',
    'clearance',
    'mother',
    'eof',
    'bonus',
  ];

  for (const keyword of keywords) {
    if (lower.includes(keyword)) score += 3;
  }

  if (/\b\d+%\s+off\b/i.test(snippet)) score += 5;
  if (/\bup to\b/i.test(snippet)) score += 2;
  if (/\$\s?\d/.test(snippet)) score += 4;
  if (/\bends?\b|\buntil\b|\bvalid\b|\bnow\b/i.test(snippet)) score += 2;

  if (snippet.length < 35) score -= 2;
  if (snippet.length > 260) score -= 1;

  return score;
}

function pickBestSnippets(lines, metaDescription, text) {
  const haystack = [
    metaDescription,
    ...lines,
    ...splitSentences(text).filter((sentence) => sentence.length <= 220),
  ].filter(Boolean);
  const seen = new Set();
  const ranked = haystack
    .map((snippet) => snippet.replace(/\s+/g, ' ').trim())
    .filter((snippet) => {
      const normalized = snippet.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .map((snippet) => ({ snippet, score: scoreSnippet(snippet) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.snippet.length - b.snippet.length)
    .slice(0, 3)
    .map((entry) => entry.snippet);

  return ranked;
}

function normalizeSentence(snippet) {
  const clean = snippet.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

function summarizeSource({ name, url, pageTitle, snippets }) {
  const lead = snippets.map(normalizeSentence).filter(Boolean).join(' ');
  if (lead) return lead;
  if (pageTitle) return `${pageTitle}. Review the live page and confirm the exact sale details before publishing.`;
  return `Review the live ${name} page and confirm the current sale details before publishing.`;
}

function hasLikelySaleSignal(entry) {
  if (entry.error) return false;

  const haystack = [
    entry.title ?? '',
    ...(Array.isArray(entry.snippets) ? entry.snippets : []),
    entry.summary ?? '',
  ]
    .join(' ')
    .toLowerCase();

  const strongSignals = [
    'sale',
    'promo',
    'promotion',
    'discount',
    'save',
    'free delivery',
    'free shipping',
    'bonus',
    'clearance',
    'up to',
  ];

  const keywordMatches = strongSignals.filter((signal) => haystack.includes(signal)).length;
  const numericSignal =
    /\b\d+%\s+off\b/i.test(haystack) ||
    /\$\s?\d/.test(haystack);

  return keywordMatches >= 2 || (keywordMatches >= 1 && numericSignal);
}

function getSignalStrength(entry) {
  if (entry.error) return 0;

  const haystack = [
    entry.title ?? '',
    ...(Array.isArray(entry.snippets) ? entry.snippets : []),
    entry.summary ?? '',
  ]
    .join(' ')
    .toLowerCase();

  let score = 0;
  if (/\bflash sale\b/i.test(haystack)) score += 5;
  if (/\bsale\b/i.test(haystack)) score += 3;
  if (/\bpromo|\bpromotion\b/i.test(haystack)) score += 3;
  if (/\b\d+%\s+off\b/i.test(haystack)) score += 5;
  if (/\bup to\b/i.test(haystack)) score += 2;
  if (/\$\s?\d/.test(haystack)) score += 3;
  if (/\bfree delivery\b|\bfree shipping\b/i.test(haystack)) score += 3;
  if (/\bfree accessories\b|\bfree gift\b|\bbonus\b/i.test(haystack)) score += 3;
  if (/\bstarts\b|\bends\b|\bcountdown\b|\bdays\b|\bhours\b|\bminutes\b/i.test(haystack)) score += 2;
  return score;
}

async function fetchSource(source) {
  const response = await fetch(source.url, {
    headers: REQUEST_HEADERS,
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const title = extractTitle(html) || extractMetaContent(html, 'og:title');
  const metaDescription =
    extractMetaContent(html, 'description') || extractMetaContent(html, 'og:description');
  const lines = extractTextLines(html);
  const text = stripHtml(html);
  const snippets = pickBestSnippets(lines, metaDescription, text);
  const imageUrls = extractImageUrls(html, source.url);

  return {
    ...source,
    title,
    imageUrls,
    snippets,
    summary: summarizeSource({
      name: source.name,
      url: source.url,
      pageTitle: title,
      snippets,
    }),
  };
}

function formatSection(monthYear, entries) {
  const heading = `## Australia Trampoline Sales ${monthYear}`;
  const sections = entries.map((entry) => {
    const titleLine = `### ${entry.name}`;
    const body = entry.error
      ? `\nCould not fetch this site automatically (${entry.error}). Check the live page manually before publishing.\n`
      : `\n${entry.summary}\n\n[View current ${entry.name} deal](${entry.url})${entry.name === VULY_SOURCE_NAME ? `\n\n${VULY_PROMO_BLOCK}` : ''}\n`;
    return `${titleLine}${body}`;
  });

  return `${heading}\n\n${sections.join('\n\n')}\n\n${QUIZ_CTA_BLOCK}\n`;
}

function extractAnthropicText(payload) {
  if (!payload || !Array.isArray(payload.content)) return '';
  return payload.content
    .filter((item) => item?.type === 'text' && typeof item.text === 'string')
    .map((item) => item.text)
    .join('\n')
    .trim();
}

function parseJsonResponse(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Anthropic returned an empty response.');
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;
  return JSON.parse(candidate);
}

async function buildAnthropicImageContent(imageUrls, maxImages) {
  const content = [];

  for (const imageUrl of (imageUrls ?? []).slice(0, maxImages)) {
    try {
      const imageResponse = await fetch(imageUrl, {
        headers: REQUEST_HEADERS,
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!imageResponse.ok) continue;

      const mediaType = inferImageMediaType(
        imageUrl,
        imageResponse.headers.get('content-type') ?? '',
      );
      const buffer = Buffer.from(await imageResponse.arrayBuffer());

      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: buffer.toString('base64'),
        },
      });
    } catch {
      continue;
    }
  }

  return content;
}

async function capturePageScreenshot(url, prefix) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
  const outputPath = path.join(dir, 'screenshot.png');

  await execFileAsync('npx', [
    'playwright',
    'screenshot',
    '--device=Desktop Chrome',
    url,
    outputPath,
  ], {
    timeout: FETCH_TIMEOUT_MS,
  });

  const buffer = await fs.readFile(outputPath);
  return {
    mediaType: 'image/png',
    data: buffer.toString('base64'),
  };
}

function buildVulySummary(details) {
  const parts = [];
  if (details.saleTiming && details.discount) {
    parts.push(`${details.saleTiming} with ${details.discount} on selected trampolines`);
  } else if (details.discount) {
    parts.push(`${details.discount} on selected trampolines`);
  } else if (details.saleTiming) {
    parts.push(details.saleTiming);
  }

  if (details.freebies) {
    parts.push(details.freebies);
  }

  const sentence = parts.join(' plus ').trim();
  if (!sentence) return '';
  return sentence.endsWith('.') ? sentence : `${sentence}.`;
}

function buildAnthropicPrompt(monthYear, entry, forceInclude = false) {
  return [
    `Assess whether ${entry.name} has a real live sale or promo for Australia for ${monthYear}, based only on the supplied scraped evidence and any supplied images.`,
    'Return strict JSON only in this shape:',
    '{"include":true,"summary":"One short paragraph of 1-2 sentences."}',
    'Rules:',
    '- Ground every decision and summary only in the provided evidence and visible image text.',
    '- Set include=true only when the evidence suggests there is an actual current sale, promotion, discount, bonus, or other deal on the brand page.',
    '- Set include=false when the page looks like a normal category/product page with no clear live promo evidence.',
    '- If include=false, set summary to an empty string.',
    '- Treat these as strong sale signals when present: flash sale, percentage off, dollar savings, free delivery, free accessories, countdown timers, sale start dates, or "sale now on" text.',
    '- Prefer concrete sale details like percentages, dollar savings, free delivery, bonuses, or dates if present.',
    '- Do not invent sale terms, dates, or promo codes.',
    '- Keep each summary under 45 words.',
    '- Use plain Australian English.',
    '- Write like a concise site editor, not like an AI assistant.',
    '- Do not use phrases like "current site messaging", "the site says", "appears to", or "get a deal today".',
    '- Do not repeat the brand name at the start of the summary because it already appears as the section heading.',
    '- If image text shows the key sale terms more clearly than the HTML text, prefer the image text.',
    '- If evidence is weak or fetch failed, prefer include=false rather than hedging.',
    ...(entry.name === VULY_SOURCE_NAME
      ? [
          '- For Vuly specifically, inspect all supplied hero/promo images carefully for banner text.',
          '- If a Vuly image shows percentage-off text, free delivery, free accessories, or a flash-sale date, use those exact details in the summary.',
          '- If Vuly has a live countdown or promotions page plus promo-banner imagery, do not exclude it unless the supplied evidence clearly shows there is no active promo.',
        ]
      : []),
    ...(forceInclude
      ? ['- The local scraper found strong promo signals here. Unless the evidence clearly contradicts that, set include=true and write the cleanest factual summary you can.']
      : []),
    '',
    JSON.stringify({
      name: entry.name,
      url: entry.url,
      title: entry.title ?? '',
      error: entry.error ?? null,
      snippets: Array.isArray(entry.snippets) ? entry.snippets : [],
      fallbackSummary: entry.summary ?? '',
      imageUrls: Array.isArray(entry.imageUrls) ? entry.imageUrls : [],
      localSignalStrength: getSignalStrength(entry),
    }, null, 2),
  ].join('\n');
}

function buildVulyAnthropicPrompt(monthYear, entry, forceInclude = false) {
  return [
    `Review the supplied Vuly promotions-page evidence for ${monthYear}.`,
    'Your job is to extract the actual sale details from the visible promo banner text, especially image text.',
    'Return strict JSON only in this shape:',
    '{"include":true,"discount":"","freebies":"","saleTiming":"","summary":""}',
    'Rules:',
    '- Read the supplied images carefully and prefer the banner text over generic page copy.',
    '- Extract exact promo terms when visible, such as percentage-off ranges, free delivery, free accessories, and sale start dates.',
    '- Set include=true if there is any clear active or upcoming promo on the page.',
    '- If there is no clear promo, set include=false and leave the other fields empty.',
    '- summary must be a concise factual sentence under 35 words.',
    '- Do not mention update policy, customer service wording, or generic “promotions page” text unless there are no actual sale terms visible.',
    '- Do not start the summary with the word Vuly.',
    ...(forceInclude
      ? ['- The local scraper found strong promo signals here. Prefer include=true unless the evidence clearly shows no promo.']
      : []),
    '',
    JSON.stringify({
      name: entry.name,
      url: entry.url,
      title: entry.title ?? '',
      error: entry.error ?? null,
      snippets: Array.isArray(entry.snippets) ? entry.snippets : [],
      fallbackSummary: entry.summary ?? '',
      imageUrls: Array.isArray(entry.imageUrls) ? entry.imageUrls : [],
      localSignalStrength: getSignalStrength(entry),
    }, null, 2),
  ].join('\n');
}

async function rewriteEntryWithAnthropic(entry, monthYear, apiKey, model, forceInclude = false) {
  const content = await buildAnthropicImageContent(
    entry.imageUrls ?? [],
    entry.name === VULY_SOURCE_NAME ? 8 : 3,
  );
  const maxImages = entry.name === VULY_SOURCE_NAME ? 8 : 3;

  content.push({
    type: 'text',
    text: buildAnthropicPrompt(monthYear, entry, forceInclude),
  });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 350,
      temperature: 0.1,
      system: 'You are editing a commercial content draft for an Australian trampoline deals page. Be factual, concise, and specific.',
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  const text = extractAnthropicText(payload);
  const parsed = parseJsonResponse(text);
  return {
    ...entry,
    include: Boolean(parsed?.include),
    summary: typeof parsed?.summary === 'string' ? parsed.summary.trim() : '',
  };
}

async function rewriteVulyEntryWithAnthropic(entry, monthYear, apiKey, model, forceInclude = false) {
  const content = [];

  try {
    const screenshot = await capturePageScreenshot(entry.url, 'vuly-promo');
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: screenshot.mediaType,
        data: screenshot.data,
      },
    });
  } catch {
    // If screenshot capture fails, fall back to direct image extraction below.
  }

  const fallbackImages = await buildAnthropicImageContent(entry.imageUrls ?? [], 8);
  content.push(...fallbackImages);

  content.push({
    type: 'text',
    text: buildVulyAnthropicPrompt(monthYear, entry, forceInclude),
  });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      temperature: 0.1,
      system: 'Extract visible promo terms from Vuly sale banners and summarise them concisely.',
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  const text = extractAnthropicText(payload);
  const parsed = parseJsonResponse(text);
  const normalized = {
    discount: typeof parsed?.discount === 'string' ? parsed.discount.trim() : '',
    freebies: typeof parsed?.freebies === 'string' ? parsed.freebies.trim() : '',
    saleTiming: typeof parsed?.saleTiming === 'string' ? parsed.saleTiming.trim() : '',
  };
  const summary =
    typeof parsed?.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : buildVulySummary(normalized);

  return {
    ...entry,
    include: Boolean(parsed?.include),
    summary,
  };
}

async function rewriteSummariesWithAnthropic(entries, monthYear) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return entries;
  const model = await resolveAnthropicModel(apiKey);
  const rewritten = await Promise.all(
    entries.map(async (entry) => {
      if (entry.error) return { ...entry, include: false, summary: '' };
      if (entry.name === VULY_SOURCE_NAME) {
        return rewriteVulyEntryWithAnthropic(entry, monthYear, apiKey, model);
      }
      return rewriteEntryWithAnthropic(entry, monthYear, apiKey, model);
    }),
  );

  const recovered = await Promise.all(
    rewritten.map(async (entry) => {
      const strongLocalSignal = getSignalStrength(entry) >= 6;
      const shouldRecover =
        !entry.include &&
        (entry.name === VULY_SOURCE_NAME
          ? getSignalStrength(entry) >= 4
          : strongLocalSignal && hasLikelySaleSignal(entry));

      if (!shouldRecover) return entry;
      if (entry.name === VULY_SOURCE_NAME) {
        return rewriteVulyEntryWithAnthropic(entry, monthYear, apiKey, model, true);
      }
      return rewriteEntryWithAnthropic(entry, monthYear, apiKey, model, true);
    }),
  );

  return recovered.filter((entry) => entry.include);
}

async function listAnthropicModels(apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Unable to list Anthropic models (${response.status}): ${body}`);
  }

  const payload = await response.json();
  return Array.isArray(payload?.data) ? payload.data : [];
}

async function resolveAnthropicModel(apiKey) {
  if (process.env.ANTHROPIC_MODEL) {
    return process.env.ANTHROPIC_MODEL;
  }

  const models = await listAnthropicModels(apiKey);
  const availableIds = new Set(
    models
      .map((model) => (typeof model?.id === 'string' ? model.id : ''))
      .filter(Boolean),
  );

  for (const candidate of PREFERRED_ANTHROPIC_MODELS) {
    if (availableIds.has(candidate)) return candidate;
  }

  const firstAvailable = models.find((model) => typeof model?.id === 'string' && model.id);
  if (firstAvailable?.id) return firstAvailable.id;

  throw new Error('No Anthropic models were returned for this API key.');
}

function insertMonthlySection(source, section, monthYear) {
  const monthHeading = `## Australia Trampoline Sales ${monthYear}`;
  const withoutQuizBlocks = source
    .replace(new RegExp(`${escapeRegExp(QUIZ_CTA_BLOCK)}\\s*`, 'g'), '')
    .trimEnd();
  const escapedHeading = escapeRegExp(monthHeading);
  const existingMonthPattern = new RegExp(
    `^${escapedHeading}[\\s\\S]*?(?=^## Australia Trampoline Sales |\\Z)`,
    'm',
  );
  const withoutExistingMonth = withoutQuizBlocks
    .replace(existingMonthPattern, '')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();

  const firstMonthlyHeadingIndex = withoutExistingMonth.search(/^## Australia Trampoline Sales /m);
  if (firstMonthlyHeadingIndex === -1) {
    throw new Error(`Could not find an existing monthly heading in ${postFile}.`);
  }

  return `${withoutExistingMonth.slice(0, firstMonthlyHeadingIndex)}${section}\n\n${withoutExistingMonth.slice(firstMonthlyHeadingIndex)}`.trimEnd() + '\n';
}

async function main() {
  await loadEnvLocal();
  const options = parseArgs(process.argv.slice(2));
  const sources = sortSources(await loadSources(options));
  const monthYear = getCurrentMonthYear();

  console.log(`Generating ${monthYear} trampoline deals draft from ${sources.length} source(s)...`);

  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        const result = await fetchSource(source);
        console.log(`Fetched ${source.name}: ${result.snippets.length} sale snippet(s) found, ${result.imageUrls.length} image candidate(s).`);
        return result;
      } catch (error) {
        const message = formatError(error);
        console.log(`Fetch failed for ${source.name}: ${message}`);
        return { ...source, error: message };
      }
    }),
  );

  let finalResults = results.map((entry) => ({
    ...entry,
    include: hasLikelySaleSignal(entry),
  }));
  if (options.ai) {
    try {
      console.log('Rewriting summaries with Anthropic...');
      finalResults = await rewriteSummariesWithAnthropic(finalResults, monthYear);
      for (const entry of finalResults) {
        console.log(`Included ${entry.name}`);
      }
    } catch (error) {
      const message = formatError(error);
      console.log(`Anthropic rewrite failed, using fallback summaries: ${message}`);
      finalResults = finalResults.filter((entry) => entry.include);
    }
  } else {
    finalResults = finalResults.filter((entry) => entry.include);
  }

  if (finalResults.length === 0) {
    throw new Error('No brands met the sale/promo threshold for this month.');
  }

  const currentPost = await fs.readFile(postFile, 'utf8');
  const section = formatSection(monthYear, finalResults);
  const updatedPost = insertMonthlySection(currentPost, section, monthYear);

  if (options.dryRun) {
    console.log('\n--- Draft section preview ---\n');
    console.log(section);
    return;
  }

  await fs.writeFile(postFile, updatedPost, 'utf8');
  console.log(`Updated ${path.relative(rootDir, postFile)} with ${monthYear} draft section.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
