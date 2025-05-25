// app/components/EndPage.tsx
import React from 'react';
import SlideWrapper, { SLIDE_SIZE } from './SlideWrapper';
import LogoComponent from './LogoComponent';

export default function EndPage({
  headline,
  highlight = '',
  buttonText = 'دموی رایگان',
  buttonUrl = '#',
}: {
  headline: string;
  highlight?: string;
  buttonText?: string;
  buttonUrl?: string;
}) {
  const [before, after] = headline.split(highlight);

  return (
    <SlideWrapper>
      <LogoComponent
        size="small"
        style={{ position: 'absolute', bottom: 24, left: 24 }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: SLIDE_SIZE.width,
          height: SLIDE_SIZE.height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 64px',
          boxSizing: 'border-box',
          direction: 'rtl',
        }}
      >
        <h2
          className="font-bold text-white mb-12"
          style={{ fontSize: 64, lineHeight: 1.2, fontFamily: 'system-ui, sans-serif' }}
        >
          {before}
          {highlight && <span style={{ color: '#FF944D' }}>{highlight}</span>}
          {after}
        </h2>

        <a
          href={buttonUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            borderRadius: 48,
            overflow: 'hidden',
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
          }}
        >
          <span
            className="font-bold text-white"
            style={{
              backgroundColor: 'rgba(139,92,246,1)',
              padding: '24px 48px',
              fontSize: 32,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {buttonText}
          </span>
          <span
            style={{ width: 2, backgroundColor: 'rgba(255,255,255,0.26)' }}
          />
          <span
            className="font-bold text-white"
            style={{
              backgroundColor: 'rgba(139,92,246,1)',
              padding: '24px 48px',
              fontSize: 32,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            n98n.ir
          </span>
        </a>
      </div>
    </SlideWrapper>
  );
}
