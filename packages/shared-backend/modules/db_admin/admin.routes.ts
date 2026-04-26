// =============================================================
// FILE: src/modules/db_admin/admin.routes.ts
// =============================================================

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth';

import {
  adminExportSql,
  adminImportSqlText,
  adminImportSqlFromUrl,
  adminImportSqlFromFile,
  adminListDbSnapshots,
  adminCreateDbSnapshot,
  adminRestoreDbSnapshot,
  adminDeleteDbSnapshot,
} from './admin.controller';

import {
  adminExportModuleSql,
  adminImportModuleSql,
  adminExportSiteSettingsUiJson,
  adminBootstrapSiteSettingsUiLocale,
} from './moduleExportImport.controller';

import { adminValidateModuleManifest } from './moduleValidation.controller';

export async function registerDbAdmin(app: FastifyInstance) {
  // FULL DB
  app.get('/db/export', { preHandler: [requireAuth] }, adminExportSql);
  app.post('/db/import-sql', { preHandler: [requireAuth] }, adminImportSqlText);
  app.post('/db/import-url', { preHandler: [requireAuth] }, adminImportSqlFromUrl);
  app.post('/db/import-file', { preHandler: [requireAuth] }, adminImportSqlFromFile);

  // MODULE export/import
  app.get('/db/export-module', { preHandler: [requireAuth] }, adminExportModuleSql);
  app.post('/db/import-module', { preHandler: [requireAuth] }, adminImportModuleSql);

  // SITE SETTINGS bulk UI ops
  app.get(
    '/db/site-settings/ui-export',
    { preHandler: [requireAuth] },
    adminExportSiteSettingsUiJson,
  );
  app.post(
    '/db/site-settings/ui-bootstrap',
    { preHandler: [requireAuth] },
    adminBootstrapSiteSettingsUiLocale,
  );

  // ✅ MANIFEST VALIDATION
  // GET /admin/db/modules/validate
  // Optional: ?module=products&module=site_settings&includeDbTables=1
  app.get('/db/modules/validate', { preHandler: [requireAuth] }, adminValidateModuleManifest);

  // SNAPSHOT
  app.get('/db/snapshots', { preHandler: [requireAuth] }, adminListDbSnapshots);
  app.post('/db/snapshots', { preHandler: [requireAuth] }, adminCreateDbSnapshot);
  app.post('/db/snapshots/:id/restore', { preHandler: [requireAuth] }, adminRestoreDbSnapshot);
  app.delete('/db/snapshots/:id', { preHandler: [requireAuth] }, adminDeleteDbSnapshot);
}
