/**
 * Validates invariants in the generated Australian comparison catalogue.
 * The catalogue itself is regenerated from the spreadsheet's authoritative Aus tab.
 */

import { TRAMPOLINES, type AuStandardStatus } from '../data/trampolines';

const VALID_STANDARD_STATUSES = new Set<AuStandardStatus>([
  'meets',
  'does-not-meet',
  'not-confirmed',
]);

const errors: string[] = [];
const seenKeys = new Set<string>();

for (const row of TRAMPOLINES) {
  const label = `${row.brand} ${row.model} ${row.size}`;
  const key = [row.brand, row.model, row.size].map((value) => value.toLowerCase()).join('|');

  if (seenKeys.has(key)) errors.push(`${label}: duplicate brand/model/size row`);
  seenKeys.add(key);

  if (!row.brand || !row.model || !row.size || !row.shape) {
    errors.push(`${label}: brand, model, size and shape are required`);
  }

  if (!row.sourceUrl) {
    errors.push(`${label}: sourceUrl is required`);
  } else {
    try {
      new URL(row.sourceUrl);
    } catch {
      errors.push(`${label}: sourceUrl is not a valid absolute URL`);
    }
  }

  if (!VALID_STANDARD_STATUSES.has(row.auStdStatus)) {
    errors.push(`${label}: invalid Australian-standard status "${row.auStdStatus}"`);
  }

  if (row.meetsAuStd !== (row.auStdStatus === 'meets')) {
    errors.push(`${label}: meetsAuStd and auStdStatus disagree`);
  }

  if (row.auStdStatus === 'does-not-meet' && row.meetsAuStd) {
    errors.push(`${label}: an explicit "does not meet" row cannot be marked as meeting the standard`);
  }

  if (row.priceAud !== null && !row.priceBasis.trim()) {
    errors.push(`${label}: priceBasis is required when priceAud is present`);
  }
}

for (const message of errors) console.error(`✖ data/trampolines.ts: ${message}`);

console.log(
  `${TRAMPOLINES.length} Australian comparison row(s): ${errors.length} data error(s).`,
);

if (errors.length > 0) process.exit(1);
