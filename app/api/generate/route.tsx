// app/api/og/route.ts
import { ImageResponse } from '@vercel/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

interface PageData {
  type: 'cover' | 'content' | 'end'
  title?: string
  subtitle?: string
  paragraphs?: string[]
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const raw = searchParams.get('data')
    const pageIndex = Number(searchParams.get('page') || 0)

    if (!raw) {
      return new Response('Missing data param', { status: 400 })
    }
    const pages: PageData[] = JSON.parse(decodeURIComponent(raw))
    const page = pages[pageIndex]
    if (!page) {
      return new Response('Invalid page index', { status: 400 })
    }

    // render your slide component directly to an image
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Vazirmatn, sans-serif',
            background: 'radial-gradient(circle at center, #1a1b2e, #05051e)',
            padding: 40,
            boxSizing: 'border-box',
          }}
        >
          {/* Example: Cover Slide */}
          {page.type === 'cover' && (
            <>
              <h1 style={{ fontSize: 72, color: 'white', margin: 0 }}>{page.title}</h1>
              {page.subtitle && (
                <h2 style={{ fontSize: 32, color: '#ccc', marginTop: 16 }}>
                  {page.subtitle}
                </h2>
              )}
            </>
          )}

          {/* Example: Content Slide */}
          {page.type === 'content' && (
            <div style={{ width: '100%' }}>
              <h2 style={{ color: 'white', fontSize: 48 }}>{page.title}</h2>
              <div style={{ marginTop: 20 }}>
                {page.paragraphs?.map((p, idx) => (
                  <p key={idx} style={{ color: '#ddd', fontSize: 28, margin: '12px 0' }}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Example: End Slide */}
          {page.type === 'end' && (
            <h1 style={{ fontSize: 64, color: 'white' }}>{page.title ?? 'Thank you!'}</h1>
          )}
        </div>
      ),
      {
        width: 1080,
        height: 1080,
      }
    )
  } catch (e: any) {
    return new Response(`Error: ${e.message}`, { status: 500 })
  }
}
