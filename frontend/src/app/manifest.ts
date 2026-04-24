import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Konigsmassage',
    short_name: 'Konig',
    description: 'Energetische Entspannungsmassage ve randevu deneyimi.',
    start_url: '/de',
    display: 'standalone',
    background_color: '#f6f1e8',
    theme_color: '#8b6b3f',
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
