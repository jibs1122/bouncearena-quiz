import type { Trampoline } from '@/data/trampolines';
import ModelImage from '@/components/ModelImage';
import { isAffiliateRow, outboundRel } from '@/lib/affiliate';
import { modelImage } from '@/lib/brands';
import {
  BRAND_COLORS,
  FALLBACK_BRAND_COLOR,
  compareSizeLabel,
  groupPriceRange,
  groupRows,
  isFromPrice,
  productUrl,
  type GroupedTrampoline,
} from '@/lib/compareShared';
import type { ResolvedSide } from '@/lib/comparePages';

function familyPrice(group: GroupedTrampoline): number {
  const prices = group.variants
    .map((variant) => variant.priceAud)
    .filter((price): price is number => price !== null);
  return prices.length > 0 ? Math.max(...prices) : Number.NEGATIVE_INFINITY;
}

/**
 * Brand pages feature one model per brand: the top of the range, preferring a
 * family we have a photo for. Model pages already name their own models, so every
 * resolved family is shown.
 */
function featuredGroups(side: ResolvedSide, type: 'brand' | 'model'): GroupedTrampoline[] {
  const groups = groupRows(side.rows);
  if (type === 'model' || groups.length <= 1) return groups;

  const ranked = [...groups].sort((a, b) => familyPrice(b) - familyPrice(a));
  const withImage = ranked.find((group) => modelImage(group.brand, group.variants[0].model));
  return [withImage ?? ranked[0]];
}

function priceLabel(rows: Trampoline[]) {
  const range = groupPriceRange(rows);
  if (!range) return null;

  const { low, high, hasFromPrice } = range;
  const allFromPrices = rows.every(isFromPrice);
  return (
    <>
      {low === high && hasFromPrice ? 'From ' : allFromPrices ? 'Starting prices ' : ''}
      ${low.toLocaleString('en-AU')}
      {(low !== high || (hasFromPrice && !allFromPrices)) && (
        <span className="ml-1 text-[10px] font-normal text-black/35">
          {low !== high
            ? `to $${high.toLocaleString('en-AU')}${hasFromPrice && !allFromPrices ? ' (includes from prices)' : ''}`
            : 'includes a from price'}
        </span>
      )}
    </>
  );
}

function Card({
  side,
  groups,
  showModelName,
}: {
  side: ResolvedSide;
  groups: GroupedTrampoline[];
  showModelName: boolean;
}) {
  const chip = BRAND_COLORS[side.brand] ?? FALLBACK_BRAND_COLOR;
  const rows = groups.flatMap((group) => group.variants);
  const price = priceLabel(rows);
  const sizes = [...new Set(rows.map(compareSizeLabel))];
  const springSystem = rows.find((row) => row.springSystem)?.springSystem ?? null;
  const heading = showModelName ? groups.map((group) => group.model).join(' / ') : side.label;

  // Pick the top of the featured range and resolve it through the shared outbound
  // link policy so Vuly and Springfree tracking cannot be bypassed.
  const linkRow =
    [...rows]
      .filter((row) => productUrl(row, true))
      .sort((a, b) => (b.priceAud ?? 0) - (a.priceAud ?? 0))[0] ?? null;
  const href = linkRow ? productUrl(linkRow, true) : null;
  const rel = outboundRel(linkRow ? isAffiliateRow(linkRow) : false);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
      <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-gray-50">
        <ModelImage
          brand={side.brand}
          model={groups[0].model}
          sizes="(max-width: 640px) 100vw, 400px"
          className="object-contain p-3"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className={`mb-2 inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${chip}`}>
          {side.brand}
        </span>
        <h3 className="text-base font-semibold text-black">{heading}</h3>

        {price && <p className="mt-1 text-lg font-bold text-black">{price}</p>}
        {springSystem && <p className="mt-1 text-xs text-black/50">{springSystem}</p>}

        {sizes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sizes.map((size) => (
              <span
                key={size}
                className="whitespace-nowrap rounded-full border border-black/10 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-black/60"
              >
                {size}
              </span>
            ))}
          </div>
        )}

        {href && (
          <a
            href={href}
            target="_blank"
            rel={rel}
            className="mt-4 inline-flex w-fit items-center gap-1 rounded-xl bg-[#38b1ab] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2e9a94]"
          >
            Check price →
          </a>
        )}
      </div>
    </div>
  );
}

export default function FeaturedModels({
  sides,
  type,
}: {
  sides: [ResolvedSide, ResolvedSide];
  type: 'brand' | 'model';
}) {
  return (
    <section className="not-prose my-8">
      {type === 'brand' && (
        <h2 className="mb-4 text-xl font-bold text-black">Featured model from each brand</h2>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {sides.map((side) => (
          <Card
            key={side.label}
            side={side}
            groups={featuredGroups(side, type)}
            showModelName={type === 'brand'}
          />
        ))}
      </div>
    </section>
  );
}
