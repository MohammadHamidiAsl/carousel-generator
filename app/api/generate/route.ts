/* app/api/generate/route.ts
 * Uses Playwright’s statically linked Chromium for server-side screenshots.
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';  // ensure full Node.js env

// ─── Types ───────────────────────────────────────────────────────────────
interface PageData {
  type: 'cover' | 'content' | 'end';
  title?: string;
  subtitle?: string;
  paragraphs?: string[];
  headline?: string;
  highlight?: string;
  buttonText?: string;
  buttonUrl?: string;
}
interface RequestBody { pages: PageData[]; }

// ─── Dev Chrome path fallback ─────────────────────────────────────────────
const guessChromePath = (): string | undefined => {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  switch (process.platform) {
    case 'darwin':
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    case 'win32':
      return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    default:
      return '/usr/bin/google-chrome';
  }
};

// ─── Render one slide to base64 PNG ──────────────────────────────────────
async function renderPageToPng(
  browser: any,
  idx: number,
  pages: PageData[],
  baseUrl: string
): Promise<string> {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1080, height: 1080 });

  const url = `${baseUrl}/render?page=${idx}&data=${encodeURIComponent(
    JSON.stringify(pages)
  )}`;
  await page.goto(url, { waitUntil: 'networkidle' });

  try {
    // wait for fonts
    await page.evaluate(() => (document as any).fonts.ready);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
  }

  const buffer = await page.screenshot({ type: 'png' });
  await page.close();
  return buffer.toString('base64');
}

// ─── POST handler ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    if (!Array.isArray(body.pages) || !body.pages.length) {
      return NextResponse.json(
        { success: false, message: 'Pages array is required' },
        { status: 400 }
      );
    }

    // build baseUrl
    const host     = request.headers.get('host') ?? 'localhost:3000';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    const baseUrl  =
      process.env.NEXT_PUBLIC_BASE_URL ?? `${protocol}://${host}`;

    // ─── dynamically import Playwright ───────────────────────────────────
    const { chromium } = await import('playwright-chromium');

    // launch options
    const executablePath = process.env.CHROME_PATH || guessChromePath();
    const browser = await chromium.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // render all pages
    try {
      const images = await Promise.all(
        body.pages.map((_, i) =>
          renderPageToPng(browser, i, body.pages, baseUrl)
        )
      );
      return NextResponse.json({
        success: true,
        images,
        count: images.length
      });
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error('Generation error:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate images',
        error: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
}
