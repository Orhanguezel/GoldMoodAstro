// =============================================================
// FILE: backend/src/modules/commissionChange/controller.ts
// =============================================================
import type { FastifyReply, FastifyRequest } from 'fastify';
import { sendCommissionChangeNotices } from './service';

function parseBool(v: unknown, fallback: boolean): boolean {
  if (v === undefined || v === null) return fallback;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(s)) return false;
  return fallback;
}

function getCallerUserId(req: FastifyRequest): string | null {
  const u = (req as any).user as { sub?: string; id?: string } | undefined;
  return u?.id ?? u?.sub ?? null;
}

export async function sendCommissionNoticeAdminHandler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const q = (req.query || {}) as { dry_run?: unknown; force?: unknown };
  // default dry_run=true (guvenli)
  const dryRun = parseBool(q.dry_run, true);
  const force = parseBool(q.force, false);

  try {
    const result = await sendCommissionChangeNotices({
      dryRun,
      force,
      adminUserId: getCallerUserId(req),
      ip: req.ip ?? null,
    });
    return reply.send({ data: result });
  } catch (err) {
    req.log?.error?.({ err }, 'commission_notice_failed');
    const message = err instanceof Error ? err.message : 'commission_notice_failed';
    return reply.status(500).send({ error: { message } });
  }
}
