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
