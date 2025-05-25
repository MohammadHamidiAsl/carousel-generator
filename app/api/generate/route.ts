// app/api/generate/route.ts
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

interface PageData {
  type: 'cover' | 'content' | 'end';
  title?: string;
  subtitle?: string;
  paragraphs?: string[];
  // …any other fields your pages need
}

interface GenerateRequest {
  pages: PageData[];
}

interface GenerateResponse {
  images?: string[];
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<GenerateResponse>> {
  let browser = null;

  try {
    // 1. Parse & validate input
    const { pages } = (await request.json()) as GenerateRequest;
    if (!Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: 'Invalid pages payload' }, { status: 400 });
    }

    // 2. Launch headless Chrome (Lambda-compatible)
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      defaultViewport: { width: 1080, height: 1080 },
    });

    // 3. Base URL from env var
    const base = process.env.NEXT_PUBLIC_BASE_URL;
    if (!base) {
      throw new Error('Environment variable NEXT_PUBLIC_BASE_URL is not set');
    }

    // 4. Render each page and collect screenshots
    const images: string[] = [];
    const dataParam = encodeURIComponent(JSON.stringify(pages));

    for (let i = 0; i < pages.length; i++) {
      const pg = await browser.newPage();
      const url = `${base}/render?page=${i}&data=${dataParam}`;

      // navigate & wait for network idle
      await Promise.race([
        pg.goto(url, { waitUntil: 'networkidle0' }),
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error('Navigation timeout')), 8000)
        ),
      ]);

      // ensure fonts have loaded (if you rely on webfonts)
      await pg.evaluate(() => (document as any).fonts?.ready);

      // screenshot to base64
      const b64 = (await pg.screenshot({ encoding: 'base64' })) as string;
      images.push(b64);

      await pg.close();
    }

    return NextResponse.json({ images });

  } catch (err: any) {
    console.error('Generation error:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });

  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore close errors
      }
    }
  }
}
