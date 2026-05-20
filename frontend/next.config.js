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
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/+$/, '');
    const backendUrl = apiBase.replace(/\/api(\/v\d+)?\/?$/, '');
    const rewrites = [
      // /about artık gerçek route'a sahip (app/[locale]/about) — rewrite KALDIRILDI.
      // /hakkimizda → kanonik /about'a yönlendir (eski alias).
      { source: '/:locale/hakkimizda', destination: '/:locale/about' },
      { source: '/:locale/how-it-works', destination: '/:locale?section=hybrid_model' },
      { source: '/:locale/nasil-calisir', destination: '/:locale?section=hybrid_model' },
      { source: '/:locale/referanslar', destination: '/:locale?section=testimonials' },
      { source: '/:locale/testimonials', destination: '/:locale?section=testimonials' },
      { source: '/:locale/yorumlar', destination: '/:locale?section=testimonials' },
      { source: '/:locale/featured', destination: '/:locale?section=consultants_featured' },
      { source: '/:locale/popular', destination: '/:locale?section=consultants_popular' },
      { source: '/:locale/trust', destination: '/:locale?section=trust' },
      { source: '/:locale/privacy', destination: '/:locale?section=trust' },
      { source: '/uploads/:path*', destination: `${backendUrl}/uploads/:path*` },
    ];

    // Local dev can point server-side reads at the live API, but browser-side
    // requests must stay same-origin to avoid live CORS blocking localhost.
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\//i.test(apiBase)) {
      rewrites.unshift({ source: '/api/:path*', destination: `${apiBase}/:path*` });
    }

    return rewrites;
  },

  async headers() {
    // Tema/içerik DB'den geliyor (design_tokens, ui_*, brand.*) → agresif cache
    // değişiklikleri saatlerce gizliyordu. max-age=0: tarayıcı her zaman
    // revalidate eder (hard-refresh gerekmez). s-maxage=60: kısa CDN/proxy
    // cache (perf korunur, değişiklik ~1dk içinde yansır).
    const staticContentCache = [
      {
        key: 'Cache-Control',
        value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=120',
      },
    ];

    return [
      {
        source: '/:locale(tr|en|de)',
        headers: staticContentCache,
      },
      {
        source: '/:locale(tr|en|de)/:page(about|blog|burclar|sinastri|tarot|numeroloji|yildizname|birth-chart|buyuk-uclu|big-three|burcunu-ogren|yukselen-burc-hesaplayici|unluler-ve-burclari|faqs|editorial-policy|contact|pricing|gizlilik|kvkk|kullanim-sartlari|cerez-politikasi|privacy-policy|privacy-notice|terms|cookie-policy|legal-notice)',
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
      { source: '/:locale/big-three', destination: '/:locale/buyuk-uclu', permanent: true },
      { source: '/:locale/dogum-haritasi', destination: '/:locale/birth-chart', permanent: true },
      // /:locale/consultant → /:locale/me/consultant (danışman paneli) proxy.ts'de
      // yapılır. Eski konigsmassage kuralı yanlışlıkla public /consultants listesine
      // yönlendirip paneli "kaçırıyordu" — kaldırıldı.
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
