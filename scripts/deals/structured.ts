export type PriceRow = {
  product: string;
  variant: string;
  price: number;
  was: number | null;
  /** Worked out here so the dollar and percentage savings exist as evidence the copy can be checked against. */
  saving: number | null;
  savingPercent: number | null;
};

export type StructuredData = {
  source: string;
  rows: PriceRow[];
  /** Sale wording and free items the store attaches to products. */
  notes: string[];
};

const SHOPIFY_TRAMPOLINE = /trampoline/i;
const SHOPIFY_NOT_A_TRAMPOLINE =
  /\b(replacement|spare|part|parts|pad|pads|mat|net|ladder|anchor|cover|tent|hoop|skirt|sprinkler|bag|shade)\b/i;

function priceRow(product: string, variant: string, price: number, was: number | null): PriceRow {
  const discounted = was !== null && was > price;
  return {
    product,
    variant,
    price,
    was: discounted ? was : null,
    saving: discounted ? Math.round(was - price) : null,
    savingPercent: discounted ? Math.round(((was - price) / was) * 100) : null,
  };
}

function itemName(item: unknown): string {
  if (!item || typeof item !== 'object') return String(item);
  const record = item as Record<string, unknown>;
  for (const key of ['name', 'title', 'productTitle', 'product_title', 'description']) {
    if (typeof record[key] === 'string' && record[key]) return record[key] as string;
  }
  return JSON.stringify(item).slice(0, 200);
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

/**
 * Vuly renders each product tile with
 * `window.mountReactComponent("MakeSizePromoTile", "<id>", {...props})`. The props hold
 * every size's price and list price, any sale wording, free items, and per-size savings
 * blocks, which is the same information the promo banner shows as an image.
 */
export function parseVulyTiles(html: string, source: string): StructuredData {
  const rows: PriceRow[] = [];
  const notes: string[] = [];
  const marker = /mountReactComponent\(\s*"MakeSizePromoTile"\s*,\s*"[^"]*"\s*,\s*/g;

  for (const match of html.matchAll(marker)) {
    const props = readJsonObject(html, (match.index ?? 0) + match[0].length);
    if (!props) continue;

    const product = String(props.productTitle ?? '').trim();
    const sizes = asArray(props.makeSizes) as Record<string, unknown>[];
    const savings = (props.makeSizeSavings ?? {}) as Record<string, Record<string, unknown>>;

    for (const size of sizes) {
      const price = Number(size.price_inc_gst);
      const listPrice = Number(size.clearance_was_price);
      if (!Number.isFinite(price) || price <= 0) continue;
      rows.push(priceRow(product, String(size.size ?? ''), price, listPrice > 0 ? listPrice : null));

      // The savings map is shared across tiles, so only read the entries for this tile's sizes.
      const block = savings[String(size.id)];
      if (!block) continue;
      const parts = [block.top_text, ...asArray(block.blocks).flatMap((entry) => {
        const record = entry as Record<string, unknown>;
        return [record.title, record.body, record.final];
      })]
        .filter((part): part is string => typeof part === 'string' && part.trim() !== '')
        .map((part) => part.replace(/\s+/g, ' ').trim());
      if (parts.length > 0) notes.push(`${product} ${size.size}: ${parts.join(' / ')}`);
    }

    if (typeof props.saleText === 'string' && props.saleText.trim()) {
      notes.push(`${product} sale text: ${props.saleText.trim()}`);
    }
    if (typeof props.salesCallToAction === 'string' && props.salesCallToAction.trim()) {
      notes.push(`${product} sale call to action: ${props.salesCallToAction.trim()}`);
    }
    const freeItems = [...asArray(props.freeItems), ...asArray(props.freeItemChoices)].map(itemName);
    if (freeItems.length > 0) notes.push(`${product} free items: ${freeItems.join(', ')}`);
  }

  if (rows.length === 0) throw new Error('No Vuly product tiles found. The page layout may have changed.');
  return { source, rows, notes };
}

function readJsonObject(text: string, start: number): Record<string, unknown> | null {
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (char === '\\') i += 1;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

type ShopifyProduct = {
  title: string;
  product_type?: string;
  variants: { title: string; price: string; compare_at_price: string | null }[];
};

export async function fetchShopifyTrampolines(productsUrl: string): Promise<StructuredData> {
  const rows: PriceRow[] = [];

  for (let page = 1; page <= 6; page += 1) {
    const url = new URL(productsUrl);
    url.searchParams.set('limit', '250');
    url.searchParams.set('page', String(page));
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`${url.href} returned HTTP ${response.status}`);
    const { products } = (await response.json()) as { products: ShopifyProduct[] };
    if (products.length === 0) break;

    for (const product of products) {
      const label = `${product.title} ${product.product_type ?? ''}`;
      if (!SHOPIFY_TRAMPOLINE.test(label) || SHOPIFY_NOT_A_TRAMPOLINE.test(product.title)) continue;
      for (const variant of product.variants) {
        const was = variant.compare_at_price ? Number(variant.compare_at_price) : null;
        const variantName = variant.title === 'Default Title' ? '' : variant.title;
        rows.push(priceRow(product.title, variantName, Number(variant.price), was));
      }
    }
  }

  if (rows.length === 0) throw new Error(`No trampolines found in ${productsUrl}.`);
  return { source: productsUrl, rows, notes: [] };
}

/** What the model sees: every discounted row, plus a count of the rest so "no discounts" is explicit. */
export function summariseStructured(data: StructuredData) {
  const discounted = data.rows.filter((row) => row.was !== null);
  return {
    source: data.source,
    trampolineVariantsChecked: data.rows.length,
    discountedVariants: discounted,
    notes: data.notes,
  };
}
