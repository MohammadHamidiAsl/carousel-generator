/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        vazir: ['Vazirmatn', 'Tahoma', 'Arial Unicode MS', 'sans-serif']
      },
      colors: {
        primary: {
          bg: '#0b0d1a',
          purple: '#574cff',
          accent: '#ff4433',
          content: '#1a1d29',
          card: '#0f1019'
        }
      },
      backgroundImage: {
        'gradient-radial':
          'radial-gradient(ellipse at center, #1a1d29 0%, #0b0d1a 70%)',
        'gradient-purple':
          'linear-gradient(135deg, #574cff 0%, #8b5cf6 50%, #a855f7 100%)',
        'gradient-button':
          'linear-gradient(135deg, #574cff 0%, #7c3aed 50%, #8b5cf6 100%)',
        'pattern-waves': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cpath d='M0,200 Q100,150 200,200 T400,200 M0,250 Q100,200 200,250 T400,250 M0,150 Q100,100 200,150 T400,150 M0,300 Q100,250 200,300 T400,300 M0,100 Q100,50 200,100 T400,100' stroke='%23ffffff' stroke-opacity='0.03' stroke-width='1' fill='none'/%3E%3C/svg%3E")`
      }
    }
  },
  plugins: []
};
