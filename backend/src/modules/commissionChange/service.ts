// =============================================================
// FILE: backend/src/modules/commissionChange/service.ts
// Komisyon orani degisikligi bildirim mailer servisi.
// site_settings.platform_commission_rate'den new/previous/effective_from
// okur; approval_status='approved' tum danismanlara mail gonderir.
// dry_run=true varsayilan; gercek gonderim icin dry_run=false.
// =============================================================

import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { consultants } from '@/modules/consultants/schema';
import { users } from '@goldmood/shared-backend/modules/auth/schema';
import { siteSettings } from '@goldmood/shared-backend/modules/siteSettings/schema';
import { sendTemplatedEmail } from '@goldmood/shared-backend/modules/emailTemplates/mailer';
import { repoPersistAuditEvent } from '@goldmood/shared-backend/modules/audit/repository';
import { getDefaultLocale } from '@goldmood/shared-backend/modules/_shared';

const COMMISSION_KEY = 'platform_commission_rate';
const TEMPLATE_KEY = 'commission_rate_change';
const DEFAULT_AGREEMENT_BASE = 'https://www.goldmoodastro.com';
const DEFAULT_SUPPORT_EMAIL = 'destek@goldmoodastro.com';
const SUPPORTED_LOCALES = new Set(['tr', 'en', 'de']);

export interface CommissionState {
  new_percent: number;
  previous_percent: number | null;
  effective_from: string | null;
  notice_days: number;
}

export interface CandidateRow {
  consultant_id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  already_sent_at: Date | null;
  locale: string;
}

export interface SendNoticeResult {
  dry_run: boolean;
  total_candidates: number;
  sent: number;
  skipped: number;
  errors: Array<{ consultant_id: string; user_id: string; email: string | null; error: string }>;
  commission: CommissionState;
  candidates_preview?: Array<{
    consultant_id: string;
    user_id: string;
    email: string | null;
    full_name: string | null;
    locale: string;
    already_sent_at: string | null;
  }>;
}

function parseCommissionValue(raw: unknown): CommissionState {
  const fallback: CommissionState = {
    new_percent: 30,
    previous_percent: 15,
    effective_from: null,
    notice_days: 30,
  };
  if (raw == null) return fallback;
  let obj: any = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      const candidate = Number(raw);
      if (Number.isFinite(candidate)) return { ...fallback, new_percent: candidate };
      return fallback;
    }
  }
  if (!obj || typeof obj !== 'object') return fallback;
  const newP = Number(obj.percent);
  const prevP = Number(obj.previous_percent);
  const effFrom =
    typeof obj.effective_from === 'string' && obj.effective_from.trim()
      ? String(obj.effective_from).trim()
      : null;
  const noticeRaw = Number(obj.minimum_notice_days ?? obj.notice_days);
  return {
    new_percent: Number.isFinite(newP) ? newP : fallback.new_percent,
    previous_percent: Number.isFinite(prevP) ? prevP : null,
    effective_from: effFrom,
    notice_days: Number.isFinite(noticeRaw) && noticeRaw > 0 ? noticeRaw : 30,
  };
}

export async function loadCommissionState(): Promise<CommissionState> {
  const [row] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(and(eq(siteSettings.key, COMMISSION_KEY), eq(siteSettings.locale, '*')))
    .limit(1);

  if (!row) {
    const [fallback] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, COMMISSION_KEY))
      .limit(1);
    return parseCommissionValue(fallback?.value);
  }
  return parseCommissionValue(row.value);
}

function normalizeLocale(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const v = input.trim().toLowerCase().slice(0, 2);
  return v && SUPPORTED_LOCALES.has(v) ? v : null;
}

export async function listCandidates(force: boolean): Promise<CandidateRow[]> {
  // Default locale from site settings (fallback 'tr')
  let defLocale = 'tr';
  try {
    defLocale = (await getDefaultLocale()) || 'tr';
  } catch {
    defLocale = 'tr';
  }

  const baseConds = [eq(consultants.approval_status, 'approved')];
  const whereExpr = force
    ? and(...baseConds)
    : and(...baseConds, isNull(consultants.commission_change_announcement_sent_at));

  const rows = await db
    .select({
      consultant_id: consultants.id,
      user_id: consultants.user_id,
      email: users.email,
      full_name: users.full_name,
      already_sent_at: consultants.commission_change_announcement_sent_at,
      is_active: users.is_active,
    })
    .from(consultants)
    .innerJoin(users, eq(users.id, consultants.user_id))
    .where(whereExpr);

  const candidates: CandidateRow[] = [];
  for (const r of rows) {
    if (!r.is_active) continue; // sadece aktif kullanicilar
    if (!r.email) continue; // mail adresi yoksa atla
    candidates.push({
      consultant_id: String(r.consultant_id),
      user_id: String(r.user_id),
      email: r.email ?? null,
      full_name: r.full_name ?? null,
      already_sent_at: r.already_sent_at ?? null,
      locale: normalizeLocale(defLocale) ?? 'tr',
    });
  }
  return candidates;
}

interface SendNoticeOptions {
  dryRun: boolean;
  force: boolean;
  adminUserId: string | null;
  ip?: string | null;
}

function agreementUrlForLocale(locale: string): string {
  return `${DEFAULT_AGREEMENT_BASE}/${locale}/legal/danisman-sozlesmesi`;
}

export async function sendCommissionChangeNotices(opts: SendNoticeOptions): Promise<SendNoticeResult> {
  const commission = await loadCommissionState();
  const candidates = await listCandidates(opts.force);

  const result: SendNoticeResult = {
    dry_run: opts.dryRun,
    total_candidates: candidates.length,
    sent: 0,
    skipped: 0,
    errors: [],
    commission,
  };

  if (opts.dryRun) {
    result.candidates_preview = candidates.slice(0, 50).map((c) => ({
      consultant_id: c.consultant_id,
      user_id: c.user_id,
      email: c.email,
      full_name: c.full_name,
      locale: c.locale,
      already_sent_at: c.already_sent_at ? c.already_sent_at.toISOString() : null,
    }));
    return result;
  }

  const oldPercent =
    commission.previous_percent != null ? commission.previous_percent : 15;
  const newPercent = commission.new_percent;
  const effectiveFrom = commission.effective_from ?? '2026-06-20';
  const noticeDays = commission.notice_days || 30;

  for (const c of candidates) {
    if (!c.email) {
      result.skipped += 1;
      continue;
    }
    const locale = c.locale || 'tr';
    const consultantName = (c.full_name && c.full_name.trim()) || 'Danisman';

    try {
      await sendTemplatedEmail({
        to: c.email,
        key: TEMPLATE_KEY,
        locale,
        params: {
          consultant_name: consultantName,
          old_percent: oldPercent,
          new_percent: newPercent,
          effective_from: effectiveFrom,
          notice_days: noticeDays,
          agreement_url: agreementUrlForLocale(locale),
          support_email: DEFAULT_SUPPORT_EMAIL,
        },
      });

      // Mark sent
      await db
        .update(consultants)
        .set({ commission_change_announcement_sent_at: new Date() })
        .where(eq(consultants.id, c.consultant_id));

      // Audit
      try {
        await repoPersistAuditEvent({
          ts: new Date().toISOString(),
          level: 'info',
          topic: 'commission_notice:sent',
          message: `commission notice sent to ${c.email}`,
          actor_user_id: opts.adminUserId,
          ip: opts.ip ?? null,
          entity: { type: 'consultant', id: c.consultant_id },
          meta: {
            subject_user_id: c.user_id,
            old: oldPercent,
            new: newPercent,
            effective_from: effectiveFrom,
            locale,
          },
        });
      } catch {
        // audit yazimi tek tek mail icin fatal degil
      }

      result.sent += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push({
        consultant_id: c.consultant_id,
        user_id: c.user_id,
        email: c.email,
        error: message,
      });
    }
  }

  return result;
}
