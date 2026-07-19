-- =============================================================
-- 198c_consultant_agreement_v2_archive.sql
-- Danışman sözleşmesi v2 arşivi (%30 komisyon dönemi).
-- Aktif sözleşme cp-consultant-agreement (v3 / %40) olarak kalır.
-- Bu sayfa eski %30 komisyon metnini ALTER gerektirmeden saklar.
-- Yürürlük aralığı: 2026-06-20 → 2026-07-19.
-- =============================================================

INSERT INTO custom_pages (id, module_key, is_published, featured, display_order, order_num)
VALUES
  ('cp-consultant-agreement-v2', 'consultant_agreement_v2', 1, 0, 202, 202)
ON DUPLICATE KEY UPDATE
  module_key = VALUES(module_key),
  is_published = VALUES(is_published),
  display_order = VALUES(display_order),
  order_num = VALUES(order_num);

INSERT INTO custom_pages_i18n (
  id, custom_page_id, locale, title, slug, content, summary, meta_title, meta_description
) VALUES
  ('cpi-cagr-v2-tr', 'cp-consultant-agreement-v2', 'tr',
   'Danışman Sözleşmesi v2 (Arşiv)', 'danisman-sozlesmesi-v2',
   '{"html":"<h2>GoldMoodAstro Danışman Sözleşmesi v2 (Arşiv)</h2><p><strong>Yürürlük aralığı:</strong> 2026-06-20 — 2026-07-19</p><p>Bu arşiv metni, GoldMoodAstro platformunda danışman olarak hizmet sunan kişi (\"Danışman\") ile platform sahibi GoldMoodAstro (\"Platform\") arasında %30 komisyon döneminde kabul edilen sözleşme koşullarını saklar. Güncel sözleşme için <a href=\"/tr/danisman-sozlesmesi\">Danışman Sözleşmesi</a> sayfasına bakınız.</p><h3>1. Hizmet Tanımı</h3><p>Danışman; astroloji, doğum haritası, tarot, kahve falı, rüya tabiri ve onayladığı diğer uzmanlık alanlarında, platform üzerinden randevulu/sesli/görüntülü görüşmeler aracılığıyla danışanlara kişisel rehberlik hizmeti sunar. Hizmet tıbbi, hukuki ya da finansal tavsiye yerine geçmez.</p><h3>2. Komisyon ve Ödeme</h3><ul><li>Platform, danışmanın tamamladığı her seansın <strong>brüt tutarının %30’unu</strong> hizmet komisyonu olarak keser. Net hakediş = Brüt × (1 − 0,30) = Brüt × 0,70.</li><li>Komisyon oranı değiştiğinde danışmana en az 30 gün önceden e-posta ile bildirilir; değişikliği kabul etmeyen danışman sözleşmeyi feshedebilir.</li><li>Tamamlanmış seans hakedişleri <strong>7 günlük iade/uyuşmazlık (hold) süresi</strong> sonunda kullanılabilir bakiye durumuna geçer.</li><li>Danışman, kullanılabilir bakiyesinden <strong>takvim ayında bir kez</strong> ödeme talebi oluşturabilir. Onaylanan talepler <strong>3-5 iş günü</strong> içinde danışmanın IBAN’ına havale edilir.</li><li>Tek seferlik minimum çekim tutarı: <strong>100 TRY</strong>. Üst limit: 50.000 TRY.</li></ul><h3>3. KYC ve Yasal Kimlik</h3><p>Para çekimi için kimlik doğrulama (KYC) zorunludur. Bireysel danışmanlar için TC kimlik numarası + kimlik fotoğrafı; şirket danışmanlar için vergi numarası, vergi dairesi, vergi levhası + imza sirküleri talep edilir.</p><h3>4. Vergi ve Fatura</h3><p>Şirket danışmanlar her hakediş için platforma e-fatura/e-arşiv kesmekle yükümlüdür. Bireysel danışmanlar gelir vergisi beyanı ve stopaj yükümlülüklerinden kendileri sorumludur.</p><h3>5. Hesap Devri, KVKK ve Sorumluluk</h3><p>Danışman hesabı devredilemez. Danışan seans kayıtları, doğum verileri ve kişisel bilgiler yalnızca hizmet sunumu için kullanılır; üçüncü kişilerle paylaşılmaz. Platform aracıdır; danışmanlık içeriğinin doğruluğundan, sonucundan ve danışan memnuniyetinden danışman sorumludur.</p><h3>6. Fesih ve Yetki</h3><p>Taraflar yazılı bildirimle sözleşmeyi feshedebilir. Uyuşmazlıklarda İstanbul (Anadolu) Mahkemeleri ve İcra Daireleri yetkilidir.</p>"}',
   'GoldMoodAstro danışman sözleşmesi v2 arşiv metni: %30 komisyon, 7 gün hold ve aylık ödeme talebi akışı.',
   'Danışman Sözleşmesi v2 (Arşiv) — GoldMoodAstro',
   'GoldMoodAstro danışman sözleşmesi v2 arşivi: %30 komisyon ve aylık ödeme akışı.'),

  ('cpi-cagr-v2-en', 'cp-consultant-agreement-v2', 'en',
   'Consultant Agreement v2 (Archive)', 'consultant-agreement-v2',
   '{"html":"<h2>GoldMoodAstro Consultant Agreement v2 (Archive)</h2><p><strong>In force:</strong> 2026-06-20 — 2026-07-19</p><p>This archive preserves the consultant agreement terms accepted during the 30% commission period between the consultant providing services on GoldMoodAstro (\"Consultant\") and GoldMoodAstro (\"Platform\"). For the current terms see the <a href=\"/en/consultant-agreement\">Consultant Agreement</a> page.</p><h3>1. Service Definition</h3><p>The Consultant offers personal guidance to clients through scheduled audio/video sessions in approved areas of expertise. The service is not a substitute for medical, legal or financial advice.</p><h3>2. Commission and Payouts</h3><ul><li>The Platform deducts <strong>30%</strong> of every completed session gross amount as service commission. Net earnings = Gross × 0.70.</li><li>Any commission-rate change is communicated at least 30 days in advance by e-mail; a Consultant who does not accept the change may terminate the agreement.</li><li>Completed-session earnings become available after a <strong>7-day refund/dispute hold</strong>.</li><li>The Consultant may create <strong>one payout request per calendar month</strong> from available balance. Approved requests are transferred to the Consultant’s IBAN within <strong>3-5 business days</strong>.</li><li>Minimum single payout: <strong>100 TRY</strong>. Maximum: 50,000 TRY.</li></ul><h3>3. KYC, Taxes and Responsibility</h3><p>KYC is mandatory for withdrawals. Company consultants must issue invoices to the Platform for payouts. Individual consultants are responsible for their own tax declarations. The Platform is an intermediary; the Consultant is responsible for the consulting content and client satisfaction.</p>"}',
   'Archived v2 consultant agreement: 30% commission, 7-day hold and monthly payout request flow.',
   'Consultant Agreement v2 (Archive) — GoldMoodAstro',
   'GoldMoodAstro consultant agreement v2 archive with the previous 30% commission flow.'),

  ('cpi-cagr-v2-de', 'cp-consultant-agreement-v2', 'de',
   'Berater-Vereinbarung v2 (Archiv)', 'berater-vereinbarung-v2',
   '{"html":"<h2>GoldMoodAstro Berater-Vereinbarung v2 (Archiv)</h2><p><strong>Gültigkeitszeitraum:</strong> 20.06.2026 — 19.07.2026</p><p>Dieses Archiv bewahrt die Vertragsbedingungen, die während der 30 %-Provisionsphase zwischen der Beraterin/dem Berater und GoldMoodAstro (\"Plattform\") akzeptiert wurden. Aktuelle Fassung siehe <a href=\"/de/berater-vereinbarung\">Berater-Vereinbarung</a>.</p><h3>1. Dienstleistung</h3><p>Die Beraterin/der Berater bietet persönliche Beratung in genehmigten Fachgebieten über terminierte Audio-/Video-Sitzungen an. Die Dienstleistung ersetzt keine medizinische, rechtliche oder finanzielle Beratung.</p><h3>2. Provision und Auszahlung</h3><ul><li>Die Plattform behält <strong>30 %</strong> des Bruttobetrags jeder abgeschlossenen Sitzung als Servicegebühr ein. Netto-Einkommen = Brutto × 0,70.</li><li>Änderungen der Provisionsrate werden mindestens 30 Tage im Voraus per E-Mail mitgeteilt; bei Nicht-Zustimmung kann gekündigt werden.</li><li>Einnahmen werden nach <strong>7-tägiger Erstattungs-/Streit-Frist</strong> verfügbar.</li><li>Aus dem verfügbaren Guthaben kann <strong>einmal pro Kalendermonat</strong> eine Auszahlungsanforderung erstellt werden. Genehmigte Anforderungen werden innerhalb von <strong>3-5 Werktagen</strong> auf die IBAN überwiesen.</li><li>Mindestauszahlung: <strong>100 TRY</strong>. Höchstauszahlung: 50.000 TRY.</li></ul><h3>3. KYC, Steuern und Verantwortung</h3><p>KYC ist für Auszahlungen verpflichtend. Unternehmen stellen Rechnungen an die Plattform; Einzelpersonen sind für eigene Steuererklärungen verantwortlich. Die Plattform ist Vermittler; die Beraterin/der Berater ist für Inhalt und Zufriedenheit verantwortlich.</p>"}',
   'Archivierte v2 Berater-Vereinbarung: 30 % Provision, 7 Tage Hold und monatliche Auszahlungsanforderung.',
   'Berater-Vereinbarung v2 (Archiv) — GoldMoodAstro',
   'GoldMoodAstro Berater-Vereinbarung v2 Archiv mit vorherigem 30 % Provisionsablauf.')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  slug = VALUES(slug),
  content = VALUES(content),
  summary = VALUES(summary),
  meta_title = VALUES(meta_title),
  meta_description = VALUES(meta_description);
