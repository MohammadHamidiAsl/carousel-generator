import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

interface PageData {
  type: 'cover' | 'content' | 'end';
  title?: string;
  subtitle?: string;
  paragraphs?: string[];
  // …other fields…
}

export async function POST(request: Request) {
  let browser = null;
  try {
    const { pages } = await request.json() as { pages: PageData[] };
    if (!Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: 'Invalid pages payload' }, { status: 400 });
    }

    // Launch Chrome in Lambda-compatible mode
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      defaultViewport: { width: 1080, height: 1080 },
    });

    const results: string[] = [];
    const base = process.env.NEXT_PUBLIC_BASE_URL;
    if (!base) throw new Error('NEXT_PUBLIC_BASE_URL not set');

    for (let i = 0; i < pages.length; i++) {
      const page = await browser.newPage();
      const dataParam = encodeURIComponent(JSON.stringify(pages));
      const url = `${base}/render?page=${i}&data=${dataParam}`;

      // Navigate with timeout guard
      await Promise.race([
        page.goto(url, { waitUntil: 'networkidle' }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Navigation timeout')), 8000))
      ]);

      // Wait for fonts to load, if you rely on them
      await page.evaluate(() => (document as any).fonts?.ready);

      const screenshot = await page.screenshot({ encoding: 'base64' });
      results.push(screenshot);
      await page.close();
    }

    return NextResponse.json({ images: results });
  } catch (e: any) {
    console.error('Generation error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}
