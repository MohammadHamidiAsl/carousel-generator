import LogoComponent from './LogoComponent';

interface EndPageProps {
  headline: string;
  highlight?: string;
  buttonText?: string;
  buttonUrl?: string;
}

// Helper function to detect Persian text
function isPersianText(text: string): boolean {
  const persianRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return persianRegex.test(text);
}

export default function EndPage({
  headline,
  highlight = '',
  buttonText = 'دموی رایگان',
  buttonUrl = '#'
}: EndPageProps) {
  const parts = highlight ? headline.split(highlight) : [headline];
  const headlineIsPersian = isPersianText(headline);
  const buttonTextIsPersian = isPersianText(buttonText);

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
        <div className="max-w-5xl px-8 text-center" dir={headlineIsPersian ? "rtl" : "ltr"}>
          {/* Headline - centered with highlight */}
          <h2
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-20"
            lang={headlineIsPersian ? "fa" : "en"}
            style={{
              // Use global Persian fonts - DON'T override!
              fontFamily: "'Vazirmatn', 'Tahoma', 'Arial Unicode MS', sans-serif",
              lineHeight: '1.2',
              // Additional Persian text optimizations
              ...(headlineIsPersian && {
                letterSpacing: '0.02em',
                wordSpacing: '0.1em'
              })
            }}
          >
            {parts[0]}
            {highlight && (
              <span className="text-orange-500">{highlight}</span>
            )}
            {parts[1]}
          </h2>
        </div>

        {/* CTA Button - centered below text */}
        <a
          href={buttonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex overflow-hidden rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300"
          style={{ direction: buttonTextIsPersian ? 'rtl' : 'ltr' }}
        >
          <span
            className="px-24 py-12 text-4xl font-bold text-white transition-all duration-300 hover:bg-purple-600"
            style={{
              backgroundColor: 'rgba(139, 92, 246, 1)',
              // Use Persian fonts for button text
              fontFamily: "'Vazirmatn', 'Tahoma', 'Arial Unicode MS', sans-serif"
            }}
            lang="fa"
          >
            دموی رایگان
          </span>
          <span className="w-px bg-white/26" />
          <span
            className="px-24 py-12 text-4xl font-bold text-white transition-all duration-300 hover:bg-purple-700"
            style={{
              backgroundColor: 'rgba(139, 92, 246, 1)',
              // Use Persian fonts for URL text (mixed content)
              fontFamily: "'Vazirmatn', 'Tahoma', 'Arial Unicode MS', sans-serif"
            }}
            lang="en"
          >
            n98n.ir
          </span>
        </a>
      </div>
    </div>
  );
}