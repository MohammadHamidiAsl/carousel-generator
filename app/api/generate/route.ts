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
  // add any other fields your page components require
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
    // 1. Parse & validate payload
    const body = (await request.json()) as GenerateRequest;
    if (!body.pages || !Array.isArray(body.pages) || body.pages.length === 0) {
      return NextResponse.json({ error: 'Invalid pages payload' }, { status: 400 });
    }
    const pages = body.pages;

    // 2. Launch headless Chrome compatible with AWS Lambda / Vercel
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      defaultViewport: { width: 1080, height: 1080 },
    });

    // 3. Build base URL from env var
    const base = process.env.NEXT_PUBLIC_BASE_URL;
    if (!base) {
      throw new Error('Environment variable NEXT_PUBLIC_BASE_URL is not set');
    }

    // 4. Iterate pages → open, render, screenshot
    const results: string[] = [];
    // encode entire pages array once
    const dataParam = encodeURIComponent(JSON.stringify(pages));

    for (let i = 0; i < pages.length; i++) {
      const pageInstance = await browser.newPage();
      const url = `${base}/render?page=${i}&data=${dataParam}`;

      // navigate with timeout guard
      await Promise.race([
        pageInstance.goto(url, { waitUntil: 'networkidle' }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Navigation timeout')), 8000)
        ),
      ]);

      // wait for any webfonts to be ready
      await pageInstance.evaluate(() => (document as any).fonts?.ready);

      // take screenshot as base64
      const buffer = await pageInstance.screenshot({ encoding: 'base64' }) as string;
      results.push(buffer);

      await pageInstance.close();
    }

    // 5. Return images array
    return NextResponse.json({ images: results });

  } catch (err: any) {
    console.error('Generation error:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });

  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore
      }
    }
  }
}
