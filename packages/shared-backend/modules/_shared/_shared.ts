// =============================================================
// FILE: src/modules/auth/_shared.ts
// FINAL — Shared helpers for auth module
// =============================================================

import type { users } from '@goldmood/shared-backend/modules/auth/schema';
import { z } from 'zod';
import { parseJsonArrayString } from '../_shared';

export type UserRow = typeof users.$inferSelect;


export type BoolLike = boolean | 0 | 1 | '0' | '1' | 'true' | 'false' | undefined;

export type Id36 = string;

export type Ymd = string; // YYYY-MM-DD
export type Hm = string; // HH:mm

export const safeTrim = (v: unknown) => (typeof v === 'string' ? v.trim() : String(v ?? '').trim());
export const uuid36Schema = z
  .string()
  .trim()
  .length(36, 'id must be 36 chars')
  .transform((v: string) => safeTrim(v));

export function toActive01(v: unknown): 0 | 1 | undefined {
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  if (v === false || v === 0 || v === '0' || v === 'false') return 0;
  return undefined;
}

export type safeText = (v: unknown) => string;

export const hmSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm')
  .transform((v) => safeTrim(v));

export const ymdSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
  .transform((v) => safeTrim(v));

export const dowSchema = z.coerce.number().int().min(1).max(7) as any;


export const toBool01 = (v: unknown): boolean => (typeof v === 'boolean' ? v : Number(v) === 1);

/** Admin/FE DTO tek yerde */
export function pickUserDto(u: UserRow, role: string) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name ?? null,
    phone: u.phone ?? null,
    email_verified: u.email_verified,
    is_active: u.is_active,
    created_at: u.created_at,
    last_login_at: u.last_sign_in_at,

    // ✅ profil resmi
    profile_image: (u as any).profile_image ?? null,
    profile_image_asset_id: (u as any).profile_image_asset_id ?? null,
    profile_image_alt: (u as any).profile_image_alt ?? null,

    role,
  };
}

export const UUID36 = z.string().length(36);
export const URL2000 = z.string().trim().max(2000).url('Geçersiz URL');

export const SLUG = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'invalid_slug')
  .trim();

export const UrlArrayLike = z
  .union([z.array(URL2000), z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (val == null) return null;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return parseJsonArrayString(val);
    return null;
  })
  .refine((v) => v === null || Array.isArray(v), 'images formatı geçersiz');

export const UuidArrayLike = z
  .union([z.array(UUID36), z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (val == null) return null;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return parseJsonArrayString(val);
    return null;
  })
  .refine((v) => v === null || Array.isArray(v), 'storage_image_ids formatı geçersiz');


  export const normalizeArrayPatch = (v: unknown): string[] | undefined => {
    // undefined => do not touch
    if (typeof v === 'undefined') return undefined;
    // null => clear
    if (v === null) return [];
    // array => keep
    if (Array.isArray(v)) return v.map((x) => String(x ?? '')).filter(Boolean);
    // otherwise ignore
    return undefined;
  };
  