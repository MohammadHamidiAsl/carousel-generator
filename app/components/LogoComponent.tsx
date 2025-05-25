// app/components/LogoComponent.tsx
import React from 'react';

export default function LogoComponent({
  className = '',
  size = 'large',
  alt = 'n98n logo',
  style = {},
}: {
  className?: string;
  size?: 'small' | 'large';
  alt?: string;
  style?: React.CSSProperties;
}) {
  const px = size === 'large' ? 144 : 72;
  return (
    <img
      src="/logo.svg"
      alt={alt}
      draggable={false}
      className={className}
      style={{ width: px, height: px, objectFit: 'contain', ...style }}
    />
  );
}
