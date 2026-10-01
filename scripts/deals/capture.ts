import { chromium, type Browser, type Page } from 'playwright';

export type PageCapture = {
  url: string;
  ok: boolean;
  status: number | null;
  finalUrl: string;
  title: string;
  /** Visible text after scripts have run, one line per block. */
  text: string;
  html: string;
  /** JPEG tiles from the top of the page down, so banner text stays legible. */
  screenshots: Buffer[];
  error?: string;
};

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const VIEWPORT = { width: 1366, height: 1000 };
const MAX_TILES = 4;
const MAX_TEXT_CHARS = 60_000;

export function launchBrowser(): Promise<Browser> {
  return chromium.launch();
}

function normaliseText(raw: string): string {
  const lines: string[] = [];
  for (const line of raw.split('\n')) {
    const clean = line.replace(/\s+/g, ' ').trim();
    if (clean && clean !== lines[lines.length - 1]) lines.push(clean);
  }
  return lines.join('\n').slice(0, MAX_TEXT_CHARS);
}

/** Scrolls to the bottom and back so lazy-loaded banners and product tiles render. */
async function loadLazyContent(page: Page) {
  await page.evaluate(async () => {
    const limit = Math.min(document.body.scrollHeight, 15_000);
    for (let y = 0; y < limit; y += 800) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1_000);
}

async function screenshotTiles(page: Page): Promise<Buffer[]> {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const tiles: Buffer[] = [];
  for (let y = 0; y < height && tiles.length < MAX_TILES; y += VIEWPORT.height) {
    tiles.push(
      await page.screenshot({
        type: 'jpeg',
        quality: 75,
        fullPage: true,
        clip: { x: 0, y, width: VIEWPORT.width, height: Math.min(VIEWPORT.height, height - y) },
      }),
    );
  }
  return tiles;
}

export async function capturePage(browser: Browser, url: string, screenshot: boolean): Promise<PageCapture> {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    userAgent: USER_AGENT,
    locale: 'en-AU',
    timezoneId: 'Australia/Melbourne',
  });
  const page = await context.newPage();

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await loadLazyContent(page);
    // Close newsletter and chat popups that open over the banner.
    await page.keyboard.press('Escape').catch(() => {});

    const status = response?.status() ?? null;
    return {
      url,
      ok: status !== null && status >= 200 && status < 400,
      status,
      finalUrl: page.url(),
      title: await page.title(),
      text: normaliseText(await page.evaluate(() => document.body?.innerText ?? '')),
      html: await page.content(),
      screenshots: screenshot ? await screenshotTiles(page) : [],
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: null,
      finalUrl: url,
      title: '',
      text: '',
      html: '',
      screenshots: [],
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await context.close();
  }
}
