/* Generates 1080×1080 PNG slides with puppeteer-core + chromium-min
 * The handler downloads the official pack TAR the first time it runs,
 * extracts it to /tmp, and never looks for node_modules/@sparticuz/…/bin.
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

import puppeteer from 'puppeteer-core';
import type { Browser, PuppeteerLaunchOptions } from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

/*───────────────────────────────────────────────────────────────────────*/
/*  Types                                                                */
/*───────────────────────────────────────────────────────────────────────*/
interface PageData {
  type: 'cover' | 'content' | 'end';
  title?: string;   subtitle?: string;   paragraphs?: string[];
  headline?: string; highlight?: string;
  buttonText?: string; buttonUrl?: string;
}
interface RequestBody { pages: PageData[]; }

/*───────────────────────────────────────────────────────────────────────*/
/*  Local-dev Chrome path fallback                                       */
/*───────────────────────────────────────────────────────────────────────*/
const guessChromePath = (): string | undefined => {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  switch (process.platform) {
    case 'darwin': return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    case 'win32':  return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    default:       return '/usr/bin/google-chrome';
  }
};

/*───────────────────────────────────────────────────────────────────────*/
/*  Helper – render ONE slide to PNG                                     */
/*───────────────────────────────────────────────────────────────────────*/
async function renderPageToPng(
  browser: Browser, idx: number, pages: PageData[], baseUrl: string
): Promise<string> {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

  const url = `${baseUrl}/render?page=${idx}&data=${encodeURIComponent(
    JSON.stringify(pages)
  )}`;
  await page.goto(url, { waitUntil: 'networkidle0' });

  try { await page.evaluate(() => (document as any).fonts.ready); }
  catch { await new Promise(r => setTimeout(r, 2000)); }

  const buf = await page.screenshot({ type: 'png' });
  await page.close();
  return buf.toString('base64');
}

/*───────────────────────────────────────────────────────────────────────*/
/*  POST handler                                                         */
/*───────────────────────────────────────────────────────────────────────*/
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    if (!Array.isArray(body.pages) || body.pages.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Pages array is required' }, { status: 400 }
      );
    }

    const host      = request.headers.get('host') ?? 'localhost:3000';
    const protocol  = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https';
    const baseUrl   = process.env.NEXT_PUBLIC_BASE_URL ?? `${protocol}://${host}`;

    /*—— Choose where to fetch the pack TAR ————————————————*/
    const packTar = process.env.CHROMIUM_PACK_URL
      ?? 'https://github.com/Sparticuz/chromium/releases/download'
      + '/v127.0.0/chromium-v127.0.0-pack.tar';

    /*—— Launch Puppeteer ————————————————————————————————*/
    const executablePath =
      process.env.CHROME_PATH ||
      (await chromium.executablePath(packTar)) ||   // downloads + extracts to /tmp
      guessChromePath();

    const launchOpts: PuppeteerLaunchOptions = {
      executablePath,
      args: [...chromium.args, '--font-render-hinting=none'],
      headless: chromium.headless,
      defaultViewport: { width: 1080, height: 1080, deviceScaleFactor: 2 }
    };

    const browser: Browser = await puppeteer.launch(launchOpts);

    /*—— Render requested pages ————————————————————————*/
    try {
      const images = await Promise.all(
        body.pages.map((_, i) => renderPageToPng(browser, i, body.pages, baseUrl))
      );
      return NextResponse.json({ success: true, images, count: images.length });
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error('Generation error:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to generate images', error: String(err) },
      { status: 500 }
    );
  }
}
