// packages/shared-backend/modules/credits/repository.ts
import { db } from '../../db/client';
import { eq, and, desc, sql as drizzleSql } from 'drizzle-orm';
import { creditPackages, userCredits, creditTransactions } from './schema';
import { v4 as uuidv4 } from 'uuid';

function normalizeLocale(locale?: string | null): string {
  const normalized = String(locale || 'tr').trim().toLowerCase().split('-')[0];
  return normalized || 'tr';
}

function mapCreditPackage(row: any) {
  if (!row) return row;
  return {
    ...row,
    nameTr: row.nameTr ?? row.name_tr,
    nameEn: row.nameEn ?? row.name_en,
    descriptionTr: row.descriptionTr ?? row.description_tr,
    descriptionEn: row.descriptionEn ?? row.description_en,
    priceMinor: row.priceMinor ?? row.price_minor,
    bonusCredits: row.bonusCredits ?? row.bonus_credits,
    isActive: row.isActive ?? row.is_active,
    isFeatured: row.isFeatured ?? row.is_featured,
    displayOrder: row.displayOrder ?? row.display_order,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

export async function listActivePackages(locale = 'tr') {
  const normalized = normalizeLocale(locale);
  const [rows] = await (db as any).session.client.query(
    `SELECT p.*,
      COALESCE(req_i18n.name, tr_i18n.name, IF(? = 'en', p.name_en, p.name_tr)) AS name,
      COALESCE(req_i18n.description, tr_i18n.description, IF(? = 'en', p.description_en, p.description_tr)) AS description
     FROM credit_packages p
     LEFT JOIN credit_package_i18n req_i18n ON req_i18n.package_id = p.id AND req_i18n.locale = ?
     LEFT JOIN credit_package_i18n tr_i18n ON tr_i18n.package_id = p.id AND tr_i18n.locale = 'tr'
     WHERE p.is_active = 1
     ORDER BY p.display_order`,
    [normalized, normalized, normalized],
  );
  return (rows as any[]).map(mapCreditPackage);
}

export async function getPackageById(id: string, locale = 'tr') {
  const normalized = normalizeLocale(locale);
  const [rows] = await (db as any).session.client.query(
    `SELECT p.*,
      COALESCE(req_i18n.name, tr_i18n.name, IF(? = 'en', p.name_en, p.name_tr)) AS name,
      COALESCE(req_i18n.description, tr_i18n.description, IF(? = 'en', p.description_en, p.description_tr)) AS description
     FROM credit_packages p
     LEFT JOIN credit_package_i18n req_i18n ON req_i18n.package_id = p.id AND req_i18n.locale = ?
     LEFT JOIN credit_package_i18n tr_i18n ON tr_i18n.package_id = p.id AND tr_i18n.locale = 'tr'
     WHERE p.id = ?
     LIMIT 1`,
    [normalized, normalized, normalized, id],
  );
  return mapCreditPackage((rows as any[])[0]) || null;
}

export async function getUserBalance(userId: string) {
  const rows = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  if (rows.length === 0) {
    // Create record if not exists
    const id = uuidv4();
    await db.insert(userCredits).values({ id, userId, balance: 0 });
    return { userId, balance: 0 };
  }
  return rows[0];
}

export async function addCredits(userId: string, amount: number, type: any, reference: { type?: string, id?: string, orderId?: string, description?: string }) {
  return db.transaction(async (tx) => {
    // 1) Get current balance
    const rows = await tx.select().from(userCredits).where(eq(userCredits.userId, userId));
    let currentBalance = 0;
    let balanceId = uuidv4();

    if (rows.length > 0) {
      currentBalance = rows[0].balance;
      balanceId = rows[0].id;
    }

    const newBalance = currentBalance + amount;

    // 2) Update balance
    if (rows.length > 0) {
      await tx.update(userCredits).set({ balance: newBalance }).where(eq(userCredits.id, balanceId));
    } else {
      await tx.insert(userCredits).values({ id: balanceId, userId, balance: newBalance });
    }

    // 3) Log transaction
    const txId = uuidv4();
    await tx.insert(creditTransactions).values({
      id: txId,
      userId,
      type,
      amount,
      balanceAfter: newBalance,
      referenceType: reference.type,
      referenceId: reference.id,
      orderId: reference.orderId,
      description: reference.description
    });

    return { balance: newBalance };
  });
}

export async function getTransactionHistory(userId: string) {
  return db.select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(50);
}
