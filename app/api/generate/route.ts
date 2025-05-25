/* app/api/generate/route.ts
 * Screenshot-generator API route – optimised for Vercel
 * Uses puppeteer-core + @sparticuz/chromium-min so no heavy Chromium has to
 * be downloaded at build-time and the bundle stays <10 MB.
 */

import { NextRequest, NextResponse } from 'next/server';

/** Run this route in a Node.js function (the Edge runtime cannot spawn Chromium) */
export const runtime = 'nodejs';

import puppeteer from 'puppeteer-core';
import type { Browser, LaunchOptions } from 'puppeteer-core';
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
// ─── Fallback: locate a local Chrome/Chromium binary (for dev) ────────────
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
// ─── Helper: render ONE page to PNG and return it as base64 ───────────────
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

  /* wait for webfonts if the Font-Loading API is present */
  try {
    await page.evaluate(() => (document as any).fonts.ready);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
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

    /* Build a base URL that mirrors this request (works in dev & prod) */
    const host = request.headers.get('host') ?? 'localhost:3000';
    const isLocal = host.startsWith('localhost') || host.startsWith('127.');
    const protocol = isLocal ? 'http' : 'https';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `${protocol}://${host}`;

    /* -------- Launch Puppeteer ----------------------------------------- */
    const executablePath =
      process.env.CHROME_PATH ||
      (await chromium.executablePath()) ||
      guessChromePath();

    const launchOpts: LaunchOptions = {
      executablePath,
      headless: 'new',
      args: [...chromium.args, '--font-render-hinting=none'],
      defaultViewport: { width: 1080, height: 1080, deviceScaleFactor: 2 }
    };

    let browser: Browser;
    try {
      browser = await puppeteer.launch(launchOpts);
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Puppeteer could not start a browser. Ensure a compatible ' +
            'Chromium is available or CHROME_PATH is correct.',
          error: (e as Error).message
        },
        { status: 500 }
      );
    }

    /* -------- Render all pages ----------------------------------------- */
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
