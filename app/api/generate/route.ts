import { ImageResponse } from 'next/og';

export const runtime = 'edge';  // Use Edge runtime for minimal cold starts 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dataParam = searchParams.get('data');
  const pages: {
    type: 'cover' | 'content' | 'end';
    title?: string;
    subtitle?: string;
    paragraphs?: string[];
    headline?: string;
    highlight?: string;
    buttonText?: string;
    buttonUrl?: string;
  }[] = dataParam ? JSON.parse(decodeURIComponent(dataParam)) : [];

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#fff',
          padding: '40px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {pages.map((page, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: '32px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            {page.title && (
              <h1 style={{ fontSize: 48, margin: 0 }}>
                {page.title}
              </h1>
            )}
            {page.subtitle && (
              <h2 style={{ fontSize: 32, margin: '8px 0' }}>
                {page.subtitle}
              </h2>
            )}
            {page.paragraphs?.map((text, i) => (
              <p key={i} style={{ fontSize: 24, lineHeight: 1.4 }}>
                {text}
              </p>
            ))}
            {page.buttonText && page.buttonUrl && (
              <a
                href={page.buttonUrl}
                style={{
                  display: 'inline-block',
                  marginTop: '16px',
                  padding: '12px 24px',
                  backgroundColor: '#0070f3',
                  color: '#fff',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: 20,
                }}
              >
                {page.buttonText}
              </a>
            )}
          </div>
        ))}
      </div>
    ),
    {
      width: 1080,
      height: 1080,
    }
  );
}
