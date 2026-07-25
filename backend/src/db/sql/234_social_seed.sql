-- De-tenant sonrasi TEK proje satiri: goldmoodastro.
-- Marketing modulu ga4/gsc/ads/gtm kimliklerini bu satirdan okur.
-- Sayisal GA4 property ID ve Google Ads customer ID admin panelden (Ayarlar)
-- doldurulur; burada bilinen degerler (measurement id, gtm, site) set edilir.
-- INSERT IGNORE: idempotent, mevcut satiri EZMEZ (kullanici duzenlemeleri korunur).
INSERT IGNORE INTO social_projects
  (uuid, project_key, name, website_url, ga4_measurement_id, gtm_container_id, search_console_site_url, is_active)
VALUES
  (UUID(), 'goldmoodastro', 'GoldMoodAstro', 'https://goldmoodastro.com',
   'G-M8FPZB5FFC', 'GTM-WDQ822LF', 'sc-domain:goldmoodastro.com', 1);

-- Search Console DOMAIN property: site adresi sc-domain: formatinda olmali (URL-prefix degil).
-- Sistem alani (kullanici icerigi degil) — re-seed'de dogru degere cekilir.
UPDATE social_projects SET search_console_site_url = 'sc-domain:goldmoodastro.com'
WHERE project_key = 'goldmoodastro' AND (search_console_site_url IS NULL OR search_console_site_url LIKE 'http%');
