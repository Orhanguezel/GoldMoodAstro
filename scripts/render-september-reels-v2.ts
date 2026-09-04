#!/usr/bin/env bun
/**
 * Eylül 2026 REEL taslakları — 4 adet (11/19/26/29, haftada 1 slot).
 * Kapak = onaylı story v2 düzeni; video = 8sn zoompan MP4 (ffmpeg).
 * DB'ye yazmaz; manifest tmp/reel-v2-drafts.json. Taslak yazımı Tanitio'ya ayrı adım.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { reel, type ContentRenderContext } from "./prepare-august-2026-week1-extra-drafts";
import { specs } from "./prepare-september-2026-social-drafts";
import { getDaySky, houseMapByRising, MOON_PHASE_TR, SIGN_TR, describeDaySky } from "../packages/shared-backend/modules/astrology/daySky";

const ROOT = process.cwd();
const SITE = "https://goldmoodastro.com";
const TAGS = "#goldmoodastro #astroloji #reels #yukselenburc #kisiselfarkindalik";
const DAYS = [11, 19, 26, 29];
const CONTEXT: ContentRenderContext = {
  yearMonth: "2026-09",
  sourcePrefix: "gm-reel-v2",
  outDir: path.resolve(ROOT, "backend/uploads/social/september-2026-v2"),
  publicDir: `${SITE}/uploads/social/september-2026-v2`,
  notesLabel: "Eylül 2026 reel taslakları (v2 kapak + zoompan)",
};
process.env.FORCE_REGEN = "1";

async function lunationBlock(date: string) {
  const sky = await getDaySky(date);
  const rows = houseMapByRising(sky.moon.sign).map(
    (row) => `• ${row.risingSigns.map((sign) => SIGN_TR[sign]).join(", ")} yükselen → ${row.house}. ev: ${row.area}`,
  );
  return [`🌙 ${MOON_PHASE_TR[sky.moonPhase]} • ${SIGN_TR[sky.moon.sign]} ${sky.moon.degree.toFixed(0)}° (${date})`, "", "Yükselenine göre ev dağılımı:", ...rows].join("\n");
}

function utm(url: string, content: string) {
  const u = new URL(url);
  u.searchParams.set("utm_source", "instagram");
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", "gm-2026m09");
  u.searchParams.set("utm_content", `reel-${content}`);
  return u.toString();
}

const out: Array<{ day: number; slug: string; title: string; postType: string; imageUrl: string; videoUrl: string; caption: string }> = [];
for (const day of DAYS) {
  const spec = specs.find((s) => s.day === day)!;
  const sky = spec.lunationDate ? `\n\n${await lunationBlock(spec.lunationDate)}` : spec.skyDate ? `\n\n🔭 Motor çıktısı: ${describeDaySky(await getDaySky(spec.skyDate))} (${spec.skyDate})` : "";
  const caption = `${spec.title} ✨\n\n${spec.body}${sky}\n\n${spec.cta}\n\n🔗 ${utm(spec.url, spec.slug)}\n\n${TAGS}`;
  const post = await reel(spec.day, spec.slug, spec.title, {
    title: spec.title,
    kicker: "REEL • EYLÜL 2026",
    subtitle: spec.subtitle,
    footer: spec.cta,
    asset: spec.asset,
    variant: spec.campaign ? "gold" : "violet",
  }, caption, CONTEXT);
  out.push({
    day, slug: spec.slug, title: spec.title, postType: spec.campaign ? "kampanya" : "etkilesim",
    imageUrl: post.imageUrl!, videoUrl: post.mediaUrls![0]!, caption,
  });
  console.log(`[ok] ${day} ${spec.slug}`);
}
await fs.writeFile(path.resolve(ROOT, "tmp/reel-v2-drafts.json"), JSON.stringify(out, null, 2));
console.log(`Hazır: ${out.length} reel · manifest tmp/reel-v2-drafts.json`);
