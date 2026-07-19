-- =============================================================
-- 198b_consultant_agreement_v1_archive.sql
-- Danışman sözleşmesi v1 arşivi.
-- Aktif sözleşme cp-consultant-agreement (v3 / %40) olarak kalır.
-- %30 dönemi arşivi: 198c_consultant_agreement_v2_archive.sql
-- Bu sayfa eski %15 komisyon metnini ALTER gerektirmeden saklar.
-- =============================================================

INSERT INTO custom_pages (id, module_key, is_published, featured, display_order, order_num)
VALUES
  ('cp-consultant-agreement-v1', 'consultant_agreement_v1', 1, 0, 201, 201)
ON DUPLICATE KEY UPDATE
  module_key = VALUES(module_key),
  is_published = VALUES(is_published),
  display_order = VALUES(display_order),
  order_num = VALUES(order_num);

INSERT INTO custom_pages_i18n (
  id, custom_page_id, locale, title, slug, content, summary, meta_title, meta_description
) VALUES
  ('cpi-cagr-v1-tr', 'cp-consultant-agreement-v1', 'tr',
   'Danışman Sözleşmesi v1 (Arşiv)', 'danisman-sozlesmesi-v1',
   '{"html":"<h2>GoldMoodAstro Danışman Sözleşmesi v1 (Arşiv)</h2><p><strong>Yürürlük tarihi:</strong> 2026-05-20</p><p>Bu arşiv metni, GoldMoodAstro platformunda danışman olarak hizmet sunan kişi (\"Danışman\") ile platform sahibi GoldMoodAstro (\"Platform\") arasında kabul edilen önceki danışman sözleşmesi koşullarını saklar.</p><h3>1. Hizmet Tanımı</h3><p>Danışman; astroloji, doğum haritası, tarot, kahve falı, rüya tabiri ve onayladığı diğer uzmanlık alanlarında, platform üzerinden randevulu/sesli/görüntülü görüşmeler aracılığıyla danışanlara kişisel rehberlik hizmeti sunar. Hizmet tıbbi, hukuki ya da finansal tavsiye yerine geçmez.</p><h3>2. Komisyon ve Ödeme</h3><ul><li>Platform, danışmanın tamamladığı her seansın <strong>brüt tutarının %15’ini</strong> hizmet komisyonu olarak keser. Net hakediş = Brüt × (1 − 0,15) = Brüt × 0,85.</li><li>Komisyon oranı değiştiğinde danışmana en az 30 gün önceden e-posta ile bildirilir; değişikliği kabul etmeyen danışman sözleşmeyi feshedebilir.</li><li>Tamamlanmış seans hakedişleri <strong>7 günlük iade/uyuşmazlık (hold) süresi</strong> sonunda kullanılabilir bakiye durumuna geçer.</li><li>Danışman, kullanılabilir bakiyesinden ödeme talebi oluşturabilir. Talep platform tarafından incelenir, onaylanırsa <strong>3-5 iş günü</strong> içinde danışmanın IBAN’ına havale edilir.</li><li>Tek seferlik minimum çekim tutarı: <strong>100 TRY</strong>. Üst limit: 50.000 TRY.</li></ul><h3>3. KYC ve Yasal Kimlik</h3><p>Para çekimi için kimlik doğrulama (KYC) zorunludur. Bireysel danışmanlar için TC kimlik numarası + kimlik fotoğrafı; şirket danışmanlar için vergi numarası, vergi dairesi, vergi levhası + imza sirküleri talep edilir.</p><h3>4. Vergi ve Fatura</h3><p>Şirket danışmanlar her hakediş için platforma e-fatura/e-arşiv kesmekle yükümlüdür. Bireysel danışmanlar gelir vergisi beyanı ve stopaj yükümlülüklerinden kendileri sorumludur.</p><h3>5. Hesap Devri, KVKK ve Sorumluluk</h3><p>Danışman hesabı devredilemez. Danışan seans kayıtları, doğum verileri ve kişisel bilgiler yalnızca hizmet sunumu için kullanılır; üçüncü kişilerle paylaşılmaz. Platform aracıdır; danışmanlık içeriğinin doğruluğundan, sonucundan ve danışan memnuniyetinden danışman sorumludur.</p><h3>6. Fesih ve Yetki</h3><p>Taraflar yazılı bildirimle sözleşmeyi feshedebilir. Uyuşmazlıklarda İstanbul (Anadolu) Mahkemeleri ve İcra Daireleri yetkilidir.</p>"}',
   'GoldMoodAstro danışman sözleşmesi v1 arşiv metni: %15 komisyon, 7 gün hold ve ödeme talebi akışı.',
   'Danışman Sözleşmesi v1 (Arşiv) — GoldMoodAstro',
   'GoldMoodAstro danışman sözleşmesi v1 arşivi: %15 komisyon ve eski ödeme akışı.'),

  ('cpi-cagr-v1-en', 'cp-consultant-agreement-v1', 'en',
   'Consultant Agreement v1 (Archive)', 'consultant-agreement-v1',
   '{"html":"<h2>GoldMoodAstro Consultant Agreement v1 (Archive)</h2><p><strong>Effective date:</strong> 2026-05-20</p><p>This archive preserves the previous consultant agreement accepted between the consultant providing services on GoldMoodAstro (\"Consultant\") and GoldMoodAstro (\"Platform\").</p><h3>1. Service Definition</h3><p>The Consultant offers personal guidance to clients through scheduled audio/video sessions in approved areas of expertise. The service is not a substitute for medical, legal or financial advice.</p><h3>2. Commission and Payouts</h3><ul><li>The Platform deducts <strong>15%</strong> of every completed session gross amount as service commission. Net earnings = Gross × 0.85.</li><li>Any commission-rate change is communicated at least 30 days in advance by e-mail; a Consultant who does not accept the change may terminate the agreement.</li><li>Completed-session earnings become available after a <strong>7-day refund/dispute hold</strong>.</li><li>The Consultant may create a payout request from available balance. Approved requests are transferred to the Consultant’s IBAN within <strong>3-5 business days</strong>.</li><li>Minimum single payout: <strong>100 TRY</strong>. Maximum: 50,000 TRY.</li></ul><h3>3. KYC, Taxes and Responsibility</h3><p>KYC is mandatory for withdrawals. Company consultants must issue invoices to the Platform for payouts. Individual consultants are responsible for their own tax declarations. The Platform is an intermediary; the Consultant is responsible for the consulting content and client satisfaction.</p>"}',
   'Archived v1 consultant agreement: 15% commission, 7-day hold and payout request flow.',
   'Consultant Agreement v1 (Archive) — GoldMoodAstro',
   'GoldMoodAstro consultant agreement v1 archive with the previous 15% commission flow.'),

  ('cpi-cagr-v1-de', 'cp-consultant-agreement-v1', 'de',
   'Berater-Vereinbarung v1 (Archiv)', 'berater-vereinbarung-v1',
   '{"html":"<h2>GoldMoodAstro Berater-Vereinbarung v1 (Archiv)</h2><p><strong>Inkrafttreten:</strong> 2026-05-20</p><p>Dieses Archiv bewahrt die vorherige Berater-Vereinbarung zwischen der Beraterin/dem Berater und GoldMoodAstro (\"Plattform\").</p><h3>1. Dienstleistung</h3><p>Die Beraterin/der Berater bietet persönliche Beratung in genehmigten Fachgebieten über terminierte Audio-/Video-Sitzungen an. Die Dienstleistung ersetzt keine medizinische, rechtliche oder finanzielle Beratung.</p><h3>2. Provision und Auszahlung</h3><ul><li>Die Plattform behält <strong>15 %</strong> des Bruttobetrags jeder abgeschlossenen Sitzung als Servicegebühr ein. Netto-Einkommen = Brutto × 0,85.</li><li>Änderungen der Provisionsrate werden mindestens 30 Tage im Voraus per E-Mail mitgeteilt; bei Nicht-Zustimmung kann gekündigt werden.</li><li>Einnahmen werden nach <strong>7-tägiger Erstattungs-/Streit-Frist</strong> verfügbar.</li><li>Aus dem verfügbaren Guthaben kann eine Auszahlungsanforderung erstellt werden. Genehmigte Anforderungen werden innerhalb von <strong>3-5 Werktagen</strong> auf die IBAN überwiesen.</li><li>Mindestauszahlung: <strong>100 TRY</strong>. Höchstauszahlung: 50.000 TRY.</li></ul><h3>3. KYC, Steuern und Verantwortung</h3><p>KYC ist für Auszahlungen verpflichtend. Unternehmen stellen Rechnungen an die Plattform; Einzelpersonen sind für eigene Steuererklärungen verantwortlich. Die Plattform ist Vermittler; die Beraterin/der Berater ist für Inhalt und Zufriedenheit verantwortlich.</p>"}',
   'Archivierte v1 Berater-Vereinbarung: 15 % Provision, 7 Tage Hold und Auszahlungsanforderung.',
   'Berater-Vereinbarung v1 (Archiv) — GoldMoodAstro',
   'GoldMoodAstro Berater-Vereinbarung v1 Archiv mit vorherigem 15 % Provisionsablauf.')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  slug = VALUES(slug),
  content = VALUES(content),
  summary = VALUES(summary),
  meta_title = VALUES(meta_title),
  meta_description = VALUES(meta_description);
