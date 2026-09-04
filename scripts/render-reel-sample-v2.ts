#!/usr/bin/env bun
/** Reel v2 ÖRNEĞİ (onay için) — 19 Eylül "Retro Ne Demek?" kapak + 8sn zoompan MP4. DB'ye yazmaz. */
import path from "node:path";
import { reel, type ContentRenderContext } from "./prepare-august-2026-week1-extra-drafts";
import { specs } from "./prepare-september-2026-social-drafts";

const ROOT = process.cwd();
const CONTEXT: ContentRenderContext = {
  yearMonth: "2026-09",
  sourcePrefix: "reel-v2-sample",
  outDir: path.resolve(ROOT, "tmp/reel-v2-samples"),
  publicDir: "file://" + path.resolve(ROOT, "tmp/reel-v2-samples"),
  notesLabel: "Reel v2 örneği (onay bekliyor)",
};
process.env.FORCE_REGEN = "1";

const spec = specs.find((s) => s.day === 19)!;
const post = await reel(spec.day, `sample-${spec.slug}`, spec.title, {
  title: spec.title,
  kicker: "REEL • EYLÜL 2026",
  subtitle: spec.subtitle,
  footer: spec.cta,
  asset: spec.asset,
  variant: "violet",
}, "örnek", CONTEXT);
console.log("kapak:", post.imageUrl);
console.log("video:", post.mediaUrls?.[0]);
