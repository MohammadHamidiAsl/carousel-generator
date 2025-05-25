import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carousel Generator',
  description: 'Beautiful Persian carousel image generator'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
