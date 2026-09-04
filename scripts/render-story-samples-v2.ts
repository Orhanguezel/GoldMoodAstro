#!/usr/bin/env bun
/** Story v2 şablonu ÖRNEK üretimi (onay için) — DB'ye/manifeste yazmaz. */
import path from "node:path";
import { assets, story, type ContentRenderContext } from "./prepare-august-2026-week1-extra-drafts";

const ROOT = process.cwd();
const CONTEXT: ContentRenderContext = {
  yearMonth: "2026-09",
  sourcePrefix: "story-v2-sample",
  outDir: path.resolve(ROOT, "tmp/story-v2-samples"),
  publicDir: "file://" + path.resolve(ROOT, "tmp/story-v2-samples"),
  notesLabel: "Story v2 örnekleri (onay bekliyor)",
};
const dream = (slug: string) => path.resolve(ROOT, `backend/uploads/symbols/dream/${slug}.png`);

process.env.FORCE_REGEN = "1";

// 1) Kullanıcının şikâyet ettiği ay-sonu story'sinin YENİ halı (birebir karşılaştırma)
await story(30, "sample-august-review", "Ağustos Sana Ne Öğretti?", {
  title: "Ağustos Sana Ne Öğretti?",
  kicker: "AY SONU DEĞERLENDİRMESİ",
  body: "Ayın başındaki niyetine dön: ne başladı, ne değişti, neyi geride bıraktın?",
  footer: "İlk kelimeni yeniden seç",
  asset: dream("road"),
}, CONTEXT);

// 2) Eylül 3 — rüya sembolü story'si
await story(3, "sample-ruyada-kapi", "Rüyada Kapı Görmek", {
  title: "Rüyada Kapı Görmek",
  kicker: "RÜYA TABİRİ",
  subtitle: "Sözlükten sembol okuması",
  body: "Kapı açık mıydı, kapalı mıydı? Yorumu rüyanın bağlamıyla birlikte düşün.",
  footer: "Rüya sözlüğüne git",
  asset: dream("door"),
}, CONTEXT);

// 3) Eylül 2 — araç tanıtımı story'si (uzun başlık: küçük boy dalı test eder)
await story(2, "sample-yukselen", "Yükselen Burç Neyi Anlatır?", {
  title: "Yükselen Burç Neyi Anlatır?",
  kicker: "ÜCRETSİZ ARAÇ",
  body: "Doğum tarihi, saati ve yeriyle hesaplanır. Saat bilinmiyorsa sonuç yaklaşık kalır.",
  footer: "Yükselenini ücretsiz hesapla",
  asset: assets.natal,
}, CONTEXT);

console.log("ok: tmp/story-v2-samples");
