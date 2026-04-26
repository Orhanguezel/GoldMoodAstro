// =============================================================
// FILE: src/core/env.ts
// =============================================================
import 'dotenv/config';

const toInt = (v: string | undefined, d: number) => {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : d;
};
const toBool = (v: string | undefined, d = false) => {
  if (v == null) return d;
  const s = v.toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(s);
};
const toList = (v: string | undefined) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const CORS_LIST = toList(process.env.CORS_ORIGIN);
const CORS_ORIGIN = CORS_LIST.length ? CORS_LIST : [FRONTEND_URL];

// STORAGE_DRIVER normalleştirme (DB'deki storage_driver bunu override edebilir)
const RAW_STORAGE_DRIVER = (process.env.STORAGE_DRIVER || 'cloudinary').toLowerCase();
const STORAGE_DRIVER = (RAW_STORAGE_DRIVER === 'local' ? 'local' : 'cloudinary') as
  | 'local'
  | 'cloudinary';

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: toInt(process.env.PORT, 8083),
  APP_NAME: process.env.APP_NAME || 'Platform',

  // Storage driver (fallback). Asıl driver site_settings.storage_driver ile gelebilir.
  STORAGE_DRIVER,

  // Local storage (STORAGE_DRIVER=local iken aktif) - DB'den gelen değerler öncelikli
  LOCAL_STORAGE_ROOT: process.env.LOCAL_STORAGE_ROOT || '',
  LOCAL_STORAGE_BASE_URL: process.env.LOCAL_STORAGE_BASE_URL || '/uploads',

  // Örnek başka config (quiz)
  QUIZ: {
    DURATION_SECONDS: Number(process.env.QUIZ_DURATION_SECONDS ?? 60),
  },

  // Cloudinary ana alanlar (geriye dönük & fallback için, asıl değerler site_settings'ten gelebilir)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_UNSIGNED_PRESET: process.env.CLOUDINARY_UNSIGNED_PRESET || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET || '',
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || '',
  CLOUDINARY_BASE_PUBLIC: process.env.CLOUDINARY_BASE_PUBLIC || '',
  CLOUDINARY_UNSIGNED_UPLOAD_PRESET: process.env.CLOUDINARY_UNSIGNED_UPLOAD_PRESET || '',

  // Storage public URL fallback'leri (site_settings yoksa kullanılır)
  STORAGE_CDN_PUBLIC_BASE: process.env.STORAGE_CDN_PUBLIC_BASE || '',
  STORAGE_PUBLIC_API_BASE: process.env.STORAGE_PUBLIC_API_BASE || '',

  DB: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASSWORD || 'app',
    name: process.env.DB_NAME || 'app',
  },

  JWT_SECRET: process.env.JWT_SECRET || 'change-me',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'cookie-secret',

  CORS_ORIGIN,

  // Cloudinary detayları (bazı yerler nested kullanıyorsa) - yine fallback amaçlı
  CLOUDINARY: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'uploads',
    basePublic: process.env.CLOUDINARY_BASE_PUBLIC || '',
    publicStorageBase: process.env.PUBLIC_STORAGE_BASE || '',
  },

  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',
  },

  // Geriye dönük
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',

  LIVEKIT_URL: process.env.LIVEKIT_URL ?? '',
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY ?? '',
  LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET ?? '',

  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ?? '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ?? '',

  PUBLIC_URL: process.env.PUBLIC_URL || 'http://localhost:8094',
  FRONTEND_URL: FRONTEND_URL,

  PUBLIC_API_BASE: process.env.PUBLIC_API_BASE || '',
  CDN_PUBLIC_BASE: process.env.CDN_PUBLIC_BASE || '',

  // ✅ SMTP / Mail (sadece fallback; asıl değerler site_settings.smtp_* ile gelebilir)
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: toInt(process.env.SMTP_PORT, 465),
  SMTP_SECURE: toBool(process.env.SMTP_SECURE, false),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  MAIL_FROM: process.env.MAIL_FROM || '',

  AUDIT_RETENTION_DAYS: toInt(process.env.AUDIT_RETENTION_DAYS, 90),
  AUDIT_RETENTION_CLEANUP_MINUTES: toInt(process.env.AUDIT_RETENTION_CLEANUP_MINUTES, 360),
} as const;

export type AppEnv = typeof env;
