// =============================================================
// FILE: src/integrations/hooks.ts
// Barrel exports for RTK Query hooks (Xilan)
// =============================================================

// =========================
// Public / Shared endpoints
// =========================

// Auth (Public)
export * from '@/integrations/endpoints/users/auth_public.endpoints';
export * from '@/integrations/endpoints/users/profiles.endpoints';
export * from '@/integrations/endpoints/users/user_roles.endpoints';

// Public Endpoints
export * from '@/integrations/endpoints/public/site_settings_public.endpoints';

// =========================
// Admin endpoints
// =========================

// Core / Auth / Dashboard / DB
export * from '@/integrations/endpoints/admin/users/auth_admin.endpoints';
export * from '@/integrations/endpoints/admin/users/roles_admin.endpoints';

export * from '@/integrations/endpoints/admin/dashboard_admin.endpoints';
export * from '@/integrations/endpoints/admin/db_admin.endpoints';

// Content / CMS
export * from '@/integrations/endpoints/admin/custom_pages_admin.endpoints';
export * from '@/integrations/endpoints/admin/contacts_admin.endpoints';
export * from '@/integrations/endpoints/admin/reviews_admin.endpoints';
export * from '@/integrations/endpoints/admin/faqs_admin.endpoints';
export * from '@/integrations/endpoints/admin/sliders_admin.endpoints';
export * from '@/integrations/endpoints/admin/services_admin.endpoints';

// System / Infra / RBAC
export * from '@/integrations/endpoints/admin/audit_admin.endpoints';
export * from '@/integrations/endpoints/admin/site_settings_admin.endpoints';
export * from '@/integrations/endpoints/admin/storage_admin.endpoints';
export * from '@/integrations/endpoints/admin/users/roles_admin.endpoints';
export * from '@/integrations/endpoints/admin/email_templates_admin.endpoints';
export * from '@/integrations/endpoints/admin/mail_admin.endpoints';
export * from '@/integrations/endpoints/admin/newsletter_admin.endpoints';
export * from '@/integrations/endpoints/admin/notifications_admin.endpoints';
export * from '@/integrations/endpoints/admin/offers_admin.endpoints';
export * from '@/integrations/endpoints/admin/reports_admin.endpoints';
export * from '@/integrations/endpoints/admin/bookings_admin.endpoints';
export * from '@/integrations/endpoints/admin/consultants_admin.endpoints';
export * from '@/integrations/endpoints/admin/popups_admin.endpoints';
export * from '@/integrations/endpoints/admin/menu_items_admin.endpoints';
export * from '@/integrations/endpoints/admin/projects_admin.endpoints';
export * from '@/integrations/endpoints/admin/pricing_admin.endpoints';
export * from '@/integrations/endpoints/admin/resume.admin.endpoints';
export * from '@/integrations/endpoints/admin/skill.admin.endpoints';
export * from '@/integrations/endpoints/admin/brands.admin.endpoints';
export * from '@/integrations/endpoints/admin/footer_sections_admin.endpoints';
export * from '@/integrations/endpoints/admin/resources_admin.endpoints';
export * from '@/integrations/endpoints/admin/availability_admin.endpoints';
export * from '@/integrations/endpoints/admin/telegram_inbound.endpoints';
export * from '@/integrations/endpoints/admin/telegram_webhook.endpoints';
export * from '@/integrations/endpoints/admin/telegram_admin.endpoints';
export * from '@/integrations/endpoints/admin/wallet_admin.endpoints';
export * from '@/integrations/endpoints/admin/livekit_admin.endpoints';

// Chat / AI Support
export * from '@/integrations/endpoints/admin/chat_admin.endpoints';
export * from '@/integrations/endpoints/admin/llm_prompts_admin.endpoints';
export * from '@/integrations/endpoints/admin/astrology_kb_admin.endpoints';


// Orders / Payments
export * from '@/integrations/endpoints/admin/orders_admin.endpoints';
export * from '@/integrations/endpoints/admin/subscriptions_admin.endpoints';

// Support
export * from '@/integrations/endpoints/admin/support_admin.endpoints';

// Announcements
export * from '@/integrations/endpoints/admin/announcements_admin.endpoints';

// Banners
export * from '@/integrations/endpoints/admin/banners_admin.endpoints';

// Campaigns
export * from '@/integrations/endpoints/admin/campaigns_admin.endpoints';
