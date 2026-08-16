// =============================================================
// FILE: backend/scripts/apply-currency-migration.ts
//
// TL → EUR para birimi dönüşümünü CANLI veritabanına uygular.
// Toplu para değeri değişikliği olduğu için bu adımı bilerek İNSAN çalıştırır.
//
// Kullanım (yerelden):
//   bun run scripts/apply-currency-migration.ts --dry-run   # önce bunu çalıştır
//   bun run scripts/apply-currency-migration.ts --apply
//
// Ne yapar (242_currency_try_to_eur_migrate.sql):
//   1. Tüm eski değerleri currency_migration_backup tablosuna yazar (geri alınabilir)
//   2. Fiyatları 1 EUR = 55.415 TRY kuruyla çevirip en yakın 0,50 EUR'ya yuvarlar
//   3. Cüzdan/defter tutarlarını kuruşuna kadar çevirir (borç yuvarlanmaz)
//   4. Kolon varsayılanlarını EUR yapar, platform_currency ayarını yazar
//
// Dokunmadıkları: ödenmiş sipariş/ödeme geçmişi (gerçekten TL tahsil edildi),
// user_credits ('TRY-CREDIT' kredi birimidir, para değil).
//
// İdempotent: currency_migration_backup doluysa dönüşüm İKİNCİ KEZ ÇALIŞMAZ.
// =============================================================
import { readFileSync } from 'fs';
import { join } from 'path';

const API = process.env.GOLDMOOD_API || 'https://goldmoodastro.com/api';
const EMAIL = process.env.GOLDMOOD_ADMIN_EMAIL || 'admin@goldmoodastro.com';
const PASSWORD = process.env.GOLDMOOD_ADMIN_PASSWORD || '';

const apply = process.argv.includes('--apply');
const dryRun = !apply;

if (!PASSWORD) {
  console.error('GOLDMOOD_ADMIN_PASSWORD tanımlı değil.');
  console.error('Örnek: GOLDMOOD_ADMIN_PASSWORD=... bun run scripts/apply-currency-migration.ts --dry-run');
  process.exit(1);
}

const sqlPath = join(import.meta.dir, '../src/db/sql/242_currency_try_to_eur_migrate.sql');
const sqlText = readFileSync(sqlPath, 'utf8');

// ALTER örtük COMMIT yapar → veri ve şema kısımları AYRI istek olarak gider,
// böylece veri kısmı gerçekten transaction içinde kalır.
const statements = sqlText.split(';').map((s) => s.trim()).filter(Boolean);
const dataPart = statements.filter((s) => !s.toUpperCase().startsWith('ALTER'));
const alterPart = statements.filter((s) => s.toUpperCase().startsWith('ALTER'));

async function login(): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const body = (await res.json()) as any;
  const token = body?.access_token;
  if (!token) throw new Error(`giriş başarısız: ${JSON.stringify(body).slice(0, 200)}`);
  return token;
}

async function runSql(token: string, sql: string, label: string, isDry: boolean) {
  const res = await fetch(`${API}/admin/db/import-sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sql, dryRun: isDry }),
  });
  const body = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || body?.ok === false) {
    throw new Error(`${label} başarısız: ${body?.error || res.status}`);
  }
  console.log(`  ✓ ${label}${isDry ? ' (dry-run)' : ''}`);
}

const token = await login();
console.log(`API: ${API}`);
console.log(dryRun ? 'MOD: dry-run (hiçbir şey kalıcı yazılmaz)' : 'MOD: APPLY (canlı veri değişecek)');

console.log('\n1) Veri dönüşümü (yedek + fiyat/bakiye çevrimi + ayar)');
await runSql(token, dataPart.join(';\n') + ';', 'veri', dryRun);

console.log('2) Kolon varsayılanları (ALTER)');
if (dryRun) {
  console.log('  … dry-run: ALTER MySQL\'de geri alınamaz, bu adım atlandı');
} else {
  await runSql(token, alterPart.join(';\n') + ';', 'şema', false);
}

console.log('\nBitti.');
if (dryRun) {
  console.log('Gerçekten uygulamak için: --apply');
} else {
  console.log('Doğrulama: https://goldmoodastro.com/tr/danismanlar fiyatları € görmeli.');
  console.log('Geri alma gerekirse: currency_migration_backup tablosundaki eski değerler yerine yazılır.');
}
process.exit(0);
