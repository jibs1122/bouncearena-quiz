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

## Monthly trampoline deals update

The `update-trampoline-deals` script reads `.env.local` from the repo root before running. Keep your Anthropic key there for local use only.

Example `.env.local`:

```sh
ANTHROPIC_API_KEY=your_rotated_anthropic_api_key_here
# Optional:
# ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

Run the shortcut below from the repo root to fetch the configured retailer pages and prepend a draft section for the current Australia/Melbourne month into the deals post:

```sh
npm run update:trampoline-deals
```

If `ANTHROPIC_API_KEY` is set in your shell, the script will send the scraped evidence to Anthropic to decide whether each brand actually has a live sale/promo and to rewrite the included brand summaries into cleaner copy before writing the section. It also sends up to two likely promo-image URLs per brand so Claude can read offer text that only appears inside banners or other images. Brands without clear sale evidence are omitted for that month. You can optionally set `ANTHROPIC_MODEL`; otherwise the script queries Anthropic's Models API and picks the first supported model from its preferred list.

The default sources live in [config/trampoline-deals-sources.json](/Users/scott/Projects/bouncearena-quiz/config/trampoline-deals-sources.json).

You can override them on a one-off run:

```sh
npm run update:trampoline-deals -- \
  --site "Vuly|https://www.vulyplay.com/aff/100/?url=promo" \
  --site "Springfree|https://www.springfreetrampoline.com.au/collections/trampolines"
```

Preview the generated section without writing to the MDX file:

```sh
npm run update:trampoline-deals -- --dry-run
```

Disable the Anthropic rewrite step for a run even if `ANTHROPIC_API_KEY` is set:

```sh
npm run update:trampoline-deals -- --no-ai
```

Without Anthropic, the script uses a conservative local heuristic to omit brands that do not show obvious sale or promo signals.

The generated monthly section uses plain brand headings with a separate text link for each deal. `Vuly` is always listed first when included, always links to `https://www.vulyplay.com/aff/100/?url=promo`, and always adds the `BOUNCE15` and `BOUNCESURGE` promo code line.
