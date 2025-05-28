import LogoComponent from './LogoComponent';

interface ContentPageProps {
  paragraphs: string[];
}

// Helper function to detect Persian text
function isPersianText(text: string): boolean {
  const persianRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return persianRegex.test(text);
}

export default function ContentPage({ paragraphs }: ContentPageProps) {
  return (
    <div className="carousel-page relative min-h-screen overflow-hidden" style={{ backgroundColor: '#1a1b2e' }}>
      {/* Deep radial glow background - same as cover page */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.08) 0%, rgba(26, 27, 46, 0.98) 60%, rgba(26, 27, 46, 1) 100%)'
      }} />

      {/* Logo positioned in bottom-left */}
      <LogoComponent className="absolute bottom-6 left-6 z-10" size="small" />

      {/* Content container - centered vertically and horizontally */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="max-w-4xl px-8">
          {/* Paragraphs */}
          {paragraphs.length > 0 && (
            <div className="space-y-12 text-center">
              {paragraphs.map((paragraph, index) => {
                const isRTL = isPersianText(paragraph);
                return (
                  <p
                    key={index}
                    className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-400 leading-relaxed"
                    dir={isRTL ? "rtl" : "ltr"}
                    lang={isRTL ? "fa" : "en"}
                    style={{
                      // Use global Persian fonts - DON'T override!
                      fontFamily: "'Vazirmatn', 'Tahoma', 'Arial Unicode MS', sans-serif",
                      lineHeight: '1.8',
                      textAlign: isRTL ? 'right' : 'left',
                      // Additional Persian text optimizations
                      ...(isRTL && {
                        letterSpacing: '0.02em',
                        wordSpacing: '0.1em'
                      })
                    }}
                  >
                    {paragraph}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}