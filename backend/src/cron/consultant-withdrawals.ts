import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

const HOUR_MS = 60 * 60 * 1000;

type PayoutCycle = {
  autoRequest: boolean;
  requestDay: number;
  minThreshold: number;
};

type Candidate = {
  wallet_id: string;
  user_id: string;
  consultant_id: string;
  balance: string | number;
  currency: string | null;
  bank_iban: string | null;
  bank_account_holder: string | null;
  bank_name: string | null;
};

function rowsFromExecute<T>(result: unknown): T[] {
  const rows = Array.isArray((result as any)?.[0]) ? (result as any)[0] : result;
  return Array.isArray(rows) ? (rows as T[]) : [];
}

function parseJsonSetting(raw: unknown): Record<string, unknown> | null {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function normalizeIban(input: string | null | undefined): string {
  return String(input || '').replace(/\s+/g, '').toUpperCase();
}

async function getPayoutCycle(): Promise<PayoutCycle> {
  const result = await db.execute(sql`
    SELECT value
    FROM site_settings
    WHERE \`key\` = 'payout_cycle' AND locale = '*'
    LIMIT 1
  `);
  const value = parseJsonSetting(rowsFromExecute<{ value: unknown }>(result)[0]?.value);
  const requestDay = Number(value?.request_day);
  const minThreshold = Number(value?.min_threshold);
  return {
    autoRequest: value?.auto_request !== false,
    requestDay: Number.isFinite(requestDay) && requestDay >= 1 && requestDay <= 28 ? Math.trunc(requestDay) : 1,
    minThreshold: Number.isFinite(minThreshold) && minThreshold > 0 ? minThreshold : 100,
  };
}

async function listCandidates(minThreshold: number): Promise<Candidate[]> {
  const result = await db.execute(sql`
    SELECT
      w.id AS wallet_id,
      w.user_id,
      w.balance,
      w.currency,
      c.id AS consultant_id,
      c.bank_iban,
      c.bank_account_holder,
      c.bank_name
    FROM wallets w
    INNER JOIN consultants c ON c.id = w.consultant_id
    WHERE w.status = 'active'
      AND c.approval_status = 'approved'
      AND c.kyc_status = 'approved'
      AND w.balance >= ${String(minThreshold)}
      AND NOT EXISTS (
        SELECT 1
        FROM withdrawal_requests wr
        WHERE wr.consultant_id = c.id
          AND wr.status IN ('pending', 'approved', 'paid')
          AND wr.requested_at >= DATE_FORMAT(NOW(3), '%Y-%m-01')
          AND wr.requested_at < DATE_ADD(DATE_FORMAT(NOW(3), '%Y-%m-01'), INTERVAL 1 MONTH)
      )
  `);
  return rowsFromExecute<Candidate>(result);
}

export async function runMonthlyWithdrawalAutoRequests() {
  const cycle = await getPayoutCycle();
  if (!cycle.autoRequest) return { created: 0, skipped: 0, errors: 0, reason: 'disabled' };

  const candidates = await listCandidates(cycle.minThreshold);
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const candidate of candidates) {
    const amount = Number(candidate.balance);
    const bankIban = normalizeIban(candidate.bank_iban);
    const bankHolder = String(candidate.bank_account_holder || '').trim();
    if (!Number.isFinite(amount) || amount < cycle.minThreshold || !/^TR\d{24}$/.test(bankIban) || !bankHolder) {
      skipped += 1;
      continue;
    }

    const withdrawalId = randomUUID();
    const txId = randomUUID();
    const currency = candidate.currency || 'TRY';
    const desc = [
      'Otomatik aylık ödeme talebi',
      `Withdrawal: ${withdrawalId}`,
      `IBAN: ${bankIban}`,
      `Hesap sahibi: ${bankHolder}`,
      candidate.bank_name ? `Banka: ${candidate.bank_name}` : null,
    ].filter(Boolean).join(' | ');

    try {
      await db.transaction(async (tx) => {
        await tx.execute(sql`
          UPDATE wallets
          SET balance = balance - ${String(amount)},
              total_withdrawn = total_withdrawn + ${String(amount)},
              updated_at = NOW(3)
          WHERE id = ${candidate.wallet_id}
            AND balance >= ${String(amount)}
            AND NOT EXISTS (
              SELECT 1
              FROM withdrawal_requests wr
              WHERE wr.consultant_id = ${candidate.consultant_id}
                AND wr.status IN ('pending', 'approved', 'paid')
                AND wr.requested_at >= DATE_FORMAT(NOW(3), '%Y-%m-01')
                AND wr.requested_at < DATE_ADD(DATE_FORMAT(NOW(3), '%Y-%m-01'), INTERVAL 1 MONTH)
            )
        `);

        await tx.execute(sql`
          INSERT INTO withdrawal_requests (
            id, consultant_id, user_id, amount, currency, bank_iban, bank_holder, bank_name, status,
            requested_at, admin_note, metadata
          )
          SELECT
            ${withdrawalId}, ${candidate.consultant_id}, ${candidate.user_id}, ${String(amount)}, ${currency},
            ${bankIban}, ${bankHolder}, ${candidate.bank_name || null}, 'pending',
            NOW(3), 'Otomatik aylık ödeme talebi',
            JSON_OBJECT('source', 'auto_monthly_payout', 'min_threshold', ${String(cycle.minThreshold)})
          WHERE ROW_COUNT() > 0
        `);

        await tx.execute(sql`
          INSERT INTO wallet_transactions (
            id, wallet_id, user_id, type, amount, currency, purpose, description,
            payment_status, transaction_ref, is_admin_created
          )
          SELECT
            ${txId}, ${candidate.wallet_id}, ${candidate.user_id}, 'debit', ${String(amount)}, ${currency},
            'withdrawal', ${desc}, 'pending', ${withdrawalId}, 1
          WHERE EXISTS (SELECT 1 FROM withdrawal_requests WHERE id = ${withdrawalId})
        `);
      });
      created += 1;
    } catch (error) {
      errors += 1;
      console.error('[cron] auto withdrawal request failed', {
        consultant_id: candidate.consultant_id,
        error,
      });
    }
  }

  return { created, skipped, errors, total_candidates: candidates.length };
}

export function registerConsultantWithdrawalCron() {
  let lastRunKey = '';
  const runIfDue = () => {
    const now = new Date();
    const runKey = `${now.getFullYear()}-${now.getMonth()}`;

    getPayoutCycle()
      .then((cycle) => {
        if (!cycle.autoRequest || now.getDate() !== cycle.requestDay || lastRunKey === runKey) return;
        lastRunKey = runKey;
        return runMonthlyWithdrawalAutoRequests();
      })
      .then((result) => {
        if (result) console.log('[cron] auto monthly withdrawals:', result);
      })
      .catch((error) => {
        console.error('[cron] auto monthly withdrawals failed:', error);
      });
  };

  setInterval(runIfDue, HOUR_MS);
  runIfDue();
}
