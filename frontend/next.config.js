/** @type {import('next').NextConfig} */

// ✅ Bundle Analyzer (ANALYZE=true için)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});


const nextConfig = {
  turbopack: {},
  reactStrictMode: true,
  trailingSlash: false,
  compress: true,

  // ✅ Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // ✅ Experimental optimizations
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      'lucide-react',
      'date-fns',
    ],
  },

  // ✅ Webpack config
  webpack: (config, { isServer }) => {
    return config;
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },

      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/**' },

      { protocol: 'https', hostname: 'goldmoodastro.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.goldmoodastro.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.goldmoodastro.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },

  // Backend uploads klasörünü frontend domain'i üzerinden serve et.
  // Dev: localhost:3000/uploads/x.png → localhost:8094/uploads/x.png
  // Prod'da Nginx aynı yönlendirmeyi /uploads location bloğuyla yapar.
  async rewrites() {
    // Strip trailing /api/v1 or /api so we hit backend's static /uploads handler directly.
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/api(\/v\d+)?\/?$/, '');
    return [
      { source: '/uploads/:path*', destination: `${backendUrl}/uploads/:path*` },
    ];
  },

  async headers() {
    const staticContentCache = [
      {
        key: 'Cache-Control',
        value: 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    ];

    return [
      {
        source: '/:locale(tr|en|de)',
        headers: staticContentCache,
      },
      {
        source: '/:locale(tr|en|de)/:page(about|blog|burclar|sinastri|tarot|numeroloji|yildizname|birth-chart|big-three|burcunu-ogren|yukselen-burc-hesaplayici|unluler-ve-burclari|faqs|editorial-policy|contact|pricing)',
        headers: staticContentCache,
      },
      {
        source: '/:locale(tr|en|de)/blog/:path*',
        headers: staticContentCache,
      },
      {
        source: '/:locale(tr|en|de)/burclar/:path*',
        headers: staticContentCache,
      },
    ];
  },

  async redirects() {
    return [
      // www → non-www
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.goldmoodastro.com' }],
        destination: 'https://goldmoodastro.com/:path*',
        permanent: true,
      },
      // Silinen konigsmassage sayfaları → goldmoodastro karşılıkları
      { source: '/:locale/gutschein', destination: '/:locale', permanent: true },
      { source: '/:locale/services', destination: '/:locale/consultants', permanent: true },
      { source: '/:locale/appointment', destination: '/:locale/consultants', permanent: true },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
