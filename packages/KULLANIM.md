# packages/ — Kullanim Rehberi (GoldMoodAstro)

Bu dosya, GoldMoodAstro monorepo icindeki ortak paketlerin nasil kullanilacagini anlatir.

## Paket Adlari

| Dizin | Paket adi |
|-------|-----------|
| core | @goldmood/core |
| shared-backend | @goldmood/shared-backend |
| shared-types | @goldmood/shared-types |
| shared-config | @goldmood/shared-config |
| shared-ui | @goldmood/shared-ui |

## Hizli Baslangic

1) Workspace bagimliliklarini kur

```bash
cd /home/orhan/Documents/Projeler/goldmoodastro
bun install
```

2) Gelistirme komutlari

```bash
bun run dev:backend
bun run dev:admin
```

3) Tip kontrolu

```bash
bun run typecheck
```

4) Seed calistir (DB degisikligi sonrasi)

```bash
bun run db:seed
```

## Paketleri Projelerde Kullanma

### Backend package.json

```json
{
  "dependencies": {
    "@goldmood/shared-backend": "workspace:*",
    "@goldmood/shared-types": "workspace:*"
  }
}
```

### Admin panel package.json

```json
{
  "dependencies": {
    "@goldmood/core": "workspace:*",
    "@goldmood/shared-ui": "workspace:*",
    "@goldmood/shared-config": "workspace:*",
    "@goldmood/shared-types": "workspace:*"
  }
}
```

## Import Ornekleri

### @goldmood/shared-backend

```typescript
import { authPlugin } from '@goldmood/shared-backend/plugins/authPlugin';
import { mysqlPlugin } from '@goldmood/shared-backend/plugins/mysql';

import { authGuard } from '@goldmood/shared-backend/middleware/auth';
import { roleGuard } from '@goldmood/shared-backend/middleware/roles';

import authModule from '@goldmood/shared-backend/modules/auth';
import bookingsModule from '@goldmood/shared-backend/modules/bookings';

import { AppError } from '@goldmood/shared-backend/core/error';
import { env } from '@goldmood/shared-backend/core/env';

import { buildPaginationMeta } from '@goldmood/shared-backend/modules/_shared';
```

### @goldmood/core

```typescript
import { API_ENDPOINTS } from '@goldmood/core/endpoints';
import { getRuntimeLocaleSettings } from '@goldmood/core/i18n';
import * as services from '@goldmood/core/services';
import type * as types from '@goldmood/core/types';
```

### @goldmood/shared-config

```json
{
  "extends": "@goldmood/shared-config/tsconfig.base"
}
```

```css
@import '@goldmood/shared-config/tailwind-tokens';
```

### @goldmood/shared-ui

```typescript
import { Button } from '@goldmood/shared-ui/admin/ui/button';
import { DataTable } from '@goldmood/shared-ui/admin/data-table/data-table';
import { JsonLd } from '@goldmood/shared-ui/public/seo/JsonLd';
```

## Backend Modulleri Icın Kural

AGENTS.md'ye gore:

- Paylasimli moduller: `packages/shared-backend/modules/`
- GoldMoodAstro proje-ozel moduller: `backend/src/modules/`
- Proje-ozel route kaydi: `backend/src/routes/goldmood.ts`
- Shared route kaydi: `backend/src/routes/shared.ts`

Yeni backend modulu olustururken su dosya yapisini takip et:

```text
schema.ts
router.ts
admin.routes.ts
controller.ts
repository.ts
validation.ts
index.ts
```

## Veritabani ve Seed Kurali

- ALTER TABLE kullanma
- Degisiklikleri `backend/src/db/sql/` altindaki seed dosyalarina isle
- Sonrasinda root'tan `bun run db:seed` calistir
- Yeni tablolarda id alaninda CHAR(36) UUID pattern'i kullan

## Pratik Akis

1. packages altinda degisiklik yap
2. Gerekli uygulamada importlari guncelle
3. `bun run typecheck` calistir
4. Backend degisikligi varsa ilgili route kaydini kontrol et (`shared.ts` veya `goldmood.ts`)
5. SQL etkisi varsa `bun run db:seed` ile dogrula

## Kisa Kurallar

1. Sadece Bun kullan
2. Workspace paketlerinde surum olarak `workspace:*` kullan
3. 2+ yerde tekrar eden kodu packages altina tasi
4. GoldMoodAstro'ya ozel domain logic'i `backend/src/modules/` altinda tut
5. Importlarda `@goldmood/*` disinda namespace kullanma
