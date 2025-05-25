'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import CarouselPages from '../components/CarouselPages';

function RenderPageContent() {
  const searchParams = useSearchParams();
  const pageIndex = parseInt(searchParams.get('page') || '0');
  const dataParam = searchParams.get('data');

  if (!dataParam) {
    return <div>No data provided</div>;
  }

  try {
    const pages = JSON.parse(decodeURIComponent(dataParam));
    const selectedPage = pages[pageIndex];

    if (!selectedPage) {
      return <div>Page not found</div>;
    }

    return <CarouselPages pages={[selectedPage]} />;
  } catch (error) {
    return <div>Error parsing data</div>;
  }
}

export default function RenderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RenderPageContent />
    </Suspense>
  );
}
