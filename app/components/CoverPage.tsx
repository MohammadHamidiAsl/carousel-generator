// app/components/CoverPage.tsx
import React from 'react';
import SlideWrapper, { SLIDE_SIZE } from './SlideWrapper';
import LogoComponent from './LogoComponent';

export default function CoverPage({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <SlideWrapper>
      {/* Logo top-left */}
      <LogoComponent
        size="small"
        style={{ position: 'absolute', top: 24, left: 24 }}
      />

      {/* Centered content */}
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
          direction: 'rtl',
        }}
      >
        <h1
          className="font-black text-white"
          style={{ fontSize: 72, margin: 0, fontFamily: 'system-ui, sans-serif' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-gray-400 font-light"
            style={{
              fontSize: 32,
              marginTop: 16,
              fontFamily: 'system-ui, sans-serif',
              maxWidth: 600,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </SlideWrapper>
  );
}
