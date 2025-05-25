// app/components/CarouselPages.tsx
import React from 'react';
import CoverPage from './CoverPage';
import ContentPage from './ContentPage';
import EndPage from './EndPage';

export interface PageData {
  type: 'cover' | 'content' | 'end';
  title?: string;
  subtitle?: string;
  paragraphs?: string[];
  highlight?: string;
  buttonText?: string;
  buttonUrl?: string;
}

export default function CarouselPages({ pages }: { pages: PageData[] }) {
  return (
    <>
      {pages.map((p, i) => {
        switch (p.type) {
          case 'cover':
            return <CoverPage key={i} title={p.title!} subtitle={p.subtitle} />;
          case 'content':
            return <ContentPage key={i} paragraphs={p.paragraphs!} />;
          case 'end':
            return (
              <EndPage
                key={i}
                headline={p.title!}
                highlight={p.highlight}
                buttonText={p.buttonText}
                buttonUrl={p.buttonUrl}
              />
            );
        }
      })}
    </>
  );
}
