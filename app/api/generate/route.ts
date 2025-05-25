/* app/api/generate/route.ts
 * Generates 1080×1080 PNG slides using Playwright’s static Chromium.
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';  // must run in Node, not Edge

import { chromium, Browser, BrowserTypeLaunchOptions } from 'playwright-chromium';

//
// ─── Types (unchanged) ──────────────────────────────────────────────────
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
interface RequestBody {
  pages: PageData[];
}

//
// ─── Helper: render ONE page to PNG (viewport code unchanged) ──────────
async function renderPageToPng(
  browser: Browser,
  pageIndex: number,
  pages: PageData[],
  baseUrl: string
): Promise<string> {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1080, height: 1080 });
  const url = `${baseUrl}/render?page=${pageIndex}&data=${encodeURIComponent(
    JSON.stringify(pages)
  )}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  try {
    await page.waitForFunction(() => (document as any).fonts.ready);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
  }
  const buffer = await page.screenshot({ type: 'png' });
  await page.close();
  return buffer.toString('base64');
}

//
// ─── POST handler (launch logic updated) ────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    if (!Array.isArray(body.pages) || body.pages.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Pages array is required' },
        { status: 400 }
      );
    }

    const host = request.headers.get('host') ?? 'localhost:3000';
    const protocol = host.startsWith('localhost') || host.startsWith('127.')
      ? 'http'
      : 'https';
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? `${protocol}://${host}`;

    // ─── Launch Playwright Chromium ─────────────────────────────────────
    const launchOpts: BrowserTypeLaunchOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    const browser: Browser = await chromium.launch(launchOpts);

    // ─── Render all pages ────────────────────────────────────────────────
    try {
      const images = await Promise.all(
        body.pages.map((_, idx) =>
          renderPageToPng(browser, idx, body.pages, baseUrl)
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
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate images',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
