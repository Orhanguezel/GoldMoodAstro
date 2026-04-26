// =============================================================
// FILE: src/modules/db_admin/moduleExportImport.controller.ts
//  - EXPORT-MODULE: GET /admin/db/export-module?module=library&upsert=1
//  - IMPORT-MODULE: POST /admin/db/import-module { module, sql, dryRun?, truncateBefore? }
//  - UI EXPORT:      GET /admin/db/site-settings/ui-export?fromLocale=tr&prefix=ui_&prefix=contact_
//  - UI BOOTSTRAP:   POST /admin/db/site-settings/ui-bootstrap
// =============================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../../core/env';
import { createPool, type Pool, type PoolConnection, type RowDataPacket } from 'mysql2/promise';
import { z } from 'zod';
import { createReadStream, createWriteStream } from 'node:fs';
import { tmpFilePath, rmSafe } from './helpers';
import { MODULES, type ModuleKey, isModuleKey } from './moduleManifest';

// INSERT value escape
import { escape as sqlEscape } from 'mysql2';

/* ---------------- DB config / pool ---------------- */

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
    multipleStatements: false, // statement-by-statement (safer)
  });
  return _pool!;
}

function backtickIdent(name: string) {
  return '`' + String(name).replace(/`/g, '``') + '`';
}

interface TableRow extends RowDataPacket {
  name: string;
}

interface SiteSettingRow extends RowDataPacket {
  id: string;
  key: string;
  locale: string;
  value: any;
  created_at?: any;
  updated_at?: any;
}

/* ---------------- SQL split (quote/comment aware) ---------------- */

/**
 * SQL’i ; bazlı statement’lara böler.
 * - Tek/çift tırnak, backtick, line comment (--, #), block comment (/* *\/) destekler.
 * - DELIMITER desteği YOK (data-only import/export için hedeflenmiyor).
 */
function splitSqlStatements(sql: string): string[] {
  const out: string[] = [];
  const s = String(sql || '');
  let cur = '';
  let i = 0;

  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;

  let inLineComment = false;
  let inBlockComment = false;

  const flush = () => {
    const trimmed = cur.trim();
    // boş veya sadece ';' gibi “çöp” statement’ları ignore edelim
    if (trimmed && trimmed !== ';') out.push(trimmed);
    cur = '';
  };

  while (i < s.length) {
    const ch = s[i];
    const next = i + 1 < s.length ? s[i + 1] : '';

    if (inLineComment) {
      cur += ch;
      if (ch === '\n') inLineComment = false;
      i++;
      continue;
    }

    if (inBlockComment) {
      cur += ch;
      if (ch === '*' && next === '/') {
        cur += next;
        i += 2;
        inBlockComment = false;
        continue;
      }
      i++;
      continue;
    }

    if (!inSingle && !inDouble && !inBacktick) {
      // '-- ' veya '--\t' gibi gerçek line comment; '----' gibi çizgilerde false positive istemeyiz
      if (ch === '-' && next === '-') {
        const after = i + 2 < s.length ? s[i + 2] : '';
        if (after === ' ' || after === '\t' || after === '\r' || after === '\n') {
          inLineComment = true;
          cur += ch + next;
          i += 2;
          continue;
        }
      }
      if (ch === '#') {
        inLineComment = true;
        cur += ch;
        i++;
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        cur += ch + next;
        i += 2;
        continue;
      }
    }

    if (!inDouble && !inBacktick && ch === "'" && !inSingle) {
      inSingle = true;
      cur += ch;
      i++;
      continue;
    }
    if (inSingle) {
      cur += ch;
      if (ch === '\\' && next) {
        cur += next;
        i += 2;
        continue;
      }
      if (ch === "'") inSingle = false;
      i++;
      continue;
    }

    if (!inSingle && !inBacktick && ch === '"' && !inDouble) {
      inDouble = true;
      cur += ch;
      i++;
      continue;
    }
    if (inDouble) {
      cur += ch;
      if (ch === '\\' && next) {
        cur += next;
        i += 2;
        continue;
      }
      if (ch === '"') inDouble = false;
      i++;
      continue;
    }

    if (!inSingle && !inDouble && ch === '`') {
      inBacktick = !inBacktick;
      cur += ch;
      i++;
      continue;
    }

    if (!inSingle && !inDouble && !inBacktick && ch === ';') {
      cur += ch;
      flush();
      i++;
      continue;
    }

    cur += ch;
    i++;
  }

  flush();
  return out;
}

/* ---------------- Statement validation (allowlist + table allowlist) ---------------- */

type ParsedStmt =
  | { kind: 'set' | 'start' | 'commit' | 'rollback' | 'comment'; table?: undefined }
  | { kind: 'insert' | 'replace' | 'update' | 'delete'; table: string }
  | { kind: 'unknown'; table?: string };

const DISALLOWED_KEYWORDS = [
  'create',
  'alter',
  'drop',
  'truncate',
  'rename',
  'use',
  'grant',
  'revoke',
  'load',
  'outfile',
  'infile',
  'procedure',
  'function',
  'trigger',
  'event',
];

function stripLeadingComments(stmt: string): string {
  let s = stmt.trimStart();

  while (s.startsWith('/*')) {
    const end = s.indexOf('*/');
    if (end === -1) break;
    s = s.slice(end + 2).trimStart();
  }

  while (s.startsWith('--') || s.startsWith('#')) {
    const nl = s.indexOf('\n');
    if (nl === -1) return '';
    s = s.slice(nl + 1).trimStart();
  }

  return s;
}

function normalizeTableName(raw: string): string {
  let t = raw.trim();
  if (!t) return '';
  if (t.includes('.')) t = t.split('.').pop() || t;
  t = t.replace(/`/g, '');
  t = t.replace(/^["']|["']$/g, '');
  return t.trim();
}

function parseStatement(stmt: string): ParsedStmt {
  const s0 = stripLeadingComments(stmt);
  if (!s0) return { kind: 'comment' };

  const s = s0.trim();
  const lower = s.toLowerCase();

  for (const kw of DISALLOWED_KEYWORDS) {
    const re = new RegExp(`\\b${kw}\\b`, 'i');
    if (re.test(lower)) return { kind: 'unknown' };
  }

  if (/^set\b/i.test(lower)) return { kind: 'set' };
  if (/^start\s+transaction\b/i.test(lower)) return { kind: 'start' };
  if (/^commit\b/i.test(lower)) return { kind: 'commit' };
  if (/^rollback\b/i.test(lower)) return { kind: 'rollback' };

  {
    const m =
      s.match(/^\s*insert\s+(?:ignore\s+)?into\s+([`"']?[\w.-]+[`"']?)/i) ||
      s.match(/^\s*insert\s+into\s+([`"']?[\w.-]+[`"']?)/i);
    if (m?.[1]) return { kind: 'insert', table: normalizeTableName(m[1]) };
  }

  {
    const m = s.match(/^\s*replace\s+into\s+([`"']?[\w.-]+[`"']?)/i);
    if (m?.[1]) return { kind: 'replace', table: normalizeTableName(m[1]) };
  }

  {
    const m = s.match(/^\s*update\s+([`"']?[\w.-]+[`"']?)\s+set\b/i);
    if (m?.[1]) return { kind: 'update', table: normalizeTableName(m[1]) };
  }

  {
    const m = s.match(/^\s*delete\s+from\s+([`"']?[\w.-]+[`"']?)/i);
    if (m?.[1]) return { kind: 'delete', table: normalizeTableName(m[1]) };
  }

  return { kind: 'unknown' };
}

function validateStatementsOrThrow(module: ModuleKey, statements: string[]): { ok: true } {
  const manifest = MODULES[module];
  const allowedTables = new Set(manifest.tablesInOrder);

  const bad: { index: number; reason: string; stmt: string }[] = [];

  statements.forEach((st, idx) => {
    const p = parseStatement(st);

    if (p.kind === 'unknown') {
      bad.push({
        index: idx,
        reason:
          'Statement type not allowed (or contains disallowed keyword like CREATE/DROP/ALTER/TRUNCATE/USE/LOAD/OUTFILE/INFILE).',
        stmt: st.slice(0, 500),
      });
      return;
    }

    if (p.kind === 'insert' || p.kind === 'replace' || p.kind === 'update' || p.kind === 'delete') {
      if (!p.table || !allowedTables.has(p.table)) {
        bad.push({
          index: idx,
          reason: `Table not allowed for module '${module}': '${p.table || '?'}'`,
          stmt: st.slice(0, 500),
        });
      }
    }
  });

  if (bad.length) {
    const first = bad[0];
    const extra = bad.length > 1 ? ` (+${bad.length - 1} more)` : '';
    const msg = `SQL rejected. First error at statement #${first.index + 1}: ${
      first.reason
    }${extra}`;
    const err: any = new Error(msg);
    err.details = bad;
    throw err;
  }

  return { ok: true };
}

/* ---------------- Module helpers ---------------- */

function getTruncateList(module: ModuleKey): string[] {
  const m = MODULES[module];
  if (m.truncateInOrder?.length) return [...m.truncateInOrder];
  return [...m.tablesInOrder].reverse();
}

async function truncateModuleTables(conn: PoolConnection, module: ModuleKey) {
  const tables = getTruncateList(module);
  for (const t of tables) {
    await conn.query(`TRUNCATE TABLE ${backtickIdent(t)};`);
  }
}

/* ---------------- Export helpers (UPSERT) ---------------- */

function buildOnDuplicateUpdateClause(columns: string[]): string {
  // id ve created_at genellikle “ilk insert”te anlamlı; update’te dokunmayalım.
  const skip = new Set(['id', 'created_at']);
  const updatable = columns.filter((c) => !skip.has(c));
  if (!updatable.length) return '';
  const parts = updatable.map((c) => `${backtickIdent(c)} = VALUES(${backtickIdent(c)})`);
  return `ON DUPLICATE KEY UPDATE\n  ${parts.join(',\n  ')}`;
}

/* ---------------- EXPORT MODULE (DATA-ONLY) ---------------- */

async function dumpModuleDataOnly(
  conn: PoolConnection,
  module: ModuleKey,
  outPath: string,
  upsert: boolean,
) {
  const ws = createWriteStream(outPath, { encoding: 'utf8' });

  const write = (chunk: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const ok = ws.write(chunk, (err) => (err ? reject(err) : resolve()));
      if (!ok) ws.once('drain', () => resolve());
    });

  const close = (): Promise<void> =>
    new Promise((resolve, reject) => {
      ws.end((err: any) => (err ? reject(err) : resolve()));
    });

  const tables = MODULES[module].tablesInOrder;

  try {
    await write(`-- Ensotek module export (DATA ONLY)\n`);
    await write(`-- module: ${module}\n`);
    await write(`-- upsert: ${upsert ? '1' : '0'}\n`);
    await write(`-- generated_at: ${new Date().toISOString()}\n\n`);
    await write(`SET NAMES utf8mb4;\n`);
    await write(`SET time_zone = '+00:00';\n`);
    await write(`SET FOREIGN_KEY_CHECKS=0;\n`);
    await write(`SET SQL_SAFE_UPDATES=0;\n\n`);

    for (const table of tables) {
      const [chk] = await conn.query<TableRow[]>(
        `SELECT TABLE_NAME AS name
           FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = ?
          LIMIT 1`,
        [DB().database, table],
      );

      if (!chk?.length) {
        await write(`-- WARN: table not found, skipped: ${backtickIdent(table)}\n\n`);
        continue;
      }

      const [rows] = await conn.query<RowDataPacket[]>(`SELECT * FROM ${backtickIdent(table)}`);
      const data = rows as Record<string, any>[];

      if (!data.length) {
        await write(`-- ${backtickIdent(table)}: no rows\n\n`);
        continue;
      }

      await write(
        `-- ------------------------------------------------------------\n-- TABLE: ${backtickIdent(
          table,
        )} (rows: ${
          data.length
        })\n-- ------------------------------------------------------------\n`,
      );

      const columns = Object.keys(data[0] || {});
      const colList = columns.map((c) => backtickIdent(c)).join(', ');
      const insertPrefix = `INSERT INTO ${backtickIdent(table)} (${colList}) VALUES `;

      const chunkSize = 200;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);

        const valuesSql = chunk
          .map((row) => {
            const vals = columns.map((col) => {
              const v = (row as any)[col];
              if (v === null || typeof v === 'undefined') return 'NULL';
              return sqlEscape(v);
            });
            return `(${vals.join(', ')})`;
          })
          .join(',\n');

        const onDup = upsert ? buildOnDuplicateUpdateClause(columns) : '';
        const stmt = onDup
          ? `${insertPrefix}\n${valuesSql}\n${onDup}\n;`
          : `${insertPrefix}\n${valuesSql}\n;`;

        await write(stmt + '\n\n');
      }
    }

    await write(`SET FOREIGN_KEY_CHECKS=1;\n`);
  } finally {
    await close();
  }
}

const ExportModuleQuery = z.object({
  module: z.string().min(1),
  upsert: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((v) => {
      if (typeof v === 'boolean') return v;
      const s = String(v ?? '')
        .toLowerCase()
        .trim();
      if (!s) return true; // default
      return s === '1' || s === 'true' || s === 'yes';
    }),
});

export async function adminExportModuleSql(req: FastifyRequest, reply: FastifyReply) {
  const parsed = ExportModuleQuery.safeParse(req.query || {});
  if (!parsed.success) {
    return reply.code(400).send({ ok: false, error: 'module_required' });
  }

  const moduleRaw = parsed.data.module;
  if (!isModuleKey(moduleRaw)) {
    return reply
      .code(400)
      .send({ ok: false, error: 'invalid_module', allowed: Object.keys(MODULES) });
  }

  const module = moduleRaw as ModuleKey;
  const upsert = parsed.data.upsert ?? true;

  const stamp = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const filename = `module_${module}_${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(
    stamp.getDate(),
  )}_${pad(stamp.getHours())}${pad(stamp.getMinutes())}.sql`;

  const tmpOut = tmpFilePath('.sql');

  const p = pool();
  const conn = await p.getConnection();

  try {
    await dumpModuleDataOnly(conn, module, tmpOut, upsert);

    const stream = createReadStream(tmpOut);
    stream.on('close', () => rmSafe(tmpOut));
    stream.on('error', () => rmSafe(tmpOut));

    return reply.header('Content-Disposition', `attachment; filename="${filename}"`).send(stream);
  } catch (err: any) {
    req.log.error({ err }, 'module export failed');
    rmSafe(tmpOut);
    return reply.code(500).send({ ok: false, error: err?.message || 'module_export_failed' });
  } finally {
    conn.release();
  }
}

/* ---------------- IMPORT MODULE (DATA-ONLY, allowlist) ---------------- */

const ImportModuleBody = z.object({
  module: z.string().min(1),
  sql: z.string().min(1),
  dryRun: z.boolean().optional().default(false),
  truncateBefore: z.boolean().optional().default(false),
});

export async function adminImportModuleSql(req: FastifyRequest, reply: FastifyReply) {
  const body = ImportModuleBody.safeParse(req.body || {});
  if (!body.success) {
    return reply
      .code(400)
      .send({ ok: false, error: 'invalid_body', details: body.error.flatten() });
  }

  const moduleRaw = body.data.module;
  if (!isModuleKey(moduleRaw)) {
    return reply
      .code(400)
      .send({ ok: false, error: 'invalid_module', allowed: Object.keys(MODULES) });
  }

  const module = moduleRaw as ModuleKey;
  const sql = body.data.sql;
  const dryRun = body.data.dryRun;
  const truncateBefore = body.data.truncateBefore;

  const statements = splitSqlStatements(sql);

  try {
    validateStatementsOrThrow(module, statements);
  } catch (err: any) {
    return reply.code(400).send({
      ok: false,
      error: 'sql_rejected',
      message: err?.message || 'SQL rejected',
      details: err?.details || null,
    });
  }

  const p = pool();
  const conn = await p.getConnection();

  try {
    await conn.beginTransaction();
    await conn.query('SET FOREIGN_KEY_CHECKS=0;');
    await conn.query('SET SQL_SAFE_UPDATES=0;');

    if (truncateBefore) {
      await truncateModuleTables(conn, module);
    }

    for (const st of statements) {
      const stripped = stripLeadingComments(st);
      if (!stripped.trim()) continue;

      // import’ta exec edilecek statement: tek bir trailing ';' temizle
      const execStmt = st.trim().replace(/;\s*$/g, '');
      if (!execStmt) continue;

      await conn.query(execStmt);
    }

    if (dryRun) {
      await conn.rollback();
      return reply.send({ ok: true, dryRun: true });
    }

    await conn.commit();
    return reply.send({ ok: true });
  } catch (err: any) {
    try {
      await conn.rollback();
    } catch {
      // ignore
    }
    req.log.error({ err, module }, 'module import failed');
    return reply.code(400).send({ ok: false, error: err?.message || 'module_import_failed' });
  } finally {
    try {
      await conn.query('SET FOREIGN_KEY_CHECKS=1;');
    } catch {
      // ignore
    }
    conn.release();
  }
}

/* =======================================================================
 * SITE SETTINGS: UI EXPORT (JSON)
 * ======================================================================= */

const UiExportQuery = z.object({
  fromLocale: z.string().trim().min(2).max(10).default('tr'),
  prefix: z.union([z.string(), z.array(z.string())]).optional(),
});

function asPrefixList(v: unknown): string[] {
  if (!v) return ['ui_']; // default
  if (Array.isArray(v)) return v.map((x) => String(x || '')).filter(Boolean);
  return [String(v || '')].filter(Boolean);
}

function safeJsonParse(v: any): any {
  if (v === null || typeof v === 'undefined') return null;
  if (typeof v === 'object') return v;
  const s = String(v);
  if (!s) return '';
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

export async function adminExportSiteSettingsUiJson(req: FastifyRequest, reply: FastifyReply) {
  const parsed = UiExportQuery.safeParse(req.query || {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ ok: false, error: 'invalid_query', details: parsed.error.flatten() });
  }

  const fromLocale = parsed.data.fromLocale;
  const prefixes = asPrefixList(parsed.data.prefix)
    .map((p) => p.trim())
    .filter(Boolean);

  const p = pool();
  const conn = await p.getConnection();

  try {
    const where = prefixes.map(() => '`key` LIKE ?').join(' OR ');
    const args = prefixes.map((pref) => `${pref}%`);

    const [rows] = await conn.query<SiteSettingRow[]>(
      `SELECT id, \`key\` as \`key\`, locale, \`value\`
         FROM site_settings
        WHERE locale = ?
          AND (${where})
        ORDER BY \`key\` ASC`,
      [fromLocale, ...args],
    );

    const items: Record<string, any> = {};
    for (const r of rows || []) {
      items[String(r.key)] = safeJsonParse((r as any).value);
    }

    return reply.send({
      ok: true,
      fromLocale,
      prefixes,
      count: Object.keys(items).length,
      items,
    });
  } catch (err: any) {
    req.log.error({ err }, 'ui-export failed');
    return reply.code(500).send({ ok: false, error: err?.message || 'ui_export_failed' });
  } finally {
    conn.release();
  }
}

/* =======================================================================
 * SITE SETTINGS: UI BOOTSTRAP
 * ======================================================================= */

const UiBootstrapBody = z.object({
  sourceLocale: z.string().trim().min(2).max(10),
  targetLocale: z.string().trim().min(2).max(10),
  prefixes: z.array(z.string().trim().min(1)).optional().default(['ui_']),
  overwrite: z.boolean().optional().default(false),
});

export async function adminBootstrapSiteSettingsUiLocale(req: FastifyRequest, reply: FastifyReply) {
  const parsed = UiBootstrapBody.safeParse(req.body || {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ ok: false, error: 'invalid_body', details: parsed.error.flatten() });
  }

  const { sourceLocale, targetLocale, prefixes, overwrite } = parsed.data;

  if (sourceLocale === targetLocale) {
    return reply.code(400).send({
      ok: false,
      error: 'same_locale',
      message: 'sourceLocale and targetLocale must differ.',
    });
  }

  const p = pool();
  const conn = await p.getConnection();

  const where = prefixes.map(() => '`key` LIKE ?').join(' OR ');
  const args = prefixes.map((pref) => `${pref}%`);

  try {
    await conn.beginTransaction();
    await conn.query('SET FOREIGN_KEY_CHECKS=0;');
    await conn.query('SET SQL_SAFE_UPDATES=0;');

    const [srcRows] = await conn.query<SiteSettingRow[]>(
      `SELECT \`key\`, \`value\`
         FROM site_settings
        WHERE locale = ?
          AND (${where})
        ORDER BY \`key\` ASC`,
      [sourceLocale, ...args],
    );

    const source = (srcRows || []).map((r) => ({
      key: String((r as any).key),
      value: (r as any).value,
    }));

    if (!source.length) {
      await conn.rollback();
      return reply.send({
        ok: true,
        message: 'no_source_rows',
        sourceLocale,
        targetLocale,
        prefixes,
        insertedOrUpdated: 0,
      });
    }

    let existing = new Set<string>();
    if (!overwrite) {
      const [tgtRows] = await conn.query<RowDataPacket[]>(
        `SELECT \`key\`
           FROM site_settings
          WHERE locale = ?
            AND (${where})`,
        [targetLocale, ...args],
      );
      existing = new Set((tgtRows || []).map((x: any) => String(x.key)));
    }

    let count = 0;

    for (const row of source) {
      if (!overwrite && existing.has(row.key)) continue;

      await conn.query(
        `INSERT INTO site_settings (id, \`key\`, locale, \`value\`, created_at, updated_at)
         VALUES (UUID(), ?, ?, ?, NOW(3), NOW(3))
         ON DUPLICATE KEY UPDATE
           \`value\`      = VALUES(\`value\`),
           \`updated_at\` = VALUES(\`updated_at\`)`,
        [row.key, targetLocale, row.value],
      );

      count++;
    }

    await conn.commit();

    return reply.send({
      ok: true,
      sourceLocale,
      targetLocale,
      prefixes,
      overwrite,
      insertedOrUpdated: count,
    });
  } catch (err: any) {
    try {
      await conn.rollback();
    } catch {
      // ignore
    }
    req.log.error({ err }, 'ui-bootstrap failed');
    return reply.code(500).send({ ok: false, error: err?.message || 'ui_bootstrap_failed' });
  } finally {
    try {
      await conn.query('SET FOREIGN_KEY_CHECKS=1;');
    } catch {
      // ignore
    }
    conn.release();
  }
}
