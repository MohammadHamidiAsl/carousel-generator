// app/components/ContentPage.tsx
import React from 'react';
import SlideWrapper, { SLIDE_SIZE } from './SlideWrapper';
import LogoComponent from './LogoComponent';

export default function ContentPage({ paragraphs }: { paragraphs: string[] }) {
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
          alignItems: 'center',
          justifyContent: 'center',
          direction: 'rtl',
          padding: '0 64px',
          boxSizing: 'border-box',
        }}
      >
        <div className="space-y-12 text-center">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-gray-400 font-light"
              style={{
                fontSize: 28,
                lineHeight: 1.8,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {p}
            </p>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
}
