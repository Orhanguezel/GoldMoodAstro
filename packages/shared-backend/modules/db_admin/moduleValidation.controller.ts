// =============================================================
// FILE: src/modules/db_admin/moduleValidation.controller.ts
//  - VALIDATE MODULE MANIFEST vs DB TABLES
//  - GET /admin/db/modules/validate
// =============================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../../core/env';
import { createPool, type Pool, type RowDataPacket } from 'mysql2/promise';
import { z } from 'zod';
import { MODULES, type ModuleKey } from './moduleManifest';

function DB() {
  return {
    host: env.DB.host,
    port: env.DB.port,
    user: env.DB.user,
    password: env.DB.password,
    database: env.DB.name,
  };
}

let _pool: Pool | null = null;
function pool(): Pool {
  if (_pool) return _pool;
  const cfg = DB();
  _pool = createPool({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    charset: 'utf8mb4',
    multipleStatements: false,
  });
  return _pool!;
}

type TableRow = RowDataPacket & { name: string };

async function listDbTables(): Promise<string[]> {
  const cfg = DB();
  const p = pool();
  const conn = await p.getConnection();
  try {
    const [rows] = await conn.query<TableRow[]>(
      `SELECT TABLE_NAME AS name
         FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ?`,
      [cfg.database],
    );
    return (rows || [])
      .map((r) => String((r as any).name))
      .filter(Boolean)
      .sort();
  } finally {
    conn.release();
  }
}

/* ---------- helpers: simple “did you mean” suggestions ---------- */

function normalizeName(s: string): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[`"' ]/g, '')
    .replace(/[-]/g, '_');
}

function levenshtein(a: string, b: string): number {
  const s = normalizeName(a);
  const t = normalizeName(b);

  const m = s.length;
  const n = t.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[j] = Math.min(
        dp[j] + 1, // deletion
        dp[j - 1] + 1, // insertion
        prev + cost, // substitution
      );
      prev = tmp;
    }
  }
  return dp[n];
}

function bestMatches(target: string, candidates: string[], limit = 3): string[] {
  const scored = candidates
    .map((c) => ({ c, d: levenshtein(target, c) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, limit);

  // çok alakasızları ele
  const best = scored[0]?.d ?? 999;
  const threshold = Math.max(2, Math.floor((normalizeName(target).length || 1) * 0.4));
  return scored.filter((x) => x.d <= Math.min(threshold, best + 2)).map((x) => x.c);
}

/* ---------- schema ---------- */

const ValidateQuery = z.object({
  // ?module=products  (optional, can repeat)
  module: z.union([z.string(), z.array(z.string())]).optional(),
  // ?includeDbTables=1  -> response içine tüm tablo listesini koyar
  includeDbTables: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((v) => {
      if (typeof v === 'boolean') return v;
      const s = String(v ?? '').toLowerCase();
      return s === '1' || s === 'true' || s === 'yes';
    })
    .default(false),
});

function asModuleList(v: unknown): string[] | null {
  if (!v) return null;
  if (Array.isArray(v)) return v.map((x) => String(x || '')).filter(Boolean);
  const s = String(v || '').trim();
  if (!s) return null;
  return [s];
}

export async function adminValidateModuleManifest(req: FastifyRequest, reply: FastifyReply) {
  const parsed = ValidateQuery.safeParse(req.query || {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ ok: false, error: 'invalid_query', details: parsed.error.flatten() });
  }

  const requested = asModuleList(parsed.data.module);
  const includeDbTables = parsed.data.includeDbTables;

  const dbTables = await listDbTables();
  const dbSet = new Set(dbTables);

  const allModuleKeys = Object.keys(MODULES) as ModuleKey[];
  const targetModules = requested
    ? (requested.filter((m) => m in MODULES) as ModuleKey[])
    : allModuleKeys;

  const unknownRequested = requested?.filter((m) => !(m in MODULES))?.length
    ? requested.filter((m) => !(m in MODULES))
    : [];

  const results = targetModules.map((mk) => {
    const manifestTables = MODULES[mk]?.tablesInOrder || [];
    const missing = manifestTables.filter((t) => !dbSet.has(t));
    const present = manifestTables.filter((t) => dbSet.has(t));

    const suggestions: Record<string, string[]> = {};
    for (const m of missing) {
      const matches = bestMatches(m, dbTables, 3);
      if (matches.length) suggestions[m] = matches;
    }

    return {
      module: mk,
      ok: missing.length === 0,
      tables: {
        expected: manifestTables,
        present,
        missing,
      },
      suggestions, // missing table -> best match candidates
    };
  });

  const okAll = results.every((r) => r.ok);

  return reply.send({
    ok: true,
    db: { database: DB().database },
    okAll,
    unknownRequested: unknownRequested.length ? unknownRequested : undefined,
    results,
    dbTables: includeDbTables ? dbTables : undefined,
  });
}
