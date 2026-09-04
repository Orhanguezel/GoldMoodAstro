#!/usr/bin/env bun
/** Feed/carousel v2 şablonu ÖRNEKLERİ (onay için) — DB'ye yazmaz. */
import path from "node:path";
import { carousel, type ContentRenderContext } from "./prepare-august-2026-week1-extra-drafts";
import { specs } from "./prepare-september-2026-social-drafts";

const ROOT = process.cwd();
const CONTEXT: ContentRenderContext = {
  yearMonth: "2026-09",
  sourcePrefix: "carousel-v2-sample",
  outDir: path.resolve(ROOT, "tmp/carousel-v2-samples"),
  publicDir: "file://" + path.resolve(ROOT, "tmp/carousel-v2-samples"),
  notesLabel: "Carousel v2 örnekleri (onay bekliyor)",
};
process.env.FORCE_REGEN = "1";

for (const day of [6, 15]) {
  const spec = specs.find((s) => s.day === day)!;
  await carousel(spec.day, `sample-${spec.slug}`, spec.title, [
    { title: spec.title, kicker: "EYLÜL 2026", subtitle: spec.subtitle, body: spec.body, asset: spec.asset, variant: spec.campaign ? "gold" : "deep", footer: spec.cta },
    { title: spec.secondTitle, kicker: "EYLÜL 2026", subtitle: spec.subtitle, body: spec.secondBody, asset: spec.secondAsset ?? spec.asset, variant: "gold", footer: spec.cta },
  ], "örnek", "etkilesim", CONTEXT);
  console.log("[ok]", day, spec.slug);
}
