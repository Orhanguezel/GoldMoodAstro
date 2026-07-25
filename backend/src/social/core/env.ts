// override: true → .env her zaman shell/pm2-cache'lenmis env'i ezer.
// (pm2 dump'taki bayat degerler deploy sonrasi yanlis kimlik kullandiriyordu.)
import { config as loadDotenv } from 'dotenv';
loadDotenv({ override: true });

const toInt = (v: string | undefined, d: number) => {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : d;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: toInt(process.env.PORT, 8089),

  DB: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASSWORD || 'app',
    name: process.env.DB_NAME || 'ekosistem_sosyal',
  },

  JWT_SECRET: process.env.JWT_SECRET || (() => { throw new Error("Missing required env: JWT_SECRET"); })(),
  COOKIE_SECRET: process.env.COOKIE_SECRET || (() => { throw new Error("Missing required env: COOKIE_SECRET"); })(),

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3035',

  // Ekosistem API kaynakları (Artık social_projects tablosundan dinamik olarak yönetiliyor)

  // Facebook
  FB_APP_ID: process.env.FB_APP_ID || '',
  FB_APP_SECRET: process.env.FB_APP_SECRET || '',
  FB_PAGE_ID: process.env.FB_PAGE_ID || '',
  FB_PAGE_ACCESS_TOKEN: process.env.FB_PAGE_ACCESS_TOKEN || '',

  // Instagram
  IG_ACCOUNT_ID: process.env.IG_ACCOUNT_ID || '',
  IG_ACCESS_TOKEN: process.env.IG_ACCESS_TOKEN || '',

  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '7044964180',

  // LinkedIn OAuth
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID || '',
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET || '',
  LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI || '',
  LINKEDIN_API_VERSION: process.env.LINKEDIN_API_VERSION || '202606',

  // X OAuth
  X_CLIENT_ID: process.env.X_CLIENT_ID || '',
  X_CLIENT_SECRET: process.env.X_CLIENT_SECRET || '',
  X_REDIRECT_URI: process.env.X_REDIRECT_URI || '',
  X_API_KEY: process.env.X_API_KEY || '',
  X_API_SECRET: process.env.X_API_SECRET || '',
  X_ACCESS_TOKEN: process.env.X_ACCESS_TOKEN || '',
  X_ACCESS_TOKEN_SECRET: process.env.X_ACCESS_TOKEN_SECRET || '',
  X_API_MONTHLY_WRITE_LIMIT: toInt(process.env.X_API_MONTHLY_WRITE_LIMIT, 0),
  X_API_MONTHLY_READ_LIMIT: toInt(process.env.X_API_MONTHLY_READ_LIMIT, 0),
  X_MENTION_TENANTS: process.env.X_MENTION_TENANTS || 'haldefiyat',
  X_RESEARCH_TENANTS: process.env.X_RESEARCH_TENANTS || 'haldefiyat',
  X_OWNTWEET_TENANTS: process.env.X_OWNTWEET_TENANTS || '',

  // AI
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',

  // Postproxy (unified social publishing — migrasyon)
  POSTPROXY_API_KEY: process.env.POSTPROXY_API_KEY || '',
  POSTPROXY_BASE_URL: process.env.POSTPROXY_BASE_URL || 'https://api.postproxy.dev',
  POSTPROXY_WEBHOOK_SECRET: process.env.POSTPROXY_WEBHOOK_SECRET || '',

  // Video Auto-Edit (Faz 2.5)
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  // Auto-edit (BullMQ + Redis) worker'i yalnizca acikca etkinlestirilince baslat.
  // Redis yoksa worker surekli baglanti hatasi loglar — default kapali.
  VIDEO_EDIT_ENABLED: (process.env.VIDEO_EDIT_ENABLED || 'false').toLowerCase() === 'true',
  VIDEO_EDIT_MAX_CONCURRENT_PER_TENANT: toInt(process.env.VIDEO_EDIT_MAX_CONCURRENT_PER_TENANT, 2),
  VIDEO_EDIT_MAX_VIDEO_DURATION_SEC: toInt(process.env.VIDEO_EDIT_MAX_VIDEO_DURATION_SEC, 900),
  VIDEO_EDIT_TARGET_DURATION_SEC: toInt(process.env.VIDEO_EDIT_TARGET_DURATION_SEC, 60),

  TIMEZONE: process.env.TIMEZONE || 'Europe/Istanbul',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  // Storage
  STORAGE_DRIVER: (process.env.STORAGE_DRIVER || 'cloudinary').toLowerCase() as 'local' | 'cloudinary',
  LOCAL_STORAGE_ROOT: process.env.LOCAL_STORAGE_ROOT || '',
  LOCAL_STORAGE_BASE_URL: process.env.LOCAL_STORAGE_BASE_URL || '/uploads',

  PUBLIC_URL: process.env.PUBLIC_URL || 'http://localhost:8089',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3035',

  /** Google Cloud service account JSON (Search Console / Ads okuma — tek satir veya dosya yolu) */
  GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',

  GOOGLE_ADS_DEVELOPER_TOKEN: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
  GOOGLE_ADS_CLIENT_ID: process.env.GOOGLE_ADS_CLIENT_ID || '',
  GOOGLE_ADS_CLIENT_SECRET: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
  GOOGLE_ADS_REFRESH_TOKEN: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
  GOOGLE_ADS_API_VERSION: process.env.GOOGLE_ADS_API_VERSION || 'v22',

  /** YouTube OAuth dev fallback. Production tenant client'lari Faz 1'de DB'den okunacak. */
  YOUTUBE_OAUTH_CLIENT_ID_DEV: process.env.YOUTUBE_OAUTH_CLIENT_ID_DEV || '',
  YOUTUBE_OAUTH_CLIENT_SECRET_DEV: process.env.YOUTUBE_OAUTH_CLIENT_SECRET_DEV || '',
  YOUTUBE_OAUTH_REDIRECT_URI:
    process.env.YOUTUBE_OAUTH_REDIRECT_URI || 'http://localhost:8089/api/platforms/youtube/oauth/callback',

  /** Faz 1'de tenant_oauth_clients secret encryption icin zorunlu olacak. */
  TENANT_SECRETS_MASTER_KEY: process.env.TENANT_SECRETS_MASTER_KEY || '',

  DATAFORSEO_LOGIN: process.env.DATAFORSEO_LOGIN || '',
  DATAFORSEO_PASSWORD: process.env.DATAFORSEO_PASSWORD || '',

  META_GRAPH_API_VERSION: process.env.META_GRAPH_API_VERSION || 'v25.0',

  /** Instagram test postu icin varsayilan gorsel URL (tenant ayarlaninca kullanilir) */
  IG_TEST_IMAGE_URL: process.env.IG_TEST_IMAGE_URL || '',
} as const;

export type AppEnv = typeof env;
