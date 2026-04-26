import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GoldMoodAstro',
    short_name: 'GoldMood',
    description: 'Astroloji, tarot ve yaşam koçluğu için uzman danışmanlarla bağlantı platformu.',
    start_url: '/tr',
    display: 'standalone',
    background_color: '#0D0B1E',
    theme_color: '#7B5EA7',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/favicon/apple-touch-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
      },
    ],
  };
}
