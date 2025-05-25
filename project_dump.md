# Code dump of `carousel-generator`

### app\api\generate\route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { Browser } from 'puppeteer';

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
      // most Linux distros have one of these in $PATH
      return '/usr/bin/google-chrome';
  }
};

//
// ─── Helper: render ONE page to PNG ────────────────────────────────────────
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

  /* ---------- wait for fonts (Puppeteer v22+) -------------------------- */
  try {
    await page.evaluate(() => (document as any).fonts.ready);
  } catch {
    // fallback to a small delay if Font Loading API isn't available
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

    // -------- Build a baseUrl that matches *this* request ------------------
    const hostHeader = request.headers.get('host') ?? 'localhost:3000';
    const isLocalhost =
      hostHeader.startsWith('localhost') || hostHeader.startsWith('127.');
    const protocol = isLocalhost ? 'http' : 'https';

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? `${protocol}://${hostHeader}`;

    // -------- Launch Puppeteer --------------------------------------------
    const chromePath = guessChromePath(); // may be undefined
    const launchOpts: puppeteer.PuppeteerLaunchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--font-render-hinting=none'
      ]
    };
    if (chromePath) launchOpts.executablePath = chromePath;

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

```

### app\components\CarouselPages.tsx

```tsx
import CoverPage from './CoverPage';
import ContentPage from './ContentPage';
import EndPage from './EndPage';

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

interface CarouselPagesProps {
  pages: PageData[];
}

export default function CarouselPages({ pages }: CarouselPagesProps) {
  return (
    <div>
      {pages.map((page, index) => {
        switch (page.type) {
          case 'cover':
            return (
              <div key={index} id={`page-${index}`}>
                <CoverPage title={page.title || ''} subtitle={page.subtitle} />
              </div>
            );
          case 'content':
            return (
              <div key={index} id={`page-${index}`}>
                <ContentPage paragraphs={page.paragraphs || []} />
              </div>
            );
          case 'end':
            return (
              <div key={index} id={`page-${index}`}>
                <EndPage
                  headline={page.headline || ''}
                  highlight={page.highlight}
                  buttonText={page.buttonText}
                  buttonUrl={page.buttonUrl}
                />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

```

### app\components\ContentPage.tsx

```tsx
import LogoComponent from './LogoComponent';

interface ContentPageProps {
  paragraphs: string[];
}

export default function ContentPage({ paragraphs }: ContentPageProps) {
  return (
    <div className="carousel-page relative min-h-screen overflow-hidden" style={{ backgroundColor: '#1a1b2e' }}>
      {/* Deep radial glow background - same as cover page */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.08) 0%, rgba(26, 27, 46, 0.98) 60%, rgba(26, 27, 46, 1) 100%)'
      }} />

      {/* Logo positioned in bottom-left */}
      <LogoComponent className="absolute bottom-6 left-6 z-10" size="small" />

      {/* Content container - centered vertically and horizontally */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="max-w-4xl px-8" dir="rtl">
          {/* Paragraphs */}
          {paragraphs.length > 0 && (
            <div className="space-y-12 text-center">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-400 leading-relaxed"
                  style={{ 
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    lineHeight: '1.8'
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### app\components\CoverPage.tsx

```tsx
import LogoComponent from './LogoComponent';

interface CoverPageProps {
  title: string;
  subtitle?: string;
}

export default function CoverPage({ title, subtitle }: CoverPageProps) {
  return (
    <div className="carousel-page relative min-h-screen overflow-hidden" style={{ backgroundColor: '#1a1b2e' }}>
      {/* Deep radial glow background */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.08) 0%, rgba(26, 27, 46, 0.98) 60%, rgba(26, 27, 46, 1) 100%)'
      }} />
      
      {/* Logo positioned in top-left */}
      <LogoComponent className="absolute top-6 left-6 z-10" size="small" />

      {/* Partial frame with curved corner */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Curved border container */}
        <div 
          className="absolute"
          style={{ 
            left: '380px', // Start after logo
            top: '32px',
            right: '32px',
            bottom: '32px'
          }}
        >
          {/* Top border with gradient */}
          <div 
            className="absolute top-0 left-0 h-2"
            style={{ 
              right: '24px', // Leave space for curve
              background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.4) 30%, rgba(139, 92, 246, 0.8) 100%)'
            }}
          />
          
          {/* Right border with gradient */}
          <div 
            className="absolute top-6 right-0 w-2"
            style={{ 
              bottom: '0',
              background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.8) 0%, rgba(139, 92, 246, 0.4) 70%, transparent 100%)'
            }}
          />
          
          {/* Curved corner */}
          <div 
            className="absolute top-0 right-0 w-6 h-6"
            style={{
              borderTopRightRadius: '24px',
              border: '8px solid rgba(139, 92, 246, 0.8)',
              borderLeft: 'none',
              borderBottom: 'none'
            }}
          />
        </div>
      </div>

      {/* Main content container - centered vertically and horizontally */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center max-w-5xl px-8" dir="rtl">
          {/* Main title - smaller font size */}
          <h1 
            className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-none tracking-tight" 
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            {title}
          </h1>
          
          {/* Subtitle/description - larger font size */}
          {subtitle && (
            <div className="max-w-3xl mx-auto mt-8">
              <p 
                className="text-2xl md:text-3xl lg:text-4xl text-gray-400 leading-relaxed font-light"
                style={{ 
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  lineHeight: '1.6'
                }}
              >
                {subtitle}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### app\components\EndPage.tsx

```tsx
import LogoComponent from './LogoComponent';

interface EndPageProps {
  headline: string;
  highlight?: string;
  buttonText?: string;
  buttonUrl?: string;
}

export default function EndPage({
  headline,
  highlight = '',
  buttonText = 'دموی رایگان',
  buttonUrl = '#'
}: EndPageProps) {
  const parts = highlight ? headline.split(highlight) : [headline];

  return (
    <div className="carousel-page relative min-h-screen overflow-hidden" style={{ backgroundColor: '#1a1b2e' }}>
      {/* Deep radial glow background - same as other pages */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.08) 0%, rgba(26, 27, 46, 0.98) 60%, rgba(26, 27, 46, 1) 100%)'
      }} />

      {/* Logo positioned in bottom-left */}
      <LogoComponent className="absolute bottom-6 left-6 z-10" size="small" />

      {/* Main content - centered */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="max-w-5xl px-8 text-center" dir="rtl">
          {/* Headline - centered with highlight */}
          <h2 
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-20"
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: '1.2'
            }}
          >
            {parts[0]}
            {highlight && (
              <span className="text-orange-500">{highlight}</span>
            )}
            {parts[1]}
          </h2>
        </div>

        {/* CTA Button - centered below text - made even bigger */}
        <a
          href={buttonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex overflow-hidden rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300"
          style={{ direction: 'rtl' }}
        >
          <span 
            className="px-24 py-12 text-4xl font-bold text-white transition-all duration-300 hover:bg-purple-600"
            style={{ backgroundColor: 'rgba(139, 92, 246, 1)' }}
          >
            دموی رایگان
          </span>
          <span className="w-px bg-white/26" />
          <span 
            className="px-24 py-12 text-4xl font-bold text-white transition-all duration-300 hover:bg-purple-700"
            style={{ backgroundColor: 'rgba(139, 92, 246, 1)' }}
          >
            n98n.ir
          </span>
        </a>
      </div>
    </div>
  );
}
```

### app\components\LogoComponent.tsx

```tsx
interface LogoProps {
  className?: string;
  size?: 'small' | 'large';
  alt?: string;
}

export default function LogoComponent({
  className = '',
  size = 'large',
  alt = 'n98n logo'
}: LogoProps) {
  // Tailwind sizes: small ≈ 72 px, large ≈ 144 px
  const sizeClasses = size === 'large' ? 'w-36 h-36' : 'w-18 h-18';

  return (
    <div className={`${sizeClasses} ${className}`}>
      {/* static file from /public */}
      <img
        src="/logo.svg"
        alt={alt}
        className="w-full h-full object-contain"
        draggable={false}
      />
    </div>
  );
}

```

### app\globals.css

```css
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap');

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html {
  color-scheme: dark;
}

body {
  color: white;
  background: #0b0d1a;
  font-family: 'Vazirmatn', 'Tahoma', 'Arial Unicode MS', sans-serif;
  direction: rtl;
}

.carousel-page {
  width: 1080px;
  height: 1080px;
  position: relative;
  overflow: hidden;
}

@layer utilities {
  .text-shadow-lg {
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .backdrop-blur-subtle {
    backdrop-filter: blur(1px);
  }
}

```

### app\layout.tsx

```tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carousel Generator',
  description: 'Beautiful Persian carousel image generator'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}

```

### app\page.tsx

```tsx
'use client';

import { useState } from 'react';

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

export default function Home() {
  const [pages, setPages] = useState<PageData[]>([
    {
      type: 'cover',
      title: 'آموزش برنامه‌نویسی',
      subtitle: 'یادگیری Python از صفر تا صد'
    },
    {
      type: 'content',
      paragraphs: [
        'لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است.',
        'چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است.'
      ]
    },
    {
      type: 'content',
      paragraphs: [
        'برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد.',
        'کتابهای زیادی در شصت و سه درصد گذشته، حال و آینده شناخت فراوان جامعه و متخصصان را می طلبد.'
      ]
    },
    {
      type: 'end',
      headline: 'همین الان استفاده بهینه از هوش مصنوعی را شروع کنید',
      highlight: 'هوش مصنوعی',
      buttonText: 'دموی رایگان',
      buttonUrl: 'https://n98n.ir'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const generateImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pages })
      });

      const data = await response.json();
      if (data.success) {
        setImages(data.images);
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Network error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-bg p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          🎨 Carousel Generator
        </h1>

        <div className="bg-primary-content rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Configure Pages</h2>

          {pages.map((page, index) => (
            <div
              key={index}
              className="mb-6 p-4 border border-primary-purple/30 rounded"
            >
              <h3 className="text-lg font-medium mb-2">
                Page {index + 1}: {page.type}
              </h3>

              {page.type === 'cover' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Title"
                    value={page.title || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, title: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Subtitle"
                    value={page.subtitle || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, subtitle: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                </div>
              )}

              {page.type === 'content' && (
                <div className="space-y-3">
                  {page.paragraphs?.map((paragraph, pIndex) => (
                    <textarea
                      key={pIndex}
                      value={paragraph}
                      onChange={(e) => {
                        const newPages = [...pages];
                        const newParagraphs = [...(page.paragraphs || [])];
                        newParagraphs[pIndex] = e.target.value;
                        newPages[index] = {
                          ...page,
                          paragraphs: newParagraphs
                        };
                        setPages(newPages);
                      }}
                      className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white h-20"
                      rows={2}
                    />
                  ))}
                </div>
              )}

              {page.type === 'end' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Headline"
                    value={page.headline || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, headline: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Text to highlight"
                    value={page.highlight || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, highlight: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Button Text"
                    value={page.buttonText || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, buttonText: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Button URL"
                    value={page.buttonUrl || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, buttonUrl: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <button
            onClick={generateImages}
            disabled={loading}
            className="bg-gradient-button text-white px-8 py-3 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Images'}
          </button>
        </div>

        {images.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">
              Generated Images
            </h2>
            <div className="grid gap-6">
              {images.map((image, index) => (
                <div key={index} className="text-center">
                  <h3 className="text-lg mb-3">Image {index + 1}</h3>
                  <img
                    src={`data:image/png;base64,${image}`}
                    alt={`Generated image ${index + 1}`}
                    className="mx-auto rounded-lg shadow-lg max-w-md"
                  />
                  <a
                    href={`data:image/png;base64,${image}`}
                    download={`carousel-${index + 1}.png`}
                    className="inline-block mt-3 bg-primary-purple text-white px-4 py-2 rounded hover:opacity-90 transition-opacity"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

```

### app\render\page.tsx

```tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import CarouselPages from '../components/CarouselPages';

function RenderPageContent() {
  const searchParams = useSearchParams();
  const pageIndex = parseInt(searchParams.get('page') || '0');
  const dataParam = searchParams.get('data');

  if (!dataParam) {
    return <div>No data provided</div>;
  }

  try {
    const pages = JSON.parse(decodeURIComponent(dataParam));
    const selectedPage = pages[pageIndex];

    if (!selectedPage) {
      return <div>Page not found</div>;
    }

    return <CarouselPages pages={[selectedPage]} />;
  } catch (error) {
    return <div>Error parsing data</div>;
  }
}

export default function RenderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RenderPageContent />
    </Suspense>
  );
}

```

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer']
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  }
};

module.exports = nextConfig;

```

### next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

```

### package.json

```json
{
  "name": "carousel-generator",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "html-to-image": "^1.11.11",
    "next": "^14.0.0",
    "puppeteer": "^22.8.2",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/puppeteer": "^7.0.4",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.0"
  }
}

```

### project_dump.md

```markdown
# Code dump of `carousel-generator`

### app\api\generate\route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { Browser } from 'puppeteer';

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
      // most Linux distros have one of these in $PATH
      return '/usr/bin/google-chrome';
  }
};

//
// ─── Helper: render ONE page to PNG ────────────────────────────────────────
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

  /* ---------- wait for fonts (Puppeteer v22+) -------------------------- */
  try {
    await page.evaluate(() => (document as any).fonts.ready);
  } catch {
    // fallback to a small delay if Font Loading API isn't available
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

    // -------- Build a baseUrl that matches *this* request ------------------
    const hostHeader = request.headers.get('host') ?? 'localhost:3000';
    const isLocalhost =
      hostHeader.startsWith('localhost') || hostHeader.startsWith('127.');
    const protocol = isLocalhost ? 'http' : 'https';

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? `${protocol}://${hostHeader}`;

    // -------- Launch Puppeteer --------------------------------------------
    const chromePath = guessChromePath(); // may be undefined
    const launchOpts: puppeteer.PuppeteerLaunchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--font-render-hinting=none'
      ]
    };
    if (chromePath) launchOpts.executablePath = chromePath;

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

```

### app\components\CarouselPages.tsx

```tsx
import CoverPage from './CoverPage';
import ContentPage from './ContentPage';
import EndPage from './EndPage';

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

interface CarouselPagesProps {
  pages: PageData[];
}

export default function CarouselPages({ pages }: CarouselPagesProps) {
  return (
    <div>
      {pages.map((page, index) => {
        switch (page.type) {
          case 'cover':
            return (
              <div key={index} id={`page-${index}`}>
                <CoverPage title={page.title || ''} subtitle={page.subtitle} />
              </div>
            );
          case 'content':
            return (
              <div key={index} id={`page-${index}`}>
                <ContentPage paragraphs={page.paragraphs || []} />
              </div>
            );
          case 'end':
            return (
              <div key={index} id={`page-${index}`}>
                <EndPage
                  headline={page.headline || ''}
                  highlight={page.highlight}
                  buttonText={page.buttonText}
                  buttonUrl={page.buttonUrl}
                />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

```

### app\components\ContentPage.tsx

```tsx
import LogoComponent from './LogoComponent';

interface ContentPageProps {
  paragraphs: string[];
}

export default function ContentPage({ paragraphs }: ContentPageProps) {
  return (
    <div className="carousel-page relative min-h-screen overflow-hidden" style={{ backgroundColor: '#1a1b2e' }}>
      {/* Deep radial glow background - same as cover page */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.08) 0%, rgba(26, 27, 46, 0.98) 60%, rgba(26, 27, 46, 1) 100%)'
      }} />

      {/* Logo positioned in bottom-left */}
      <LogoComponent className="absolute bottom-6 left-6 z-10" size="small" />

      {/* Content container - centered vertically and horizontally */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="max-w-4xl px-8" dir="rtl">
          {/* Paragraphs */}
          {paragraphs.length > 0 && (
            <div className="space-y-12 text-center">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-400 leading-relaxed"
                  style={{ 
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    lineHeight: '1.8'
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### app\components\CoverPage.tsx

```tsx
import LogoComponent from './LogoComponent';

interface CoverPageProps {
  title: string;
  subtitle?: string;
}

export default function CoverPage({ title, subtitle }: CoverPageProps) {
  return (
    <div className="carousel-page relative min-h-screen overflow-hidden" style={{ backgroundColor: '#1a1b2e' }}>
      {/* Deep radial glow background */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.08) 0%, rgba(26, 27, 46, 0.98) 60%, rgba(26, 27, 46, 1) 100%)'
      }} />
      
      {/* Logo positioned in top-left */}
      <LogoComponent className="absolute top-6 left-6 z-10" size="small" />

      {/* Partial frame with curved corner */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Curved border container */}
        <div 
          className="absolute"
          style={{ 
            left: '380px', // Start after logo
            top: '32px',
            right: '32px',
            bottom: '32px'
          }}
        >
          {/* Top border with gradient */}
          <div 
            className="absolute top-0 left-0 h-2"
            style={{ 
              right: '24px', // Leave space for curve
              background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.4) 30%, rgba(139, 92, 246, 0.8) 100%)'
            }}
          />
          
          {/* Right border with gradient */}
          <div 
            className="absolute top-6 right-0 w-2"
            style={{ 
              bottom: '0',
              background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.8) 0%, rgba(139, 92, 246, 0.4) 70%, transparent 100%)'
            }}
          />
          
          {/* Curved corner */}
          <div 
            className="absolute top-0 right-0 w-6 h-6"
            style={{
              borderTopRightRadius: '24px',
              border: '8px solid rgba(139, 92, 246, 0.8)',
              borderLeft: 'none',
              borderBottom: 'none'
            }}
          />
        </div>
      </div>

      {/* Main content container - centered vertically and horizontally */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center max-w-5xl px-8" dir="rtl">
          {/* Main title - smaller font size */}
          <h1 
            className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-none tracking-tight" 
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            {title}
          </h1>
          
          {/* Subtitle/description - larger font size */}
          {subtitle && (
            <div className="max-w-3xl mx-auto mt-8">
              <p 
                className="text-2xl md:text-3xl lg:text-4xl text-gray-400 leading-relaxed font-light"
                style={{ 
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  lineHeight: '1.6'
                }}
              >
                {subtitle}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### app\components\EndPage.tsx

```tsx
import LogoComponent from './LogoComponent';

interface EndPageProps {
  headline: string;
  highlight?: string;
  buttonText?: string;
  buttonUrl?: string;
}

export default function EndPage({
  headline,
  highlight = '',
  buttonText = 'دموی رایگان',
  buttonUrl = '#'
}: EndPageProps) {
  const parts = highlight ? headline.split(highlight) : [headline];

  return (
    <div className="carousel-page relative min-h-screen overflow-hidden" style={{ backgroundColor: '#1a1b2e' }}>
      {/* Deep radial glow background - same as other pages */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.08) 0%, rgba(26, 27, 46, 0.98) 60%, rgba(26, 27, 46, 1) 100%)'
      }} />

      {/* Logo positioned in bottom-left */}
      <LogoComponent className="absolute bottom-6 left-6 z-10" size="small" />

      {/* Main content - centered */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="max-w-5xl px-8 text-center" dir="rtl">
          {/* Headline - centered with highlight */}
          <h2 
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-20"
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: '1.2'
            }}
          >
            {parts[0]}
            {highlight && (
              <span className="text-orange-500">{highlight}</span>
            )}
            {parts[1]}
          </h2>
        </div>

        {/* CTA Button - centered below text - made even bigger */}
        <a
          href={buttonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex overflow-hidden rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300"
          style={{ direction: 'rtl' }}
        >
          <span 
            className="px-24 py-12 text-4xl font-bold text-white transition-all duration-300 hover:bg-purple-600"
            style={{ backgroundColor: 'rgba(139, 92, 246, 1)' }}
          >
            دموی رایگان
          </span>
          <span className="w-px bg-white/26" />
          <span 
            className="px-24 py-12 text-4xl font-bold text-white transition-all duration-300 hover:bg-purple-700"
            style={{ backgroundColor: 'rgba(139, 92, 246, 1)' }}
          >
            n98n.ir
          </span>
        </a>
      </div>
    </div>
  );
}
```

### app\components\LogoComponent.tsx

```tsx
interface LogoProps {
  className?: string;
  size?: 'small' | 'large';
  alt?: string;
}

export default function LogoComponent({
  className = '',
  size = 'large',
  alt = 'n98n logo'
}: LogoProps) {
  // Tailwind sizes: small ≈ 72 px, large ≈ 144 px
  const sizeClasses = size === 'large' ? 'w-36 h-36' : 'w-18 h-18';

  return (
    <div className={`${sizeClasses} ${className}`}>
      {/* static file from /public */}
      <img
        src="/logo.svg"
        alt={alt}
        className="w-full h-full object-contain"
        draggable={false}
      />
    </div>
  );
}

```

### app\globals.css

```css
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap');

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html {
  color-scheme: dark;
}

body {
  color: white;
  background: #0b0d1a;
  font-family: 'Vazirmatn', 'Tahoma', 'Arial Unicode MS', sans-serif;
  direction: rtl;
}

.carousel-page {
  width: 1080px;
  height: 1080px;
  position: relative;
  overflow: hidden;
}

@layer utilities {
  .text-shadow-lg {
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .backdrop-blur-subtle {
    backdrop-filter: blur(1px);
  }
}

```

### app\layout.tsx

```tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carousel Generator',
  description: 'Beautiful Persian carousel image generator'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}

```

### app\page.tsx

```tsx
'use client';

import { useState } from 'react';

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

export default function Home() {
  const [pages, setPages] = useState<PageData[]>([
    {
      type: 'cover',
      title: 'آموزش برنامه‌نویسی',
      subtitle: 'یادگیری Python از صفر تا صد'
    },
    {
      type: 'content',
      paragraphs: [
        'لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است.',
        'چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است.'
      ]
    },
    {
      type: 'content',
      paragraphs: [
        'برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد.',
        'کتابهای زیادی در شصت و سه درصد گذشته، حال و آینده شناخت فراوان جامعه و متخصصان را می طلبد.'
      ]
    },
    {
      type: 'end',
      headline: 'همین الان استفاده بهینه از هوش مصنوعی را شروع کنید',
      highlight: 'هوش مصنوعی',
      buttonText: 'دموی رایگان',
      buttonUrl: 'https://n98n.ir'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const generateImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pages })
      });

      const data = await response.json();
      if (data.success) {
        setImages(data.images);
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Network error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-bg p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          🎨 Carousel Generator
        </h1>

        <div className="bg-primary-content rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Configure Pages</h2>

          {pages.map((page, index) => (
            <div
              key={index}
              className="mb-6 p-4 border border-primary-purple/30 rounded"
            >
              <h3 className="text-lg font-medium mb-2">
                Page {index + 1}: {page.type}
              </h3>

              {page.type === 'cover' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Title"
                    value={page.title || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, title: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Subtitle"
                    value={page.subtitle || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, subtitle: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                </div>
              )}

              {page.type === 'content' && (
                <div className="space-y-3">
                  {page.paragraphs?.map((paragraph, pIndex) => (
                    <textarea
                      key={pIndex}
                      value={paragraph}
                      onChange={(e) => {
                        const newPages = [...pages];
                        const newParagraphs = [...(page.paragraphs || [])];
                        newParagraphs[pIndex] = e.target.value;
                        newPages[index] = {
                          ...page,
                          paragraphs: newParagraphs
                        };
                        setPages(newPages);
                      }}
                      className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white h-20"
                      rows={2}
                    />
                  ))}
                </div>
              )}

              {page.type === 'end' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Headline"
                    value={page.headline || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, headline: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Text to highlight"
                    value={page.highlight || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, highlight: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Button Text"
                    value={page.buttonText || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, buttonText: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Button URL"
                    value={page.buttonUrl || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, buttonUrl: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <button
            onClick={generateImages}
            disabled={loading}
            className="bg-gradient-button text-white px-8 py-3 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Images'}
          </button>
        </div>

        {images.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">
              Generated Images
            </h2>
            <div className="grid gap-6">
              {images.map((image, index) => (
                <div key={index} className="text-center">
                  <h3 className="text-lg mb-3">Image {index + 1}</h3>
                  <img
                    src={`data:image/png;base64,${image}`}
                    alt={`Generated image ${index + 1}`}
                    className="mx-auto rounded-lg shadow-lg max-w-md"
                  />
                  <a
                    href={`data:image/png;base64,${image}`}
                    download={`carousel-${index + 1}.png`}
                    className="inline-block mt-3 bg-primary-purple text-white px-4 py-2 rounded hover:opacity-90 transition-opacity"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

```

### README.md

```markdown
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        vazir: ['Vazirmatn', 'Tahoma', 'Arial Unicode MS', 'sans-serif']
      },
      colors: {
        primary: {
          bg: '#0b0d1a',
          purple: '#574cff',
          accent: '#ff4433',
          content: '#1a1d29',
          card: '#0f1019'
        }
      },
      backgroundImage: {
        'gradient-radial':
          'radial-gradient(ellipse at center, #1a1d29 0%, #0b0d1a 70%)',
        'gradient-purple':
          'linear-gradient(135deg, #574cff 0%, #8b5cf6 50%, #a855f7 100%)',
        'gradient-button':
          'linear-gradient(135deg, #574cff 0%, #7c3aed 50%, #8b5cf6 100%)',
        'pattern-waves': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cpath d='M0,200 Q100,150 200,200 T400,200 M0,250 Q100,200 200,250 T400,250 M0,150 Q100,100 200,150 T400,150 M0,300 Q100,250 200,300 T400,300 M0,100 Q100,50 200,100 T400,100' stroke='%23ffffff' stroke-opacity='0.03' stroke-width='1' fill='none'/%3E%3C/svg%3E")`
      }
    }
  },
  plugins: []
};

```

### tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
} satisfies Config;

```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

```

