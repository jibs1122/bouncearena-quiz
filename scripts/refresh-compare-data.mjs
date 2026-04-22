#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataFile = path.join(rootDir, 'data', 'trampolines.ts');

const SHEET_CSV_URL =
  process.env.COMPARE_SHEET_CSV_URL ||
  'https://docs.google.com/spreadsheets/d/1CLjH67Sf9o2diBMUwiG9zmkhs47N90GmL4LxQ6TYsZk/export?format=csv';

function parseCsv(input) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(value);
      value = '';
      continue;
    }

    if (char === '\n') {
      row.push(value.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows;
}

function readNullableString(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function readNullableNumber(value) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/[$,]/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function readBoolean(value) {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'yes' || normalized === 'true' || normalized === '1';
}

function inferAuStandard(meetsAustralianStandard, auStandardDetails, otherStandards) {
  const detailText = [auStandardDetails, otherStandards]
    .map((value) => readNullableString(value))
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    readBoolean(meetsAustralianStandard) ||
    detailText.includes('as4989')
  );
}

function pickSourceUrl(value) {
  const first = value
    ?.split('|')
    .map((part) => part.trim())
    .find(Boolean);

  return first || null;
}

function formatVulyAffiliateUrl(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('vulyplay.com')) return url;

    const normalizedPath = parsed.pathname
      .replace(/^\/[a-z]{2}(?:-[A-Z]{2})?\//, '/')
      .replace(/^\//, '');

    if (!normalizedPath) return 'https://www.vulyplay.com/aff/100/';

    return `https://www.vulyplay.com/aff/100/?url=${normalizedPath}`;
  } catch {
    return url;
  }
}

function canonicalKey(brand, model, size) {
  return [brand, model, size].map((part) => part.trim().toLowerCase()).join('||');
}

function parseExistingEnrichment(source) {
  const pattern =
    /\{ brand: ("(?:[^"\\]|\\.)*"), model: ("(?:[^"\\]|\\.)*"), size: ("(?:[^"\\]|\\.)*")[\s\S]*?reviewSlug: (null|"(?:[^"\\]|\\.)*"), baScore: (null|\d+(?:\.\d+)?), sourceUrl: (null|"(?:[^"\\]|\\.)*"), goSlug: (null|"(?:[^"\\]|\\.)*") \}/g;
  const map = new Map();

  for (const match of source.matchAll(pattern)) {
    const brand = JSON.parse(match[1]);
    const model = JSON.parse(match[2]);
    const size = JSON.parse(match[3]);

    map.set(canonicalKey(brand, model, size), {
      reviewSlug: match[4] === 'null' ? null : JSON.parse(match[4]),
      baScore: match[5] === 'null' ? null : Number(match[5]),
      sourceUrl: match[6] === 'null' ? null : JSON.parse(match[6]),
      goSlug: match[7] === 'null' ? null : JSON.parse(match[7]),
    });
  }

  return map;
}

function serialize(value) {
  return value === null ? 'null' : JSON.stringify(value);
}

async function main() {
  const existingSource = await fs.readFile(dataFile, 'utf8');
  const enrichmentByKey = parseExistingEnrichment(existingSource);

  const response = await fetch(SHEET_CSV_URL, {
    headers: {
      accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch compare sheet (${response.status} ${response.statusText})`);
  }

  const csv = await response.text();
  const [headerRow, ...valueRows] = parseCsv(csv);

  if (!headerRow?.length) {
    throw new Error('Compare sheet CSV did not contain a header row.');
  }

  const rows = valueRows
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) => {
      const entry = Object.fromEntries(headerRow.map((key, index) => [key, row[index] ?? '']));

      const brand = entry.brand.trim();
      const model = entry.model.trim();
      const size = entry.size.trim();
      const key = canonicalKey(brand, model, size);
      const enrichment = enrichmentByKey.get(key);

      const exactPrice = readNullableNumber(entry.exact_size_price_aud);
      const fromPrice = readNullableNumber(entry.model_from_price_aud);
      const rawSourceUrl = pickSourceUrl(entry.source_urls) ?? enrichment?.sourceUrl ?? null;
      const sourceUrl =
        brand === 'Vuly' ? formatVulyAffiliateUrl(rawSourceUrl) : rawSourceUrl;
      const springSystem = readNullableString(entry.spring_system);
      const auStdDetail =
        readNullableString(entry.au_standard_details) ??
        (readNullableString(entry.other_standards)?.toLowerCase().includes('as4989')
          ? readNullableString(entry.other_standards)
          : null);

      return {
        brand,
        model,
        size,
        shape: entry.shape.trim(),
        springless: springSystem?.toLowerCase().includes('springless') ?? false,
        springSystem,
        priceAud: exactPrice ?? fromPrice,
        priceBasis:
          readNullableString(entry.price_basis) ??
          (exactPrice !== null ? 'Exact current price' : fromPrice !== null ? 'Model family from price' : 'Unknown'),
        overallDiamCm: readNullableNumber(entry.max_diameter_cm),
        overallLenCm: readNullableNumber(entry.overall_length_cm),
        overallWidCm: readNullableNumber(entry.overall_width_cm),
        matDiamCm: readNullableNumber(entry.mat_diameter_cm),
        matLenCm: readNullableNumber(entry.mat_length_cm),
        matWidCm: readNullableNumber(entry.mat_width_cm),
        totalHeightCm: readNullableNumber(entry.total_height_cm),
        maxWeightKg: readNullableNumber(entry.max_single_user_weight_kg),
        combinedWeightKg: readNullableNumber(entry.combined_total_weight_rating_kg),
        springCount: readNullableNumber(entry.spring_count),
        warrantyFrameYrs: readNullableNumber(entry.warranty_frame_years),
        warrantyMatYrs: readNullableNumber(entry.warranty_mat_years),
        warrantyNetYrs: readNullableNumber(entry.warranty_net_years),
        meetsAuStd: inferAuStandard(
          entry.meets_australian_standard,
          entry.au_standard_details,
          entry.other_standards,
        ),
        auStdDetail,
        reviewSlug: enrichment?.reviewSlug ?? null,
        baScore: enrichment?.baScore ?? null,
        sourceUrl,
        goSlug: enrichment?.goSlug ?? null,
      };
    });

  const output = `// Generated by scripts/refresh-compare-data.mjs from the Bounce Arena compare sheet.\n// Run \`npm run refresh:compare-data\` to update.\n\nexport type Trampoline = {\n  brand: string; model: string; size: string; shape: string;\n  springless: boolean; springSystem: string | null; priceAud: number | null; priceBasis: string;\n  overallDiamCm: number | null; overallLenCm: number | null; overallWidCm: number | null;\n  matDiamCm: number | null; matLenCm: number | null; matWidCm: number | null; totalHeightCm: number | null;\n  maxWeightKg: number | null; combinedWeightKg: number | null; springCount: number | null;\n  warrantyFrameYrs: number | null; warrantyMatYrs: number | null; warrantyNetYrs: number | null;\n  meetsAuStd: boolean; auStdDetail: string | null;\n  reviewSlug: string | null; baScore: number | null;\n  sourceUrl: string | null; goSlug: string | null;\n};\n\nexport const TRAMPOLINES: Trampoline[] = [\n${rows
    .map(
      (row) =>
        `  { brand: ${serialize(row.brand)}, model: ${serialize(row.model)}, size: ${serialize(row.size)}, shape: ${serialize(row.shape)}, springless: ${row.springless}, springSystem: ${serialize(row.springSystem)}, priceAud: ${serialize(row.priceAud)}, priceBasis: ${serialize(row.priceBasis)}, overallDiamCm: ${serialize(row.overallDiamCm)}, overallLenCm: ${serialize(row.overallLenCm)}, overallWidCm: ${serialize(row.overallWidCm)}, matDiamCm: ${serialize(row.matDiamCm)}, matLenCm: ${serialize(row.matLenCm)}, matWidCm: ${serialize(row.matWidCm)}, totalHeightCm: ${serialize(row.totalHeightCm)}, maxWeightKg: ${serialize(row.maxWeightKg)}, combinedWeightKg: ${serialize(row.combinedWeightKg)}, springCount: ${serialize(row.springCount)}, warrantyFrameYrs: ${serialize(row.warrantyFrameYrs)}, warrantyMatYrs: ${serialize(row.warrantyMatYrs)}, warrantyNetYrs: ${serialize(row.warrantyNetYrs)}, meetsAuStd: ${row.meetsAuStd}, auStdDetail: ${serialize(row.auStdDetail)}, reviewSlug: ${serialize(row.reviewSlug)}, baScore: ${serialize(row.baScore)}, sourceUrl: ${serialize(row.sourceUrl)}, goSlug: ${serialize(row.goSlug)} },`,
    )
    .join('\n')}\n];\n`;

  await fs.writeFile(dataFile, output);

  console.log(`Updated ${path.relative(rootDir, dataFile)} with ${rows.length} rows from the live sheet.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
