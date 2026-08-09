#!/usr/bin/env bun
/**
 * Gökyüzü raporu — içerik planını GERÇEK efemerise karşı denetler.
 *
 * Kullanım:
 *   bun run scripts/sky-report.ts 2026-08-01 2026-08-31
 *   bun run scripts/sky-report.ts 2026-09-01 2026-09-30 --houses
 *
 * `--houses`: yeniay/dolunay günlerinde olayın 12 yükselen için hangi eve
 * düştüğünü de yazar (içerik metnini bundan türet).
 *
 * Neden: sosyal içerik metinleri elle yazılıyordu; "hangi yükselen hangi alanda"
 * gibi iddialar element gruplamasına dayanıyordu, hesaba değil. Bu rapor, plan
 * yazılmadan ÖNCE olguyu verir — metin olgudan türetilir, tersi değil.
 */
import {
  getDaySky,
  describeDaySky,
  houseMapByRising,
  MOON_PHASE_TR,
  SIGN_TR,
} from "../packages/shared-backend/modules/astrology/daySky";

function* dateRange(startStr: string, endStr: string): Generator<string> {
  const start = Date.parse(`${startStr}T00:00:00Z`);
  const end = Date.parse(`${endStr}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) throw new Error("Gecersiz tarih (YYYY-MM-DD)");
  for (let t = start; t <= end; t += 86_400_000) yield new Date(t).toISOString().slice(0, 10);
}

const args = process.argv.slice(2);
const withHouses = args.includes("--houses");
const [start, end = start] = args.filter((a) => !a.startsWith("--"));
if (!start) {
  console.error("Kullanim: bun run scripts/sky-report.ts <baslangic> [bitis] [--houses]");
  process.exit(1);
}

const highlights: string[] = [];

for (const date of dateRange(start, end!)) {
  const sky = await getDaySky(date);
  const mark = sky.moonPhaseExact ? "★" : " ";
  console.log(`${mark} ${date}  ${describeDaySky(sky)}`);

  if (sky.moonPhaseExact) {
    highlights.push(`${date}: ${MOON_PHASE_TR[sky.moonPhase]} — ${SIGN_TR[sky.moon.sign]} ${sky.moon.degree.toFixed(0)}°`);

    if (withHouses && (sky.moonPhase === "new" || sky.moonPhase === "full")) {
      console.log(`   ${MOON_PHASE_TR[sky.moonPhase]} ${SIGN_TR[sky.moon.sign]} — yükselene göre ev dağılımı:`);
      for (const row of houseMapByRising(sky.moon.sign)) {
        const signs = row.risingSigns.map((s) => SIGN_TR[s]).join(", ");
        console.log(`     ${String(row.house).padStart(2)}. ev (${row.area}) → ${signs} yükselen`);
      }
    }
  }
}

if (highlights.length) {
  console.log("\n=== Planın omurgası (tam fazlar) ===");
  for (const line of highlights) console.log("  " + line);
}
