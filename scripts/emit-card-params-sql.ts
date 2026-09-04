#!/usr/bin/env bun
/**
 * KART PARAMETRELERİ GERİ-DOLDURMA (Tanitio FAZ C).
 *
 * Eylül taslakları görselleriyle birlikte üretildi ama kartın ŞABLON PARAMETRELERİ
 * (rozet/başlık/alt başlık/gövde/CTA/ton) hiçbir yerde saklanmadı — panelin kart
 * düzenleyicisi bunlara ihtiyaç duyuyor. Bu script parametreleri Eylül spec'lerinden
 * yeniden türetir ve Tanitio `social_posts.notes.cardParams` alanına yazan SQL üretir.
 *
 * DB'ye yazmaz; stdout'a SQL basar (uygulama kararı insanda).
 *   bun scripts/emit-card-params-sql.ts > /tmp/card-params.sql
 */
import { specs } from "./prepare-september-2026-social-drafts";

const BRAND = { name: "GoldMoodAstro", domain: "goldmoodastro.com", accent: "#F0D890" };
const SITE = "https://goldmoodastro.com";

/**
 * Kartın ortasındaki sanat eseri: spec'teki YEREL yol → public URL.
 * Bu olmadan panelden yeniden üretilen kart görselsiz çıkar (kompoze PNG'den
 * asset geri çıkarılamaz — bu yüzden parametreye yazılması şart).
 */
function assetUrl(localPath: string | undefined): string | undefined {
  if (!localPath) return undefined;
  const marker = "/backend/uploads/";
  const index = localPath.indexOf(marker);
  if (index === -1) return undefined;
  return `${SITE}/uploads/${localPath.slice(index + marker.length)}`;
}
const EXCLUDED_CAROUSEL = new Set([5, 12, 16, 20]); // burç odaklı günler üretilmedi

function sqlString(value: unknown): string {
  return `'${JSON.stringify(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

/** notes'u BOZMADAN cardParams ekler: JSON ise merge, değilse yeni nesne. */
function updateFor(sourceRef: string, params: unknown): string {
  return [
    `UPDATE social_posts SET notes = JSON_SET(`,
    `  CASE WHEN JSON_VALID(notes) THEN notes ELSE JSON_OBJECT('note', COALESCE(notes,'')) END,`,
    `  '$.cardParams', CAST(${sqlString(params)} AS JSON))`,
    `WHERE sub_type='goldmoodastro' AND source_ref='${sourceRef}';`,
  ].join("\n");
}

const lines: string[] = [
  "-- GoldMood Eylül taslakları: kart şablon parametreleri (Tanitio FAZ C kart düzenleyici için).",
  "-- Üretici: goldmoodastro/scripts/emit-card-params-sql.ts · idempotent (JSON_SET).",
  "",
];

let count = 0;
for (const spec of specs) {
  const code = String(spec.day).padStart(2, "0");

  // STORY (5–30 Eylül): başlık + alt başlık + CTA (gövdesiz onaylı kompozisyon)
  if (spec.day >= 5) {
    lines.push(updateFor(`gm-story-v2:${code}:story:${spec.slug}`, {
      template: "story",
      kicker: "EYLÜL 2026",
      title: spec.title,
      subtitle: spec.subtitle,
      body: "",
      cta: spec.cta,
      variant: spec.campaign ? "gold" : "deep",
      assetUrl: assetUrl(spec.asset),
      brand: BRAND,
    }));
    count++;
  }

  // CAROUSEL kapak karesi (6–30 Eylül, burç günleri hariç) — FB ve IG ayrı kayıt
  if (spec.day >= 6 && !EXCLUDED_CAROUSEL.has(spec.day)) {
    for (const platform of ["fb", "ig"] as const) {
      lines.push(updateFor(`gm-carousel-v2:${platform}:${code}:${spec.slug}`, {
        template: "feed",
        kicker: "EYLÜL 2026",
        title: spec.title,
        subtitle: spec.subtitle,
        body: spec.body,
        cta: spec.cta,
        variant: spec.campaign ? "gold" : "deep",
        assetUrl: assetUrl(spec.asset),
        brand: BRAND,
      }));
      count++;
    }
  }
}

lines.push("", `-- Toplam ${count} kayıt.`);
lines.push(`SELECT COUNT(*) AS card_params_dolu FROM social_posts WHERE sub_type='goldmoodastro' AND JSON_EXTRACT(notes,'$.cardParams') IS NOT NULL;`);
console.log(lines.join("\n"));
