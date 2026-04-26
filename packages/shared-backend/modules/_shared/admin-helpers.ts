// src/modules/_shared/admin-helpers.ts
// Admin panel DTO helpers

import { toBool } from './common';

/** Admin panel user DTO formatter */
export function formatAdminUserRow(user: Record<string, any>, role?: string | null) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name ?? null,
    phone: user.phone ?? null,
    email_verified: user.email_verified ?? false,
    is_active: toBool(user.is_active),
    created_at: user.created_at,
    updated_at: user.updated_at ?? null,
    last_sign_in_at: user.last_sign_in_at ?? null,
    profile_image: user.profile_image ?? null,
    profile_image_asset_id: user.profile_image_asset_id ?? null,
    profile_image_alt: user.profile_image_alt ?? null,
    role: role ?? user.role ?? null,
  };
}
