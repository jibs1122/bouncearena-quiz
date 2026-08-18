/**
 * Downloads a product image for any model family that doesn't already have one,
 * taking the primary image from the model's own source page.
 *
 * Existing images (those mapped from the quiz dataset) are never touched. Results
 * are written to lib/model-images.generated.json, which lib/brands.ts reads as a
 * fallback.
 *
 *   npx tsx scripts/fetch-model-images.ts
 */

import fs from 'fs';
import path from 'path';
import { TRAMPOLINES, type Trampoline } from '../data/trampolines';
import { getBrand, modelImage } from '../lib/brands';
import { groupRows } from '../lib/compareShared';

const MANIFEST = path.join(process.cwd(), 'lib', 'model-images.generated.json');
const IMAGES_ROOT = path.join(process.cwd(), 'public', 'images');
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function brandDir(brand: string): string {
  return getBrand(brand)?.imageDir ?? slugify(brand);
}

/** The primary product image, preferring og:image and falling back to a gallery image. */
function extractImageUrl(html: string, pageUrl: string): string | null {
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (og) return new URL(og[1], pageUrl).toString();

  const twitter = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  if (twitter) return new URL(twitter[1], pageUrl).toString();

  const img = html.match(/<img[^>]+src=["']([^"']+\.(?:jpe?g|png|webp)[^"']*)["']/i);
  return img ? new URL(img[1], pageUrl).toString() : null;
}

function extensionFor(url: string, contentType: string | null): string {
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return 'jpg';
  const match = url.split('?')[0].match(/\.(jpe?g|png|webp)$/i);
  return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

async function fetchImageFor(group: { brand: string; model: string; variants: Trampoline[] }) {
  const source = group.variants.find((variant) => variant.sourceUrl)?.sourceUrl;
  if (!source) return { status: 'no-source' as const };

  const page = await fetch(source, { headers: { 'User-Agent': UA } });
  if (!page.ok) return { status: 'page-failed' as const, detail: `HTTP ${page.status}` };

  const imageUrl = extractImageUrl(await page.text(), source);
  if (!imageUrl) return { status: 'no-image' as const };

  const asset = await fetch(imageUrl, { headers: { 'User-Agent': UA, Referer: source } });
  if (!asset.ok) return { status: 'image-failed' as const, detail: `HTTP ${asset.status}` };

  const buffer = Buffer.from(await asset.arrayBuffer());
  if (buffer.byteLength < 2000) return { status: 'too-small' as const };

  const dir = brandDir(group.brand);
  const ext = extensionFor(imageUrl, asset.headers.get('content-type'));
  const filename = `${slugify(group.variants[0].model)}.${ext}`;

  fs.mkdirSync(path.join(IMAGES_ROOT, dir), { recursive: true });
  fs.writeFileSync(path.join(IMAGES_ROOT, dir, filename), buffer);

  return { status: 'ok' as const, publicPath: `/images/${dir}/${filename}`, source };
}

async function main() {
  const manifest: Record<string, string> = fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
    : {};

  const missing = groupRows(TRAMPOLINES).filter((group) => {
    const model = group.variants[0].model;
    return !modelImage(group.brand, model) && !manifest[`${group.brand}|${model}`];
  });

  console.log(`${missing.length} model families without an image.\n`);

  for (const group of missing) {
    const model = group.variants[0].model;
    const label = `${group.brand} ${model}`;
    try {
      const result = await fetchImageFor({ brand: group.brand, model, variants: group.variants });
      if (result.status === 'ok') {
        manifest[`${group.brand}|${model}`] = result.publicPath;
        console.log(`  ✓ ${label} → ${result.publicPath}`);
      } else {
        console.warn(`  ✗ ${label} (${result.status}${'detail' in result ? `: ${result.detail}` : ''})`);
      }
    } catch (cause) {
      console.warn(`  ✗ ${label} (${(cause as Error).message})`);
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nManifest now holds ${Object.keys(manifest).length} entries.`);
}

main();
