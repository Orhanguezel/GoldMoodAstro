# GSC izleme — SEO i18n URL migration H bloğu

Migration (commit `f1eabd3`, kabul `a2f5a1f`) sonrası Google sinyallerinin oturmasını
takip eder. Kod işi bitti; kalan tek şey **zamana bağlı** ölçüm.

## Otomatik toplama

Günlük `gsc-index-refresh` cron'u (02:30 UTC) her koşuda bir snapshot'ı
`backend/var/gsc-history.ndjson`'a ekler (append-only, git dışı). Yani veri elle
uğraşmadan birikir. Snapshot şunları içerir: 28g performans (tıklama/gösterim/CTR/
pozisyon, current vs previous + delta%) ve `gsc_url_index` verdict dağılımı
(indexed / not_indexed / issue / duplicateCanonical / totalUrls).

Elle snapshot:
```bash
cd backend && bun run scripts/gsc-snapshot.ts            # JSON stdout
cd backend && bun run scripts/gsc-snapshot.ts --append   # history'ye de ekle
```

## Baseline (Gün-0, 2026-07-31)

Bkz [day-00-baseline-2026-07-31.json](day-00-baseline-2026-07-31.json).
Özet: gösterim 665 (+164%), pozisyon 78.59 (82.32'den iyileşiyor), indexed 167,
duplicateCanonical 41, totalUrls 303.

## Karşılaştırma takvimi (checklist H)

| Gün | Tarih | Ölçüm |
|-----|-------|-------|
| 7   | 2026-08-07 | crawled/discovered/duplicate sayıları |
| 14  | 2026-08-14 | indeks + canonical değişimi (dupCanonical 41→? , totalUrls 303→?) |
| 28  | 2026-08-28 | gösterim, ort. pozisyon, CTR, indexed URL trendi |

Her ölçümde: prod'da snapshot al, Gün-0 baseline ile karşılaştır, bu klasöre
`day-NN-...json` olarak kaydet. Sinyaller stabil olunca (dupCanonical~0, totalUrls~159)
iç-link/backlink fazına geç (pozisyon 5–17 sayfaları).

## Beklenen düzelme

- `totalUrls` 303 → ~159 (sitemap küçültüldü + ince sayfalar noindex)
- `duplicateCanonical` 41 → 0 (locale-aware canonical + /index.html tek-308)
- `not_indexed` 75 → düşüş (quarantine noindex'ler hariç)
- `impressions` artış, `position` düşüş (iyileşme)
