import LogoComponent from './LogoComponent';

interface CoverPageProps {
  title: string;
  subtitle?: string;
}

// Helper function to detect Persian text
function isPersianText(text: string): boolean {
  const persianRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return persianRegex.test(text);
}

export default function CoverPage({ title, subtitle }: CoverPageProps) {
  const titleIsPersian = isPersianText(title);
  const subtitleIsPersian = subtitle ? isPersianText(subtitle) : false;

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
        <div className="text-center max-w-5xl px-8" dir={titleIsPersian ? "rtl" : "ltr"}>
          {/* Main title - using global Persian fonts */}
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-none tracking-tight"
            lang={titleIsPersian ? "fa" : "en"}
            style={{
              // Use the fonts from globals.css - DON'T override!
              fontFamily: titleIsPersian
                ? "'Vazirmatn', 'Tahoma', 'Arial Unicode MS', sans-serif"
                : "'Vazirmatn', 'Tahoma', 'Arial Unicode MS', sans-serif"
            }}
          >
            {title}
          </h1>

          {/* Subtitle/description */}
          {subtitle && (
            <div className="max-w-3xl mx-auto mt-8" dir={subtitleIsPersian ? "rtl" : "ltr"}>
              <p
                className="text-2xl md:text-3xl lg:text-4xl text-gray-400 leading-relaxed font-light"
                lang={subtitleIsPersian ? "fa" : "en"}
                style={{
                  fontFamily: subtitleIsPersian
                    ? "'Vazirmatn', 'Tahoma', 'Arial Unicode MS', sans-serif"
                    : "'Vazirmatn', 'Tahoma', 'Arial Unicode MS', sans-serif",
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