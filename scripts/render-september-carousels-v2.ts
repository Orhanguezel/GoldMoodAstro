#!/usr/bin/env bun
/**
 * Eylül 2026 CAROUSEL taslakları — v2 feed şablonuyla üretim.
 *
 * Kapsam: 6–30 Eylül; HARİÇ 5/12/16/20 (burç-uyumu ve burç-detay odaklı içerik —
 * 2026-09-04 "burçlar çıksın" kararına uygun; gerekirse tek tek geri eklenir).
 * Sembol anlamları canlı public API'den (auth yok), gökyüzü blokları daySky motorundan.
 * DB'ye YAZMAZ — çıktı: PNG çiftleri + manifest (tmp/carousel-v2-drafts.json).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { carousel, type ContentRenderContext, type Slide } from "./prepare-august-2026-week1-extra-drafts";
import { specs } from "./prepare-september-2026-social-drafts";
import { getDaySky, houseMapByRising, MOON_PHASE_TR, SIGN_TR, describeDaySky } from "../packages/shared-backend/modules/astrology/daySky";
import { findRiskyTopics } from "../packages/shared-backend/modules/_shared/contentModeration";

const ROOT = process.cwd();
const SITE = "https://goldmoodastro.com";
const TAGS = "#goldmoodastro #astroloji #yukselenburc #ruyatabiri #numeroloji #kisiselfarkindalik #tarot";
const EXCLUDED = new Set([5, 12, 16, 20]);
const CONTEXT: ContentRenderContext = {
  yearMonth: "2026-09",
  sourcePrefix: "gm-carousel-v2",
  outDir: path.resolve(ROOT, "backend/uploads/social/september-2026-v2"),
  publicDir: `${SITE}/uploads/social/september-2026-v2`,
  notesLabel: "Eylül 2026 carousel taslakları (v2 şablon)",
};
process.env.FORCE_REGEN = "1";

const symbolMeta: Record<string, Map<string, { name: string; meaning: string }>> = {};
async function symbols(set: "dream" | "coffee") {
  if (!symbolMeta[set]) {
    const api = set === "dream" ? "dreams" : "coffee";
    const res = await fetch(`${SITE}/api/${api}/symbols?locale=tr`);
    const rows = (await res.json()).data as Array<{ slug: string; name_tr: string; meaning: string }>;
    symbolMeta[set] = new Map(rows.map((r) => [r.slug, { name: r.name_tr, meaning: r.meaning }]));
  }
  return symbolMeta[set]!;
}

async function lunationBlock(date: string) {
  const sky = await getDaySky(date);
  const rows = houseMapByRising(sky.moon.sign).map(
    (row) => `• ${row.risingSigns.map((sign) => SIGN_TR[sign]).join(", ")} yükselen → ${row.house}. ev: ${row.area}`,
  );
  return [`🌙 ${MOON_PHASE_TR[sky.moonPhase]} • ${SIGN_TR[sky.moon.sign]} ${sky.moon.degree.toFixed(0)}° (${date})`, "", "Yükselenine göre ev dağılımı:", ...rows].join("\n");
}

function utm(url: string, platform: "facebook" | "instagram", content: string) {
  const u = new URL(url);
  u.searchParams.set("utm_source", platform);
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", "gm-2026m09");
  u.searchParams.set("utm_content", content);
  return u.toString();
}

const out: Array<{ day: number; slug: string; title: string; postType: string; mediaUrls: string[]; imageUrl: string; captions: { facebook: string; instagram: string } }> = [];
for (const spec of specs) {
  if (spec.day < 6 || EXCLUDED.has(spec.day)) continue;
  let body = spec.body;
  if (spec.symbols && spec.symbols.source !== "tarot") {
    const meta = await symbols(spec.symbols.source);
    body = spec.symbols.slugs.map((slug) => {
      const m = meta.get(slug);
      if (!m) throw new Error(`${spec.symbols!.source}/${slug} API sözlüğünde yok`);
      return `${m.name}: ${m.meaning.trim().replace(/\.$/, "")}.`;
    }).join(" ");
  }
  const sky = spec.lunationDate ? `\n\n${await lunationBlock(spec.lunationDate)}` : spec.skyDate ? `\n\n🔭 Motor çıktısı: ${describeDaySky(await getDaySky(spec.skyDate))} (${spec.skyDate})` : "";
  const baseCaption = (platform: "facebook" | "instagram") =>
    `${spec.title} ✨\n\n${body}${sky}\n\n${spec.cta}\n\n🔗 ${utm(spec.url, platform, spec.slug)}\n\n${TAGS}`;
  const risky = findRiskyTopics(`${baseCaption("instagram")}\n${spec.secondBody}`);
  if (risky.length) throw new Error(`${spec.day}/${spec.slug}: riskli içerik: ${JSON.stringify(risky)}`);

  const slides: Slide[] = [
    { title: spec.title, kicker: "EYLÜL 2026", subtitle: spec.subtitle, body, asset: spec.asset, variant: spec.campaign ? "gold" : "deep", footer: spec.cta },
    { title: spec.secondTitle, kicker: "EYLÜL 2026", body: spec.secondBody, asset: spec.secondAsset ?? spec.asset, variant: spec.campaign ? "violet" : "gold", footer: spec.cta },
  ];
  const post = await carousel(spec.day, spec.slug, spec.title, slides, baseCaption("instagram"), spec.campaign ? "kampanya" : "etkilesim", CONTEXT);
  out.push({
    day: spec.day, slug: spec.slug, title: spec.title, postType: spec.campaign ? "kampanya" : "etkilesim",
    mediaUrls: post.mediaUrls ?? [], imageUrl: post.imageUrl ?? post.mediaUrls?.[0] ?? "",
    captions: { facebook: baseCaption("facebook"), instagram: baseCaption("instagram") },
  });
  console.log(`[ok] ${spec.day} ${spec.slug} (${post.mediaUrls?.length} kare)`);
}
await fs.writeFile(path.resolve(ROOT, "tmp/carousel-v2-drafts.json"), JSON.stringify(out, null, 2));
console.log(`Hazır: ${out.length} carousel · manifest tmp/carousel-v2-drafts.json`);
