/* app/api/generate/route.ts
 * Generates 1080×1080 PNG slides from HTML pages.
 * Uses puppeteer-core + @sparticuz/chromium-min (≈1 MB) so no 120 MB
 * Chromium download is needed during `npm install`.
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';                       // 👈 Node.js runtime

import puppeteer from 'puppeteer-core';
import type { Browser, PuppeteerLaunchOptions } from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

//
// ─── Types ────────────────────────────────────────────────────────────────
//
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
// ─── Chrome path fallback for local dev ───────────────────────────────────
//
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

//
// ─── Render ONE page to PNG ───────────────────────────────────────────────
//
async function renderPageToPng(
  browser: Browser,
  pageIndex: number,
  pages: PageData[],
  baseUrl: string
): Promise<string> {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

  const url = `${baseUrl}/render?page=${pageIndex}&data=${encodeURIComponent(
    JSON.stringify(pages)
  )}`;

  await page.goto(url, { waitUntil: 'networkidle0' });

  /* wait for web-fonts when possible */
  try {
    await page.evaluate(() => (document as any).fonts.ready);
  } catch {
    await new Promise((r) => setTimeout(r, 2_000));
  }

  const buffer = await page.screenshot({ type: 'png' });
  await page.close();
  return buffer.toString('base64');
}

//
// ─── POST handler ─────────────────────────────────────────────────────────
//
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    if (!Array.isArray(body.pages) || body.pages.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Pages array is required' },
        { status: 400 }
      );
    }

    /* build a base URL that mirrors the incoming request */
    const host = request.headers.get('host') ?? 'localhost:3000';
    const isLocal = host.startsWith('localhost') || host.startsWith('127.');
    const protocol = isLocal ? 'http' : 'https';
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? `${protocol}://${host}`;

    /* -------- Launch Puppeteer ----------------------------------------- */
    const executablePath =
      process.env.CHROME_PATH ||
      (await chromium.executablePath()) ||    // serverless binary
      guessChromePath();                      // local fallback

    const launchOpts: PuppeteerLaunchOptions = {
      executablePath,
      args: [...chromium.args, '--font-render-hinting=none'],
      headless: chromium.headless,
      defaultViewport: { width: 1080, height: 1080, deviceScaleFactor: 2 }
    };

    const browser: Browser = await puppeteer.launch(launchOpts);

    /* -------- Render all pages ----------------------------------------- */
    try {
      const images = await Promise.all(
        body.pages.map((_, i) =>
          renderPageToPng(browser, i, body.pages, baseUrl)
        )
      );
      return NextResponse.json({ success: true, images, count: images.length });
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
