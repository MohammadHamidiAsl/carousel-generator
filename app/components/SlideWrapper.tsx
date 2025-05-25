// app/components/SlideWrapper.tsx
import React from 'react';

export const SLIDE_SIZE = { width: 1080, height: 1080 };

export default function SlideWrapper({
  children,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const baseStyle: React.CSSProperties = {
    ...SLIDE_SIZE,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1a1b2e',
  };

  return (
    <div
      className={`carousel-page overflow-hidden relative ${className}`}
      style={{ ...baseStyle, ...style }}
    >
      {/* shared radial-gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, rgba(79,70,229,0.08) 0%, rgba(26,27,46,0.98) 60%, rgba(26,27,46,1) 100%)',
        }}
      />
      {children}
    </div>
  );
}
