'use client';

import { useState } from 'react';

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

export default function Home() {
  const [pages, setPages] = useState<PageData[]>([
    {
      type: 'cover',
      title: 'آموزش برنامه‌نویسی',
      subtitle: 'یادگیری Python از صفر تا صد'
    },
    {
      type: 'content',
      paragraphs: [
        'لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است.',
        'چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است.'
      ]
    },
    {
      type: 'content',
      paragraphs: [
        'برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد.',
        'کتابهای زیادی در شصت و سه درصد گذشته، حال و آینده شناخت فراوان جامعه و متخصصان را می طلبد.'
      ]
    },
    {
      type: 'end',
      headline: 'همین الان استفاده بهینه از هوش مصنوعی را شروع کنید',
      highlight: 'هوش مصنوعی',
      buttonText: 'دموی رایگان',
      buttonUrl: 'https://n98n.ir'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const generateImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pages })
      });

      const data = await response.json();
      if (data.success) {
        setImages(data.images);
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Network error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-bg p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          🎨 Carousel Generator
        </h1>

        <div className="bg-primary-content rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Configure Pages</h2>

          {pages.map((page, index) => (
            <div
              key={index}
              className="mb-6 p-4 border border-primary-purple/30 rounded"
            >
              <h3 className="text-lg font-medium mb-2">
                Page {index + 1}: {page.type}
              </h3>

              {page.type === 'cover' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Title"
                    value={page.title || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, title: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Subtitle"
                    value={page.subtitle || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, subtitle: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                </div>
              )}

              {page.type === 'content' && (
                <div className="space-y-3">
                  {page.paragraphs?.map((paragraph, pIndex) => (
                    <textarea
                      key={pIndex}
                      value={paragraph}
                      onChange={(e) => {
                        const newPages = [...pages];
                        const newParagraphs = [...(page.paragraphs || [])];
                        newParagraphs[pIndex] = e.target.value;
                        newPages[index] = {
                          ...page,
                          paragraphs: newParagraphs
                        };
                        setPages(newPages);
                      }}
                      className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white h-20"
                      rows={2}
                    />
                  ))}
                </div>
              )}

              {page.type === 'end' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Headline"
                    value={page.headline || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, headline: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Text to highlight"
                    value={page.highlight || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, highlight: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Button Text"
                    value={page.buttonText || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, buttonText: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Button URL"
                    value={page.buttonUrl || ''}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[index] = { ...page, buttonUrl: e.target.value };
                      setPages(newPages);
                    }}
                    className="w-full p-2 rounded bg-primary-bg border border-primary-purple/50 text-white"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <button
            onClick={generateImages}
            disabled={loading}
            className="bg-gradient-button text-white px-8 py-3 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Images'}
          </button>
        </div>

        {images.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">
              Generated Images
            </h2>
            <div className="grid gap-6">
              {images.map((image, index) => (
                <div key={index} className="text-center">
                  <h3 className="text-lg mb-3">Image {index + 1}</h3>
                  <img
                    src={`data:image/png;base64,${image}`}
                    alt={`Generated image ${index + 1}`}
                    className="mx-auto rounded-lg shadow-lg max-w-md"
                  />
                  <a
                    href={`data:image/png;base64,${image}`}
                    download={`carousel-${index + 1}.png`}
                    className="inline-block mt-3 bg-primary-purple text-white px-4 py-2 rounded hover:opacity-90 transition-opacity"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
