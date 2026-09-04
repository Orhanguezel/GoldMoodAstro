#!/usr/bin/env bun
/**
 * Eylül 2026 STORY taslakları — v2 şablonuyla üretim (5–30 Eylül, 26 adet).
 *
 * Kompozisyon (2026-09-04 onaylı): başlık + alt başlık + CTA pill; gövde YOK.
 * DB'ye YAZMAZ — çıktı: PNG'ler (uploads/social/september-2026-v2) + manifest
 * (tmp/story-v2-drafts.json). Taslak yazımı Tanitio tarafında ayrı adımdır
 * (takeover kuralı: sosyal yayın tek kaynağı Tanitio, goldmood DB'sine post yazılmaz).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { story, type ContentRenderContext } from "./prepare-august-2026-week1-extra-drafts";
import { specs } from "./prepare-september-2026-social-drafts";

const ROOT = process.cwd();
const SITE = "https://goldmoodastro.com";
const TAGS = "#goldmoodastro #astroloji #yukselenburc #ruyatabiri #numeroloji #kisiselfarkindalik";
const CONTEXT: ContentRenderContext = {
  yearMonth: "2026-09",
  sourcePrefix: "gm-story-v2",
  outDir: path.resolve(ROOT, "backend/uploads/social/september-2026-v2"),
  publicDir: `${SITE}/uploads/social/september-2026-v2`,
  notesLabel: "Eylül 2026 story taslakları (v2 şablon)",
};

process.env.FORCE_REGEN = "1";

const out: Array<{ day: number; slug: string; title: string; caption: string; imageUrl: string; sourceRef: string }> = [];
for (const spec of specs) {
  if (spec.day < 5) continue;
  const post = await story(spec.day, spec.slug, spec.title, {
    title: spec.title,
    kicker: "EYLÜL 2026",
    subtitle: spec.subtitle,
    footer: spec.cta,
    asset: spec.asset,
    variant: spec.campaign ? "gold" : "deep",
  }, CONTEXT);
  out.push({
    day: spec.day,
    slug: spec.slug,
    title: spec.title,
    caption: `${spec.title}\n\n${spec.cta}\n\n🔗 ${spec.url}\n\n${TAGS}`,
    imageUrl: post.imageUrl!,
    sourceRef: post.sourceRef,
  });
  console.log(`[ok] ${spec.day} ${spec.slug}`);
}
await fs.mkdir(path.resolve(ROOT, "tmp"), { recursive: true });
await fs.writeFile(path.resolve(ROOT, "tmp/story-v2-drafts.json"), JSON.stringify(out, null, 2));
console.log(`Hazır: ${out.length} story · manifest tmp/story-v2-drafts.json`);
