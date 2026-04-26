// src/core/env.ts
import "dotenv/config";
import { parseEnvBool, parseEnvInt, parseEnvList } from '../modules/_shared';

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const CORS_LIST = parseEnvList(process.env.CORS_ORIGIN);
const CORS_ORIGIN = CORS_LIST.length ? CORS_LIST : [FRONTEND_URL];

const RAW_STORAGE_DRIVER = (process.env.STORAGE_DRIVER || 'cloudinary').toLowerCase();
const STORAGE_DRIVER = (RAW_STORAGE_DRIVER === 'local' ? 'local' : 'cloudinary') as
  | 'local'
  | 'cloudinary';

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseEnvInt(process.env.PORT, 8083),
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  SITE_NAME: process.env.SITE_NAME || 'Corporate Site',

  // Redis
  REDIS_URL: process.env.REDIS_URL || '',
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: parseEnvInt(process.env.REDIS_PORT, 6379),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

  // Storage
  STORAGE_DRIVER,
  LOCAL_STORAGE_ROOT: process.env.LOCAL_STORAGE_ROOT || '',
  LOCAL_STORAGE_BASE_URL: process.env.LOCAL_STORAGE_BASE_URL || '/uploads',
  STORAGE_CDN_PUBLIC_BASE: process.env.STORAGE_CDN_PUBLIC_BASE || '',
  STORAGE_PUBLIC_API_BASE: process.env.STORAGE_PUBLIC_API_BASE || '',
  CDN_PUBLIC_BASE: process.env.CDN_PUBLIC_BASE || "",
  PUBLIC_API_BASE: process.env.PUBLIC_API_BASE || "",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_UNSIGNED_PRESET: process.env.CLOUDINARY_UNSIGNED_PRESET || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET || '',
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || '',
  CLOUDINARY_BASE_PUBLIC: process.env.CLOUDINARY_BASE_PUBLIC || '',
  CLOUDINARY: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'uploads',
    basePublic: process.env.CLOUDINARY_BASE_PUBLIC || '',
    publicStorageBase: process.env.PUBLIC_STORAGE_BASE || '',
  },

  // DB
  DB: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseEnvInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || "app",
    password: process.env.DB_PASSWORD || "app",
    name: process.env.DB_NAME || "mydb",
  },

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || "change-me",
  COOKIE_SECRET: process.env.COOKIE_SECRET || "cookie-secret",
  ALLOW_TEMP_LOGIN: process.env.ALLOW_TEMP_LOGIN || '',
  TEMP_PASSWORD: process.env.TEMP_PASSWORD || '',
  AUTH_ADMIN_EMAILS: process.env.AUTH_ADMIN_EMAILS || '',

  // CORS
  CORS_ORIGIN,

  // Google OAuth
  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  },
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  FACEBOOK: {
    APP_ID: process.env.FACEBOOK_APP_ID ?? "",
    APP_SECRET: process.env.FACEBOOK_APP_SECRET ?? "",
  },
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID ?? "",
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ?? "",

  // URLs
  PUBLIC_URL: process.env.PUBLIC_URL || "http://localhost:8083",
  FRONTEND_URL,

  // AI (Groq)
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
  GROQ_API_BASE: process.env.GROQ_API_BASE || 'https://api.groq.com/openai/v1',

  // PayPal
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || '',
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || '',
  PAYPAL_BASE_URL: process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com',
  PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID || '',

  // SMTP
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseEnvInt(process.env.SMTP_PORT, 465),
  SMTP_SECURE: parseEnvBool(process.env.SMTP_SECURE, false),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  MAIL_FROM: process.env.MAIL_FROM || "",
} as const;

export type AppEnv = typeof env;
