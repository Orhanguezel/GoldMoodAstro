import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

type BoostPackage = { id: string; days: number; price: number; currency?: string };

const checkoutSchema = z.object({
  package_id: z.string().trim().min(1).max(32),
});

function rowsFromExecute<T = any>(result: unknown): T[] {
  return (Array.isArray((result as any)?.[0]) ? (result as any)[0] : (result as any)) as T[];
}

function userIdFromRequest(req: Parameters<RouteHandler>[0]) {
  const user = req.user as { sub?: string; id?: string } | undefined;
  return user?.sub ?? user?.id ?? null;
}

async function getCallerConsultant(req: Parameters<RouteHandler>[0]) {
  const userId = userIdFromRequest(req);
  if (!userId) return null;
  const result = await db.execute(sql`SELECT id, user_id FROM consultants WHERE user_id = ${userId} LIMIT 1`);
  return rowsFromExecute<{ id: string; user_id: string }>(result)[0] ?? null;
}

async function readPackages(): Promise<BoostPackage[]> {
  const result = await db.execute(sql`
    SELECT value FROM site_settings
    WHERE \`key\` = 'service_boost_packages' AND locale IN ('*', 'tr')
    ORDER BY CASE WHEN locale='*' THEN 0 ELSE 1 END
    LIMIT 1
  `);
  const raw = rowsFromExecute<{ value: string }>(result)[0]?.value;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through to defaults
    }
  }
  return [
    { id: 'wk1', days: 7, price: 599, currency: 'TRY' },
    { id: 'wk2', days: 14, price: 1099, currency: 'TRY' },
    { id: 'wk4', days: 28, price: 1899, currency: 'TRY' },
  ];
}

export const createCheckout: RouteHandler = async (req, reply) => {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const serviceId = String((req.params as { id?: string })?.id ?? '').trim();
  const parsed = checkoutSchema.safeParse(req.body ?? {});
  if (!serviceId) return reply.code(400).send({ error: { message: 'service_id_required' } });
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });

  const serviceResult = await db.execute(sql`
    SELECT id, consultant_id, name FROM consultant_services
    WHERE id = ${serviceId} AND consultant_id = ${c.id}
    LIMIT 1
  `);
  const service = rowsFromExecute<{ id: string; consultant_id: string; name: string }>(serviceResult)[0];
  if (!service) return reply.code(404).send({ error: { message: 'service_not_found' } });

  const packages = await readPackages();
  const selected = packages.find((pkg) => pkg.id === parsed.data.package_id);
  if (!selected) return reply.code(400).send({ error: { message: 'boost_package_not_found' } });

  const boostId = randomUUID();
  await db.execute(sql`
    INSERT INTO service_boosts (
      id, consultant_service_id, consultant_id, duration_days, price, currency,
      starts_at, ends_at, status, created_at, updated_at
    ) VALUES (
      ${boostId}, ${service.id}, ${c.id}, ${selected.days}, ${String(selected.price)},
      ${selected.currency ?? 'TRY'}, NOW(3), DATE_ADD(NOW(3), INTERVAL ${selected.days} DAY),
      'pending_payment', NOW(3), NOW(3)
    )
  `);

  return reply.code(201).send({
    data: {
      id: boostId,
      status: 'pending_payment',
      package: selected,
      // Iyzipay bağlandığında bu alan gerçek paymentPageUrl ile değiştirilecek.
      checkout_url: `/tr/me/consultant?boost_id=${encodeURIComponent(boostId)}&checkout=pending`,
      checkout_html: null,
    },
  });
};

export const getStatus: RouteHandler = async (req, reply) => {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const serviceId = String((req.params as { id?: string })?.id ?? '').trim();
  const result = await db.execute(sql`
    SELECT id, consultant_service_id, consultant_id, duration_days, price, currency,
           starts_at, ends_at, status, iyzipay_payment_id, created_at, updated_at
    FROM service_boosts
    WHERE consultant_service_id = ${serviceId} AND consultant_id = ${c.id}
    ORDER BY created_at DESC
    LIMIT 20
  `);
  return reply.send({ data: rowsFromExecute(result) });
};

export const listAdmin: RouteHandler = async (req) => {
  const status = String((req.query as { status?: string } | undefined)?.status ?? '').trim();
  const result = await db.execute(
    status
      ? sql`
          SELECT sb.*, cs.name AS service_name, u.full_name AS consultant_name
          FROM service_boosts sb
          INNER JOIN consultant_services cs ON cs.id = sb.consultant_service_id
          INNER JOIN consultants c ON c.id = sb.consultant_id
          INNER JOIN users u ON u.id = c.user_id
          WHERE sb.status = ${status}
          ORDER BY sb.created_at DESC
          LIMIT 200
        `
      : sql`
          SELECT sb.*, cs.name AS service_name, u.full_name AS consultant_name
          FROM service_boosts sb
          INNER JOIN consultant_services cs ON cs.id = sb.consultant_service_id
          INNER JOIN consultants c ON c.id = sb.consultant_id
          INNER JOIN users u ON u.id = c.user_id
          ORDER BY sb.created_at DESC
          LIMIT 200
        `,
  );
  return { data: rowsFromExecute(result) };
};

export const cancelAdmin: RouteHandler = async (req, reply) => {
  const id = String((req.params as { id?: string })?.id ?? '').trim();
  if (!id) return reply.code(400).send({ error: { message: 'boost_id_required' } });
  await db.execute(sql`UPDATE service_boosts SET status = 'cancelled', updated_at = NOW(3) WHERE id = ${id}`);
  return { data: { id, status: 'cancelled' } };
};

export const iyzicoCallback: RouteHandler = async (req, reply) => {
  const body = (req.body ?? {}) as { boost_id?: string; status?: string; paymentId?: string; payment_id?: string };
  const query = (req.query ?? {}) as { boost_id?: string; status?: string; paymentId?: string; payment_id?: string };
  const boostId = String(body.boost_id ?? query.boost_id ?? '').trim();
  const status = String(body.status ?? query.status ?? '').trim().toLowerCase();
  const paymentId = String(body.paymentId ?? body.payment_id ?? query.paymentId ?? query.payment_id ?? '').trim() || null;
  if (!boostId) return reply.code(400).send({ error: { message: 'boost_id_required' } });

  if (status && status !== 'success') {
    await db.execute(sql`
      UPDATE service_boosts
      SET status = 'cancelled', iyzipay_payment_id = ${paymentId}, updated_at = NOW(3)
      WHERE id = ${boostId} AND status = 'pending_payment'
    `);
    return { data: { id: boostId, status: 'cancelled' } };
  }

  await db.execute(sql`
    UPDATE service_boosts
    SET status = 'active',
        starts_at = NOW(3),
        ends_at = DATE_ADD(NOW(3), INTERVAL duration_days DAY),
        iyzipay_payment_id = ${paymentId},
        updated_at = NOW(3)
    WHERE id = ${boostId} AND status = 'pending_payment'
  `);
  return { data: { id: boostId, status: 'active' } };
};
