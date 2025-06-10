// ./app/api/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { Browser, Page } from 'puppeteer';

//
// ─── Data Types ────────────────────────────────────────────────────────────
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
  options?: {
    width?: number;
    height?: number;
    deviceScaleFactor?: number;
    quality?: number;
  };
}

interface ApiResponse {
  success: boolean;
  count?: number;
  images?: string[];
  durationMs?: number;
  message?: string;
  error?: string;
}

//
// ─── Configuration ─────────────────────────────────────────────────────────
//
const CONFIG = {
  DEFAULT_VIEWPORT: { width: 1080, height: 1080, deviceScaleFactor: 2 },
  MAX_PAGES: 20, // Prevent abuse
  TIMEOUT: 30000, // 30 seconds
  CONCURRENT_LIMIT: 3, // Max concurrent page renders
} as const;

//
// ─── Browser Pool Management ───────────────────────────────────────────────
//
class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;
  private lastUsed: number = 0;
  private readonly IDLE_TIMEOUT = 300000; // 5 minutes

  static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  async getBrowser(): Promise<Browser> {
    // Close idle browser
    if (this.browser && Date.now() - this.lastUsed > this.IDLE_TIMEOUT) {
      await this.closeBrowser();
    }

    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await this.launchBrowser();
    }

    this.lastUsed = Date.now();
    return this.browser;
  }

  private async launchBrowser(): Promise<Browser> {
    // Use the Chrome path set by our startup script, or let Puppeteer find it
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

    const launchOptions = {
      ...(executablePath && { executablePath }),
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        // Persian/RTL text rendering optimization
        '--font-render-hinting=none',
        '--enable-font-antialiasing',
        '--enable-lcd-text',
        '--disable-font-subpixel-positioning',
        '--enable-precise-memory-info',
        '--force-device-scale-factor=1',
        // Text and language support
        '--lang=fa-IR',
        '--accept-lang=fa-IR,fa,en-US,en',
        // Browser optimizations
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-background-networking',
        '--memory-pressure-off',
        '--max_old_space_size=4096',
        // Cross-platform optimizations
        '--disable-software-rasterizer',
        '--disable-gpu',
        '--disable-gpu-sandbox',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions',
        '--disable-plugins',
        // Keep images enabled for better text rendering
        '--disable-dev-shm-usage',
      ],
    };

    try {
      const browserInfo = executablePath
        ? `architecture-specific Chrome at ${executablePath}`
        : "Puppeteer's bundled Chromium";
      console.log(`🚀 Launching browser with ${browserInfo} (Persian/RTL support enabled)`);

      const browser = await puppeteer.launch(launchOptions);
      console.log(`✅ Browser launched successfully with Persian text support`);
      return browser;
    } catch (err) {
      console.error('🔴 Puppeteer launch failed:', (err as Error).message);
      throw new Error(`Browser launch failed: ${(err as Error).message}`);
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

//
// ─── Page Rendering with Retry Logic ──────────────────────────────────────
//
async function renderPageToPng(
  browser: Browser,
  pageIndex: number,
  pages: PageData[],
  baseUrl: string,
  options: RequestBody['options'] = {}
): Promise<string> {
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let page: Page | null = null;

    try {
      page = await browser.newPage();

      // Configure viewport
      const viewport = {
        ...CONFIG.DEFAULT_VIEWPORT,
        ...options,
      };
      await page.setViewport(viewport);

      // Set timeouts
      page.setDefaultTimeout(CONFIG.TIMEOUT);
      page.setDefaultNavigationTimeout(CONFIG.TIMEOUT);

      // Optimize page performance
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        // Block unnecessary resources
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
          req.continue();
        } else {
          req.continue();
        }
      });

      const url = `${baseUrl}/render?page=${pageIndex}&data=${encodeURIComponent(
        JSON.stringify(pages)
      )}`;

      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: CONFIG.TIMEOUT
      });

      // Wait for fonts and custom loading
      try {
        await page.evaluate(() => (document as any).fonts.ready);
        await page.waitForFunction(
          () => document.readyState === 'complete',
          { timeout: 5000 }
        );
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Take screenshot
      const buffer = await page.screenshot({
        type: 'png',
        optimizeForSpeed: true,
        captureBeyondViewport: false,
      });

      return buffer.toString('base64');

    } catch (err) {
      lastError = err as Error;
      console.warn(`🟡 Render attempt ${attempt + 1} failed for page ${pageIndex}:`, err);

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  throw lastError || new Error('Unknown rendering error');
}

//
// ─── Batch Processing with Concurrency Control ────────────────────────────
//
async function renderAllPages(
  browser: Browser,
  pages: PageData[],
  baseUrl: string,
  options: RequestBody['options'] = {}
): Promise<string[]> {
  const results: (string | Error)[] = new Array(pages.length);
  const semaphore = Array(CONFIG.CONCURRENT_LIMIT).fill(null);
  let activePromises = 0;

  const renderPage = async (index: number): Promise<void> => {
    try {
      results[index] = await renderPageToPng(browser, index, pages, baseUrl, options);
    } catch (err) {
      results[index] = err as Error;
    }
  };

  // Process pages with concurrency control
  const promises: Promise<void>[] = [];
  for (let i = 0; i < pages.length; i++) {
    if (activePromises >= CONFIG.CONCURRENT_LIMIT) {
      await Promise.race(promises);
    }

    const promise = renderPage(i);
    promises.push(promise);
    activePromises++;

    promise.finally(() => activePromises--);
  }

  await Promise.all(promises);

  // Check for errors and return successful renders
  const images: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (typeof result === 'string') {
      images.push(result);
    } else {
      errors.push(`Page ${i}: ${result.message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Rendering failed for ${errors.length} pages: ${errors.join(', ')}`);
  }

  return images;
}

//
// ─── Validation ────────────────────────────────────────────────────────────
//
function validateRequestBody(body: any): { isValid: boolean; error?: string; data?: RequestBody } {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a valid object' };
  }

  if (!Array.isArray(body.pages)) {
    return { isValid: false, error: '`pages` must be an array' };
  }

  if (body.pages.length === 0) {
    return { isValid: false, error: '`pages` array cannot be empty' };
  }

  if (body.pages.length > CONFIG.MAX_PAGES) {
    return { isValid: false, error: `Maximum ${CONFIG.MAX_PAGES} pages allowed` };
  }

  // Validate page data structure
  for (let i = 0; i < body.pages.length; i++) {
    const page = body.pages[i];
    if (!page.type || !['cover', 'content', 'end'].includes(page.type)) {
      return {
        isValid: false,
        error: `Page ${i}: type must be 'cover', 'content', or 'end'`
      };
    }
  }

  return { isValid: true, data: body as RequestBody };
}

//
// ─── POST Handler ─────────────────────────────────────────────────────────
//
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const startTime = Date.now();

  try {
    // 1️⃣ Parse & validate request
    let rawBody: any;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = validateRequestBody(rawBody);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    const body = validation.data!;

    // 2️⃣ Build base URL
    const host = request.headers.get('host') ?? 'localhost:3000';
    const proto = host.startsWith('localhost') ? 'http' : 'https';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `${proto}://${host}`;

    // 3️⃣ Get browser instance
    const browserManager = BrowserManager.getInstance();
    const browser = await browserManager.getBrowser();

    // 4️⃣ Render pages
    const images = await renderAllPages(browser, body.pages, baseUrl, body.options);

    const duration = Date.now() - startTime;
    console.log(`✅ Generated ${images.length} images in ${duration}ms`);

    return NextResponse.json({
      success: true,
      count: images.length,
      images,
      durationMs: duration,
    });

  } catch (err) {
    const duration = Date.now() - startTime;
    const error = err as Error;

    console.error('🔴 Generation error:', error.message);

    return NextResponse.json(
      {
        success: false,
        message: 'Image generation failed',
        error: error.message,
        durationMs: duration,
      },
      { status: 500 }
    );
  }
}

//
// ─── Health Check Endpoint ─────────────────────────────────────────────────
//
export async function GET(): Promise<NextResponse> {
  try {
    const browserManager = BrowserManager.getInstance();
    const browser = await browserManager.getBrowser();

    // Get system architecture info
    const arch = process.arch;
    const platform = process.platform;
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || 'default';

    return NextResponse.json({
      status: 'healthy',
      browser: browser.isConnected() ? 'connected' : 'disconnected',
      architecture: arch,
      platform: platform,
      chromeExecutable: executablePath,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: (err as Error).message,
        architecture: process.arch,
        platform: process.platform,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}