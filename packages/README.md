# packages/ — GoldMoodAstro Ortak Paketler

Bu dizin, GoldMoodAstro monorepo icindeki paylasimli paketleri icerir.
Amac: backend, admin panel ve ileride mobile tarafinda tekrar eden kodu tek yerde tutmak.

AGENTS.md ile uyumlu temel kurallar:

- Runtime: Bun (npm/yarn kullanilmaz)
- Backend: Fastify 5 + Drizzle ORM + MySQL + Zod
- Dil: TypeScript strict mode
- DB kurali: ALTER TABLE yerine SQL seed dosyalari guncellenir ve db:seed calistirilir

## Paketler

| Dizin | Paket adi | Amac |
|-------|-----------|------|
| core | @goldmood/core | Frontend API katmani (endpoint, service, type, i18n) |
| shared-backend | @goldmood/shared-backend | Ortak Fastify plugin/middleware/moduller |
| shared-types | @goldmood/shared-types | Ortak TypeScript tipleri |
| shared-config | @goldmood/shared-config | TS config ve tasarim tokenlari |
| shared-ui | @goldmood/shared-ui | Admin/public ortak React UI bilesenleri |

## Dizin Yapisi

```
packages/
├── core/
│   └── src/
│       ├── endpoints/
│       ├── i18n/
│       ├── lib/
│       ├── services/
│       └── types/
├── shared-backend/
│   ├── core/
│   ├── db/
│   ├── middleware/
│   ├── modules/        # shared moduller (auth, bookings, orders, review, vb.)
│   └── plugins/
├── shared-types/
├── shared-config/
└── shared-ui/
    ├── admin/
    └── public/
```

## shared-backend ve Proje-Ozel Moduller

`packages/shared-backend` icindeki moduller tum projede tekrar kullanilir.
GoldMoodAstro'ya ozel moduller ise `backend/src/modules/` altinda tutulur.

GoldMoodAstro ozel moduller (AGENTS.md):

- consultants
- agora
- firebase

Route kaydi kurali:

- shared route kaydi: `backend/src/routes/shared.ts`
- proje ozel route kaydi: `backend/src/routes/goldmood.ts`

## Modul Pattern'i (Backend)

Hem shared hem proje-ozel backend modulleri su yapida olmalidir:

```
schema.ts
router.ts
admin.routes.ts
controller.ts
repository.ts
validation.ts
index.ts
```

## Veritabani ve Seed Notlari

AGENTS.md'ye gore SQL dosyalari `backend/src/db/sql/` altinda tutulur ve GoldMoodAstro akisi bu dosyalarla yonetilir.

Kritik notlar:

- users, consultants, bookings, orders, voice_sessions gibi cekirdek tablolar seed tarafinda tanimlanir
- Yeni modullerde id tipi CHAR(36) UUID pattern'i ile ilerler
- Degisiklik sonrasi root'tan `bun run db:seed` calistirilir

## Kim Nerede Kullanir?

- Backend uygulamasi (`backend/`) en yogun sekilde `@goldmood/shared-backend` ve `@goldmood/shared-types` kullanir
- Admin panel (`admin_panel/`) `@goldmood/core`, `@goldmood/shared-ui`, `@goldmood/shared-config` kullanir
- Mobile uygulama (`mobile/`, olusacak) API kontrati ve tipler icin `@goldmood` paketlerinden faydalanir

## Kisa Ozet

Bu klasor tek bir projeye hizmet eder: GoldMoodAstro.
Eski coklu-repo veya `@vps/*` referanslari gecersizdir.
Tum yeni islerde `@goldmood/*` namespace'i kullanilmalidir.
