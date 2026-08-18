/**
 * Keeps brand outbound-link policy from regressing:
 * - every rendered Vuly destination uses /aff/100/
 * - every rendered Springfree destination is a local /go/.../ URL
 * - every registered Springfree /go/.../ URL resolves to Commission Factory
 */

import fs from 'fs';
import path from 'path';
import { TRAMPOLINES } from '../data/trampolines';
import { productUrl } from '../lib/compareShared';
import {
  getLink,
  getLinkDestination,
  isSpringfreeLinkSlug,
  isVulyLinkSlug,
  links,
} from '../lib/links';

const ROOT = process.cwd();
const SOURCE_DIRS = ['app', 'components', 'content', 'lib'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mdx']);
const errors: string[] = [];
let sourceUrlsChecked = 0;

function sourceFiles(directory: string): string[] {
  const absolute = path.join(ROOT, directory);
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(relative);
    return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [relative] : [];
  });
}

function report(file: string, message: string) {
  errors.push(`${file}: ${message}`);
}

for (const file of SOURCE_DIRS.flatMap(sourceFiles)) {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');

  for (const match of source.matchAll(/https:\/\/[^\s"'<>)}\]]+/g)) {
    let url: URL;
    try {
      url = new URL(match[0]);
    } catch {
      continue;
    }

    sourceUrlsChecked += 1;

    if (/^(?:www\.)?vulyplay\.com$/i.test(url.hostname) && url.pathname !== '/aff/100/') {
      report(file, `Vuly URL bypasses /aff/100/: ${url.href}`);
    }

    if (/springfreetrampoline\.com\.au$/i.test(url.hostname)) {
      report(file, `direct Springfree URL must use a local /go/.../ route: ${url.href}`);
    }

    if (url.hostname === 't.cfjump.com' && file !== 'lib/links.ts') {
      report(file, `Commission Factory URL is only allowed in the redirect registry: ${url.href}`);
    }
  }
}

for (const slug of Object.keys(links)) {
  const publicHref = getLink(slug);
  const destination = getLinkDestination(slug);

  if (isVulyLinkSlug(slug)) {
    if (!publicHref || !/^https:\/\/(?:www\.)?vulyplay\.com\/aff\/100\//i.test(publicHref)) {
      report('lib/links.ts', `${slug} must resolve to a Vuly /aff/100/ URL`);
    }
  }

  if (isSpringfreeLinkSlug(slug)) {
    if (publicHref !== `/go/${slug}/`) {
      report('lib/links.ts', `${slug} must expose /go/${slug}/, received ${publicHref ?? 'null'}`);
    }

    if (!destination || new URL(destination).hostname !== 't.cfjump.com') {
      report('lib/links.ts', `${slug} must redirect to Commission Factory`);
    }
  }
}

for (const row of TRAMPOLINES.filter(({ brand }) => brand === 'Vuly' || brand === 'Springfree')) {
  const href = productUrl(row, false);
  const label = `${row.brand} ${row.model} ${row.size}`;

  if (row.brand === 'Vuly' && !href?.includes('vulyplay.com/aff/100/')) {
    report('data/trampolines.ts', `${label} does not resolve through Vuly /aff/100/`);
  }

  if (row.brand === 'Springfree' && !href?.startsWith('/go/')) {
    report('data/trampolines.ts', `${label} does not resolve through a local /go/.../ route`);
  }
}

if (errors.length > 0) {
  console.error(`Affiliate link validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Affiliate links valid: ${sourceUrlsChecked} source URL(s), ` +
      `${TRAMPOLINES.filter(({ brand }) => brand === 'Vuly').length} Vuly model row(s), ` +
      `${TRAMPOLINES.filter(({ brand }) => brand === 'Springfree').length} Springfree model row(s).`,
  );
}
