/* Generates 1080×1080 PNG slides using Playwright’s static Chromium. */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';  // full Node.js environment for Playwright

// ─── Types ────────────────────────────────────────────────────────────────
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

// ─── Helper: render one slide to PNG ──────────────────────────────────────
async function renderPageToPng(
  page: any,
  idx: number,
  pages: PageData[],
  baseUrl: string
): Promise<string> {
  await page.setViewportSize({ width: 1080, height: 1080 });

  const url = `${baseUrl}/render?page=${idx}&data=${encodeURIComponent(
    JSON.stringify(pages)
  )}`;
  await page.goto(url, { waitUntil: 'networkidle' });

  try {
    await page.evaluate(() => (document as any).fonts.ready);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
  }

  const buf = await page.screenshot({ type: 'png' });
  return buf.toString('base64');
}

// ─── POST handler ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { pages }: RequestBody = await request.json();
    if (!Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Pages array is required' },
        { status: 400 }
      );
    }

    // Build baseUrl from incoming request
    const host     = request.headers.get('host') ?? 'localhost:3000';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    const baseUrl  =
      process.env.NEXT_PUBLIC_BASE_URL ?? `${protocol}://${host}`;

    // Dynamically import Playwright to avoid webpack bundling all of it :contentReference[oaicite:7]{index=7}
    const { chromium } = await import('playwright-chromium');

    // Launch Chromium – uses the binary installed by postinstall :contentReference[oaicite:8]{index=8}
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext();

    const images = await Promise.all(
      pages.map(async (_pg, i) => {
        const page = await context.newPage();
        const png  = await renderPageToPng(page, i, pages, baseUrl);
        await page.close();
        return png;
      })
    );

    await browser.close();
    return NextResponse.json({ success: true, images, count: images.length });
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
