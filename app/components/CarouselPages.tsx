import CoverPage from './CoverPage';
import ContentPage from './ContentPage';
import EndPage from './EndPage';

interface PageData {
  type: 'cover' | 'content' | 'end';
  title?: string;
  subtitle?: string;
  paragraphs?: string[];
  headline?: string;
  highlight?: string;
  buttonText?: string;
  buttonUrl?: string;
}

interface CarouselPagesProps {
  pages: PageData[];
}

export default function CarouselPages({ pages }: CarouselPagesProps) {
  return (
    <div>
      {pages.map((page, index) => {
        switch (page.type) {
          case 'cover':
            return (
              <div key={index} id={`page-${index}`}>
                <CoverPage title={page.title || ''} subtitle={page.subtitle} />
              </div>
            );
          case 'content':
            return (
              <div key={index} id={`page-${index}`}>
                <ContentPage paragraphs={page.paragraphs || []} />
              </div>
            );
          case 'end':
            return (
              <div key={index} id={`page-${index}`}>
                <EndPage
                  headline={page.headline || ''}
                  highlight={page.highlight}
                  buttonText={page.buttonText}
                  buttonUrl={page.buttonUrl}
                />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
