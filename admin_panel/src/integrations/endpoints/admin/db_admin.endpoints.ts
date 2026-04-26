// =============================================================
// FILE: src/integrations/endpoints/admin/db_admin.endpoints.ts
// =============================================================
import { baseApi } from '@/integrations/baseApi';
import type {
  DbImportResponse,
  SqlImportFileParams,
  SqlImportTextParams,
  SqlImportUrlParams,
  DbSnapshot,
  CreateDbSnapshotBody,
  DeleteSnapshotResponse,
} from '@/integrations/shared';

const ADMIN_BASE = '/admin/db';

export const dbAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /* ---------------------------------------------------------
     * EXPORT: GET /admin/db/export  -> Blob (.sql)
     * --------------------------------------------------------- */
    exportSql: b.mutation<Blob, void>({
      query: () => ({
        url: `${ADMIN_BASE}/export`,
        method: 'GET',
        credentials: 'include',
        // Blob'u TS uyumlu almak için arrayBuffer + transform
        responseHandler: (resp: Response) => resp.arrayBuffer(),
      }),
      transformResponse: (ab: ArrayBuffer) => new Blob([ab], { type: 'application/sql' }),
    }),

    /* ---------------------------------------------------------
     * IMPORT (TEXT): POST /admin/db/import-sql
     * body: { sql, dryRun?, truncateBefore? }
     * --------------------------------------------------------- */
    importSqlText: b.mutation<DbImportResponse, SqlImportTextParams>({
      query: (body) => ({
        url: `${ADMIN_BASE}/import-sql`,
        method: 'POST',
        body,
        credentials: 'include',
      }),
    }),

    /* ---------------------------------------------------------
     * IMPORT (URL): POST /admin/db/import-url
     * body: { url, dryRun?, truncateBefore? }  (gzip destekli)
     * --------------------------------------------------------- */
    importSqlUrl: b.mutation<DbImportResponse, SqlImportUrlParams>({
      query: (body) => ({
        url: `${ADMIN_BASE}/import-url`,
        method: 'POST',
        body,
        credentials: 'include',
      }),
    }),

    /* ---------------------------------------------------------
     * IMPORT (FILE): POST /admin/db/import-file
     * multipart: file(.sql|.gz) + fields: truncateBefore?
     * (BE eski alan adı truncate_before_import'u da kabul ediyor)
     * --------------------------------------------------------- */
    importSqlFile: b.mutation<DbImportResponse, SqlImportFileParams>({
      query: ({ file, truncateBefore }) => {
        const form = new FormData();
        form.append('file', file, file.name);
        if (typeof truncateBefore !== 'undefined') {
          form.append('truncateBefore', String(!!truncateBefore));
          // eski alan adına da yazalım (tam uyumluluk)
          form.append('truncate_before_import', String(!!truncateBefore));
        }
        return {
          url: `${ADMIN_BASE}/import-file`,
          method: 'POST',
          body: form,
          credentials: 'include',
        };
      },
    }),


    /* ---------------------------------------------------------
     * SNAPSHOT LİSTESİ: GET /admin/db/snapshots
     * --------------------------------------------------------- */
    listDbSnapshots: b.query<DbSnapshot[], void>({
      query: () => ({
        url: `${ADMIN_BASE}/snapshots`,
        method: 'GET',
        credentials: 'include',
      }),
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT OLUŞTUR: POST /admin/db/snapshots
     * body: { label?, note? }
     * --------------------------------------------------------- */
    createDbSnapshot: b.mutation<DbSnapshot, CreateDbSnapshotBody | void>({
      query: (body) => ({
        url: `${ADMIN_BASE}/snapshots`,
        method: 'POST',
        body: body ?? {},
        credentials: 'include',
      }),
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT'TAN GERİ YÜKLE:
     * POST /admin/db/snapshots/:id/restore
     * body: { truncateBefore?: boolean, dryRun?: boolean }
     * --------------------------------------------------------- */
    restoreDbSnapshot: b.mutation<
      DbImportResponse,
      { id: string; dryRun?: boolean; truncateBefore?: boolean }
    >({
      query: ({ id, dryRun, truncateBefore }) => ({
        url: `${ADMIN_BASE}/snapshots/${encodeURIComponent(id)}/restore`,
        method: 'POST',
        body: {
          truncateBefore: truncateBefore ?? true,
          dryRun: dryRun ?? false,
        },
        credentials: 'include',
      }),
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT SİL: DELETE /admin/db/snapshots/:id
     * --------------------------------------------------------- */
    deleteDbSnapshot: b.mutation<DeleteSnapshotResponse, { id: string }>({
      query: ({ id }) => ({
        url: `${ADMIN_BASE}/snapshots/${encodeURIComponent(id)}`,
        method: 'DELETE',
        credentials: 'include',
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useExportSqlMutation,
  useImportSqlTextMutation,
  useImportSqlUrlMutation,
  useImportSqlFileMutation,
  // snapshot hooks:
  useListDbSnapshotsQuery,
  useCreateDbSnapshotMutation,
  useRestoreDbSnapshotMutation,
  useDeleteDbSnapshotMutation,
} = dbAdminApi;
