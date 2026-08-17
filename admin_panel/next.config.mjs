/** @type {import('next').NextConfig} */
const nextConfig = {
  // Deploy geçici bir dizine build edip sonra .next ile takas eder. Doğrudan
  // .next'e build etmek, çalışan uygulamanın altından dosyaları çekiyordu:
  // `rm -rf .next` sonrası app ayakta kalıyor ama route manifest'leri yok
  // ("client reference manifest ... does not exist") → deploy boyunca 500.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactCompiler: true,
  compiler: { removeConsole: process.env.NODE_ENV === 'production' },

  // ✅ Image optimization config
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8094',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ✅ kaldırıyoruz: /admin/dashboard -> /admin/dashboard/default
  async redirects() {
    return [
      // İstersen eski linkleri yakalamak için tersine redirect bırakabilirsin:
      // { source: '/admin/dashboard/default', destination: '/admin/dashboard', permanent: false },
    ];
  },

  async rewrites() {
    const origin =
      process.env.PANEL_API_URL || process.env.NEXT_PUBLIC_PANEL_API_URL || 'http://localhost:8094';

    const base = String(origin).replace(/\/+$/, '').replace(/\/api$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${base}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${base}/uploads/:path*`,
      },
      {
        source: '/storage/local/uploads/:path*',
        destination: `${base}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
