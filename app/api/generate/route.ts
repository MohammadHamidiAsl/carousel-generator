import { NextRequest, NextResponse } from 'next/server';

/**  Run this API route in the full Node.js runtime on Vercel */
export const runtime = 'nodejs';

import puppeteer from 'puppeteer';
import type { Browser, LaunchOptions } from 'puppeteer';

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
// ─── Locate a Chrome/Chromium binary ───────────────────────────────────────
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
// ─── Helper: render ONE page to PNG ────────────────────────────────────────
async function renderPageToPng(
  browser: Browser,
  pageIndex: number,
  pages: PageData[],
  baseUrl: string
): Promise<string> {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

  const pageUrl = `${baseUrl}/render?page=${pageIndex}&data=${encodeURIComponent(
    JSON.stringify(pages)
  )}`;

  await page.goto(pageUrl, { waitUntil: 'networkidle0' });

  try {
    await page.evaluate(() => (document as any).fonts.ready);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
  }

  const buf = await page.screenshot({ type: 'png' });
  await page.close();

  return buf.toString('base64');
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

    const hostHeader = request.headers.get('host') ?? 'localhost:3000';
    const isLocalhost =
      hostHeader.startsWith('localhost') || hostHeader.startsWith('127.');
    const protocol = isLocalhost ? 'http' : 'https';
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? `${protocol}://${hostHeader}`;

    // -------- Launch Puppeteer --------------------------------------------
    const chromePath = guessChromePath();
    const launchOpts: LaunchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--font-render-hinting=none'
      ],
      executablePath: chromePath
    };

    let browser: Browser;
    try {
      browser = await puppeteer.launch(launchOpts);
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Puppeteer could not start a browser. Check CHROME_PATH or allow Chromium to download.',
          error: (e as Error).message
        },
        { status: 500 }
      );
    }

    // -------- Render all pages --------------------------------------------
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
