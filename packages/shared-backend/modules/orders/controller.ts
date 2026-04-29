// src/modules/orders/controller.ts
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from '../../db/client';
import { orders, userAddresses, paymentGateways, payments } from "./schema";
import { bookings } from "../bookings/schema";
import { and, eq, desc, like, or, sql, type SQL } from "drizzle-orm";
import { IyzicoService, resolveIyzicoLocale } from "./iyzico.service";
import { addressCreateSchema, orderCreateSchema } from "./validation";
import { DEFAULT_LOCALE } from '../../core/i18n';
import { users } from "../auth/schema";

/** JWT payload'dan user bilgilerini normalize et.
 * Fastify-jwt sub → userId olarak map eder; id alanı payload'da olmayabilir.
 */
function getUser(req: { user?: unknown }) {
  const u = req.user as Record<string, unknown> | undefined;
  const id = (u?.id ?? u?.sub ?? "") as string;
  const email = (u?.email ?? "") as string;
  const full_name = (u?.full_name ?? u?.name ?? null) as string | null;
  const phone = (u?.phone ?? null) as string | null;
  return { id, email, full_name, phone };
}

/** Yardımcı: istekten locale çıkar (query > req.locale > DEFAULT_LOCALE) */
function resolveLocale(req: { query?: unknown; locale?: string }): string {
  const fromQuery = ((req.query as Record<string, string> | undefined)?.locale ?? "").trim().toLowerCase();
  if (fromQuery) return fromQuery;
  const fromReq = (req.locale ?? "").trim().toLowerCase();
  if (fromReq) return fromReq;
  return (DEFAULT_LOCALE || "tr").toLowerCase();
}

function resolveApiBase() {
  return (
    process.env.BACKEND_URL ||
    process.env.PUBLIC_URL ||
    (process.env.PUBLIC_HOST ? `https://${process.env.PUBLIC_HOST}` : "http://localhost:8094")
  ).replace(/\/$/, "");
}

function resolveIyzicoConfig(gateway?: { config: string | null }) {
  const fromDb = JSON.parse(gateway?.config || "{}") as Partial<{ apiKey: string; secretKey: string; baseUrl: string }>;
  const testMode = process.env.IYZICO_TEST_MODE;
  return {
    apiKey:
      fromDb.apiKey ??
      process.env.IYZIPAY_API_KEY ??
      process.env.IYZICO_API_KEY ??
      "",
    secretKey:
      fromDb.secretKey ??
      process.env.IYZIPAY_SECRET_KEY ??
      process.env.IYZICO_SECRET_KEY ??
      "",
    baseUrl:
      fromDb.baseUrl ??
      (testMode === "false" ? "https://api.iyzipay.com" : "https://sandbox-api.iyzipay.com"),
  };
}

/** List Payment Gateways */
export const listGateways: RouteHandler = async (req, reply) => {
  const rows = await db.select().from(paymentGateways).where(eq(paymentGateways.is_active, 1));
  return reply.send(rows.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    is_test_mode: !!r.is_test_mode,
  })));
};

/** Create Address */
export const createAddress: RouteHandler = async (req, reply) => {
  const user = getUser(req);

  const parsed = addressCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });
  }
  const body = parsed.data;
  const id = randomUUID();

  // If set to default, unset others
  if (body.is_default) {
    await db.update(userAddresses).set({ is_default: 0 }).where(eq(userAddresses.user_id, user.id));
  }

  await db.insert(userAddresses).values({
    id,
    user_id: user.id,
    title: body.title,
    full_name: body.full_name,
    phone: body.phone,
    email: body.email ?? null,
    address_line: body.address_line,
    city: body.city,
    district: body.district,
    postal_code: body.postal_code ?? null,
    is_default: body.is_default ? 1 : 0,
  });

  return reply.send({ success: true, id });
};

/** List Addresses */
export const listAddresses: RouteHandler = async (req, reply) => {
  const user = getUser(req);
  const rows = await db.select().from(userAddresses).where(eq(userAddresses.user_id, user.id)).orderBy(desc(userAddresses.is_default));
  return reply.send(rows);
};

/** Create Order */
export const createOrder: RouteHandler = async (req, reply) => {
  const user = getUser(req);

  const parsed = orderCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });
  }
  const body = parsed.data;

  // 1. Resolve Gateway
  const [gateway] = await db.select().from(paymentGateways)
    .where(and(eq(paymentGateways.slug, body.payment_gateway_slug), eq(paymentGateways.is_active, 1)))
    .limit(1);

  if (!gateway) return reply.code(400).send({ error: "Invalid payment gateway" });

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, body.booking_id)).limit(1);
  if (!booking || booking.user_id !== user.id) {
    return reply.code(404).send({ error: "Booking not found" });
  }

  const orderId = randomUUID();
  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const totalAmount = Number(booking.session_price || "0");

  await db.insert(orders).values({
    id: orderId,
    user_id: user.id,
    booking_id: booking.id,
    order_number: orderNumber,
    status: "pending",
    total_amount: totalAmount.toFixed(2),
    currency: "TRY",
    billing_address_id: body.billing_address_id ?? null,
    payment_gateway_id: gateway.id,
    payment_status: "unpaid",
    notes: body.notes ?? null,
  });

  return reply.send({ success: true, order_id: orderId, order_number: orderNumber });
};

/** Initialize Iyzico Session */
export const initIyzico: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const user = getUser(req);
  const orderId = req.params.id;

  // Locale: istek dilinden çözümle
  const requestLocale = resolveLocale(req);
  const iyzicoLocale = resolveIyzicoLocale(requestLocale);

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || order.user_id !== user.id) return reply.code(404).send({ error: "Order not found" });

  // PAYMENT_MOCK_MODE — Iyzipay'i bypass et, ödeme başarılı say (test için).
  // Prod'da MUTLAKA "false" olmalı.
  if (process.env.PAYMENT_MOCK_MODE === 'true') {
    const [iyzicoGw] = await db.select().from(paymentGateways).where(eq(paymentGateways.slug, 'iyzico')).limit(1);
    const txId = `mock_${Date.now()}`;

    await db.update(orders).set({
      payment_status: 'paid',
      status: 'processing',
      transaction_id: txId,
    }).where(eq(orders.id, orderId));

    if (iyzicoGw) {
      await db.insert(payments).values({
        id: randomUUID(),
        order_id: orderId,
        gateway_id: iyzicoGw.id,
        amount: order.total_amount,
        currency: order.currency,
        status: 'success',
        transaction_id: txId,
        raw_response: JSON.stringify({ mock: true, note: 'PAYMENT_MOCK_MODE=true' }),
      });
    }

    // Bağlı booking varsa onaylı'ya çek
    if (order.booking_id) {
      await db.update(bookings).set({
        status: 'confirmed',
      } as any).where(eq(bookings.id, order.booking_id));
    }

    const siteUrl = process.env.FRONTEND_URL || process.env.PUBLIC_URL || 'http://localhost:3000';
    // Booking varsa direkt call ekranına; yoksa dashboard
    const checkoutUrl = order.booking_id
      ? `${siteUrl}/${requestLocale}/booking/${order.booking_id}/call?from=mock`
      : `${siteUrl}/${requestLocale}/dashboard?tab=bookings&booking=success&order_id=${orderId}`;
    return reply.send({ success: true, mock: true, checkout_url: checkoutUrl });
  }

  const [gateway] = await db.select().from(paymentGateways).where(eq(paymentGateways.slug, "iyzico")).limit(1);
  if (!gateway) return reply.code(400).send({ error: "Iyzico gateway not configured" });

  const iyzico = new IyzicoService(resolveIyzicoConfig(gateway));

  const [address] = await db.select().from(userAddresses)
    .where(eq(userAddresses.id, order.billing_address_id || ""))
    .limit(1);

  const conversationId = `conv_${order.order_number}`;
  const amount = order.total_amount;
  const siteUrl = process.env.FRONTEND_URL || process.env.PUBLIC_URL || "http://localhost:3000";

  try {
    const result = await iyzico.initializeCheckoutForm({
      locale: iyzicoLocale,
      conversationId,
      price: amount,
      paidPrice: amount,
      currency: order.currency,
      basketId: order.order_number,
      callbackUrl: `${resolveApiBase()}/api/orders/iyzico/callback?order_id=${orderId}`,
      buyer: {
        id: user.id,
        name: user.full_name?.split(" ")[0] || "Müşteri",
        surname: user.full_name?.split(" ").slice(1).join(" ") || ".",
        gsmNumber: user.phone || address?.phone || "+905000000000",
        email: user.email,
        identityNumber: "11111111111",
        lastLoginDate: new Date().toISOString().slice(0, 19).replace("T", " "),
        registrationDate: new Date().toISOString().slice(0, 19).replace("T", " "),
        registrationAddress: address?.address_line || "Adres belirtilmedi",
        ip: req.ip,
        city: address?.city || "İstanbul",
        country: "Turkey",
        zipCode: address?.postal_code || "34000",
      },
      shippingAddress: {
        contactName: address?.full_name || user.full_name || "Müşteri",
        city: address?.city || "İstanbul",
        country: "Turkey",
        address: address?.address_line || "Adres belirtilmedi",
        zipCode: address?.postal_code || "34000",
      },
      billingAddress: {
        contactName: address?.full_name || user.full_name || "Müşteri",
        city: address?.city || "İstanbul",
        country: "Turkey",
        address: address?.address_line || "Adres belirtilmedi",
        zipCode: address?.postal_code || "34000",
      },
      basketItems: [{
        id: orderId,
        name: `Randevu #${order.order_number}`,
        category1: "Consultation",
        itemType: "VIRTUAL" as const,
        price: amount,
      }],
    });

    if (result["status"] === "success") {
      return reply.send({
        success: true,
        checkout_url: result["paymentPageUrl"],
        token: result["token"],
      });
    } else {
      return reply.code(400).send({ error: result["errorMessage"] });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Iyzico error";
    return reply.code(500).send({ error: msg });
  }
};

/** Iyzico Callback */
export const iyzicoCallback: RouteHandler = async (req, reply) => {
  const { order_id } = req.query as { order_id: string };
  const { token } = req.body as { token: string };

  const [gateway] = await db.select().from(paymentGateways).where(eq(paymentGateways.slug, "iyzico")).limit(1);
  const iyzico = new IyzicoService(resolveIyzicoConfig(gateway));

  const siteUrl = process.env.FRONTEND_URL || process.env.PUBLIC_URL || "http://localhost:3000";

  try {
    const result = await iyzico.retrieveCheckoutResult(token);

    const isPaid = result["status"] === "success" && result["paymentStatus"] === "SUCCESS";
    const dbStatus  = isPaid ? "paid" : "failed";
    const payStatus = isPaid ? "success" : "failure";

    await db.update(orders).set({
      payment_status: dbStatus,
      status: isPaid ? "processing" : "pending",
      transaction_id: (result["paymentId"] as string | undefined) || token,
    }).where(eq(orders.id, order_id));

    await db.insert(payments).values({
      id: randomUUID(),
      order_id,
      gateway_id: gateway?.id || "",
      amount: (result["paidPrice"] as string | undefined) || "0",
      currency: (result["currency"] as string | undefined) || "TRY",
      status: payStatus,
      transaction_id: (result["paymentId"] as string | undefined) || token,
      raw_response: JSON.stringify(result),
    });

    const redirectUrl = isPaid
      ? `${siteUrl}/siparis/basarili?order_id=${order_id}`
      : `${siteUrl}/sepet?payment=failed&order_id=${order_id}`;

    return reply.redirect(redirectUrl);
  } catch {
    return reply.redirect(`${siteUrl}/sepet?payment=error`);
  }
};

/** List Orders */
export const listOrders: RouteHandler = async (req, reply) => {
  const user = getUser(req);
  const rows = await db.select().from(orders).where(eq(orders.user_id, user.id)).orderBy(desc(orders.created_at));
  return reply.send(rows);
};

/** Get Order Detail */
export const getOrderDetail: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const user = getUser(req);
  const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id)).limit(1);
  if (!order || order.user_id !== user.id) return reply.code(404).send({ error: "Order not found" });

  return reply.send(order);
};

const ORDER_STATUSES = new Set(["pending", "processing", "completed", "cancelled", "refunded", "paid"]);
const PAYMENT_STATUSES = new Set(["unpaid", "paid", "failed", "refunded"]);

function toPositiveInt(v: unknown, fallback: number, max: number) {
  const n = Number(v ?? fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), 1), max);
}

function trimParam(v: unknown) {
  return String(v ?? "").trim();
}

function normalizeOrderStatus(v: unknown) {
  const s = trimParam(v);
  return ORDER_STATUSES.has(s) ? s : "";
}

function normalizePaymentStatus(v: unknown) {
  const s = trimParam(v);
  return PAYMENT_STATUSES.has(s) ? s : "";
}

function adminOrderSelect() {
  return {
    id: orders.id,
    order_number: orders.order_number,
    status: orders.status,
    payment_status: orders.payment_status,
    total_amount: orders.total_amount,
    currency: orders.currency,
    transaction_id: orders.transaction_id,
    user_id: orders.user_id,
    user_email: users.email,
    user_name: users.full_name,
    order_notes: orders.notes,
    booking_id: orders.booking_id,
    created_at: orders.created_at,
    updated_at: orders.updated_at,
  };
}

function buildAdminOrderWhere(query: Record<string, unknown>) {
  const where: SQL[] = [];
  const status = normalizeOrderStatus(query.status);
  const paymentStatus = normalizePaymentStatus(query.payment_status);
  const q = trimParam(query.q);

  if (status) where.push(eq(orders.status, status));
  if (paymentStatus) where.push(eq(orders.payment_status, paymentStatus));
  if (q) {
    const qLike = `%${q}%`;
    where.push(
      or(
        like(orders.order_number, qLike),
        like(orders.transaction_id, qLike),
        like(users.email, qLike),
        like(users.full_name, qLike),
      ) as SQL,
    );
  }

  return where;
}

/** ADMIN: GET /admin/orders */
export const listOrdersAdmin: RouteHandler = async (req, reply) => {
  try {
    const query = ((req as any).query ?? {}) as Record<string, unknown>;
    const page = toPositiveInt(query.page, 1, 100000);
    const limit = toPositiveInt(query.limit, 20, 200);
    const offset = (page - 1) * limit;
    const where = buildAdminOrderWhere(query);
    const predicate = where.length ? and(...where) : undefined;

    const rowsQuery = db
      .select(adminOrderSelect())
      .from(orders)
      .leftJoin(users, eq(users.id, orders.user_id))
      .orderBy(desc(orders.created_at))
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ total: sql<number>`COUNT(*)` })
      .from(orders)
      .leftJoin(users, eq(users.id, orders.user_id));

    const [rows, countRows] = await Promise.all([
      predicate ? rowsQuery.where(predicate) : rowsQuery,
      predicate ? countQuery.where(predicate) : countQuery,
    ]);

    return reply.send({
      data: rows,
      page,
      limit,
      total: Number((countRows[0] as any)?.total ?? rows.length),
    });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: { message: "orders_list_failed" } });
  }
};

/** ADMIN: GET /admin/orders/:id */
export const getOrderAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  try {
    const id = trimParam(req.params.id);
    if (id.length !== 36) return reply.code(400).send({ error: { message: "invalid_id" } });

    const [order] = await db
      .select(adminOrderSelect())
      .from(orders)
      .leftJoin(users, eq(users.id, orders.user_id))
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) return reply.code(404).send({ error: { message: "not_found" } });

    const paymentRows = await db
      .select()
      .from(payments)
      .where(eq(payments.order_id, id))
      .orderBy(desc(payments.created_at));

    return reply.send({
      ...order,
      items: [],
      payments: paymentRows,
    });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: { message: "order_get_failed" } });
  }
};

/** ADMIN: PATCH /admin/orders/:id */
export const updateOrderAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  try {
    const id = trimParam(req.params.id);
    if (id.length !== 36) return reply.code(400).send({ error: { message: "invalid_id" } });

    const body = ((req as any).body ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = { updated_at: new Date() };
    const status = normalizeOrderStatus(body.status);
    const paymentStatus = normalizePaymentStatus(body.payment_status);

    if (body.status !== undefined) {
      if (!status) return reply.code(400).send({ error: { message: "invalid_status" } });
      patch.status = status;
    }
    if (body.payment_status !== undefined) {
      if (!paymentStatus) return reply.code(400).send({ error: { message: "invalid_payment_status" } });
      patch.payment_status = paymentStatus;
    }
    if (body.admin_note !== undefined) {
      const note = trimParam(body.admin_note);
      patch.notes = note || null;
    }

    if (Object.keys(patch).length <= 1) {
      return reply.code(400).send({ error: { message: "no_changes" } });
    }

    await db.update(orders).set(patch as any).where(eq(orders.id, id));
    return reply.send({ success: true });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: { message: "order_update_failed" } });
  }
};

/** ADMIN: POST /admin/orders/:id/refund */
export const refundOrderAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  try {
    const id = trimParam(req.params.id);
    if (id.length !== 36) return reply.code(400).send({ error: { message: "invalid_id" } });

    const body = ((req as any).body ?? {}) as Record<string, unknown>;
    const reason = trimParam(body.reason);

    await db.update(orders).set({
      status: "refunded",
      payment_status: "refunded",
      notes: reason || null,
      updated_at: new Date(),
    } as any).where(eq(orders.id, id));

    return reply.send({ success: true });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: { message: "order_refund_failed" } });
  }
};

/** ADMIN: GET /admin/payment-gateways */
export const listPaymentGatewaysAdmin: RouteHandler = async (_req, reply) => {
  const rows = await db.select().from(paymentGateways).orderBy(desc(paymentGateways.created_at));
  return reply.send(rows);
};

/** ADMIN: POST /admin/payment-gateways */
export const createPaymentGatewayAdmin: RouteHandler = async (req, reply) => {
  try {
    const body = ((req as any).body ?? {}) as Record<string, unknown>;
    const name = trimParam(body.name);
    const slug = trimParam(body.slug);
    if (!name || !slug) return reply.code(400).send({ error: { message: "name_and_slug_required" } });

    const id = randomUUID();
    await db.insert(paymentGateways).values({
      id,
      name,
      slug,
      is_active: Number(body.is_active ?? 1) ? 1 : 0,
      is_test_mode: Number(body.is_test_mode ?? 1) ? 1 : 0,
      config: body.config == null ? null : JSON.stringify(body.config),
    } as any);

    return reply.code(201).send({ success: true, id });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: { message: "payment_gateway_create_failed" } });
  }
};

/** ADMIN: PATCH /admin/payment-gateways/:id */
export const updatePaymentGatewayAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  try {
    const id = trimParam(req.params.id);
    if (id.length !== 36) return reply.code(400).send({ error: { message: "invalid_id" } });

    const body = ((req as any).body ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = { updated_at: new Date() };
    if (body.name !== undefined) patch.name = trimParam(body.name);
    if (body.is_active !== undefined) patch.is_active = Number(body.is_active) ? 1 : 0;
    if (body.is_test_mode !== undefined) patch.is_test_mode = Number(body.is_test_mode) ? 1 : 0;
    if (body.config !== undefined) patch.config = body.config == null ? null : JSON.stringify(body.config);

    await db.update(paymentGateways).set(patch as any).where(eq(paymentGateways.id, id));
    return reply.send({ success: true });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: { message: "payment_gateway_update_failed" } });
  }
};
