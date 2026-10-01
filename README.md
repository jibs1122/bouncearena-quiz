This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Bounce Arena Quiz

## Comparison data source

The `Aus` tab in the [Bounce Arena comparison spreadsheet](https://docs.google.com/spreadsheets/d/1CLjH67Sf9o2diBMUwiG9zmkhs47N90GmL4LxQ6TYsZk/edit?usp=sharing) is the source of truth for Australian trampoline specifications. Do not override its facts in page copy or in a second hand-maintained catalogue.

Refresh the generated site data after editing that tab:

```sh
npm run refresh:compare-data
```

The refresh script targets the `Aus` tab explicitly and regenerates `data/trampolines.ts`.

## Monthly trampoline deals update

`.github/workflows/monthly-trampoline-deals.yml` runs at 00:00 UTC on the 1st of each month (10am or 11am in Melbourne). It adds that month's section to `content/blog/trampoline-deals-sales.mdx`, commits it to `main`, and Vercel deploys it. It needs an `ANTHROPIC_API_KEY` repository secret. Run it early from the Actions tab with **Run workflow**.

For each brand in `scripts/deals/brands.ts`, the script:

1. Loads the brand's own pages (never the affiliate URL) in headless Chromium, keeping the visible text and screenshots of the top of each page.
2. Reads structured prices where the store exposes them: Vuly's product tiles carry list price, sale price, savings and free items as JSON, and Shopify stores (Springfree, Lifespan Kids) publish compare-at prices in `products.json`.
3. Has Claude record the trampoline deal as facts, each with the exact words it came from.
4. Keeps only facts whose quotes and numbers appear in the captured evidence. A fact read only from a banner image must also appear in a second, independent transcription of the banners.
5. Has Claude write the paragraph from those facts alone, so it never sees the brand's own wording. The paragraph is checked for invented numbers, sale prices (savings only), hype and calls to action, em dashes, and any 8-word run copied from the brand's page. It gets one rewrite; a second failure leaves the brand out.
6. Adds the link and promo code in code. Links come from `brands.ts` (partner links carry affiliate tracking), and codes come from `lib/promoCtas.ts`. A brand with a code but no sale is still listed with its code.
7. Opens the link target in the browser before publishing.

A brand that fails a step is left out rather than published. The workflow opens a GitHub issue listing what was left out and why, and keeps the screenshots, page text and report as a run artifact for 90 days. Each run's facts and prices are saved to `deals-history/YYYY-MM.json`.

To run it locally, put `ANTHROPIC_API_KEY` in `.env.local` and install the browser once:

```sh
npx playwright install --only-shell chromium
```

Preview this month's section without changing the post:

```sh
npm run update:trampoline-deals -- --dry-run
```

Check one brand (always a dry run):

```sh
npm run update:trampoline-deals -- --brand Vuly
```

Write the section into the post. Running it again in the same month replaces that month's section:

```sh
npm run update:trampoline-deals
```

Screenshots, page text and the report go to `.deals-cache/`, which is gitignored. To add a brand, add an entry to `scripts/deals/brands.ts`. If it has a promo code in `lib/promoCtas.ts`, add a `codeNotes` line for each code.
