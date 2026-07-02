import { writeFileSync } from 'node:fs';

import { LANDING_CONTENT, type LandingKey, type LandingLocale } from '../../frontend/src/components/seo/seo-landing-content';

const keys: LandingKey[] = [
  'kahve-fali',
  'ruya-tabiri',
  'birth-chart',
  'numeroloji',
  'yildizname',
  'tarot',
  'sinastri',
  'pricing',
];
const locales: LandingLocale[] = ['tr', 'en', 'de'];

const slugs: Record<LandingKey, Record<LandingLocale, string>> = {
  'kahve-fali': { tr: 'kahve-fali', en: 'coffee-reading', de: 'kaffeesatzlesen' },
  'ruya-tabiri': { tr: 'ruya-tabiri', en: 'dream-interpretation', de: 'traumdeutung' },
  'birth-chart': { tr: 'dogum-haritasi', en: 'birth-chart', de: 'geburtshoroskop' },
  numeroloji: { tr: 'numeroloji', en: 'numerology', de: 'numerologie' },
  yildizname: { tr: 'yildizname', en: 'yildizname', de: 'yildizname' },
  tarot: { tr: 'tarot', en: 'tarot', de: 'tarot' },
  sinastri: { tr: 'sinastri', en: 'synastry', de: 'synastrie' },
  pricing: { tr: 'fiyatlandirma', en: 'pricing', de: 'preise' },
};

const tags: Record<LandingKey, string> = {
  'kahve-fali': 'kahve fali,coffee reading,sembolizm',
  'ruya-tabiri': 'ruya tabiri,dream interpretation,sembolizm',
  'birth-chart': 'dogum haritasi,birth chart,astroloji',
  numeroloji: 'numeroloji,numerology,kisisel donguler',
  yildizname: 'yildizname,ebced,sembolik rehberlik',
  tarot: 'tarot,tarot fali,kart anlamlari',
  sinastri: 'sinastri,synastry,iliski astrolojisi',
  pricing: 'fiyatlandirma,pricing,seans ucretleri',
};

function esc(value: unknown): string {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "''");
}

function sqlStr(value: unknown): string {
  return value == null ? 'NULL' : `'${esc(value)}'`;
}

function idFor(index: number): string {
  return `9100000${index + 1}-0000-4000-8000-00000000000${index + 1}`;
}

function i18nIdFor(index: number, locale: LandingLocale): string {
  const n = String(index + 1).padStart(2, '0');
  const loc = locale.slice(0, 2);
  return `91${loc}${n}00-0000-4000-8000-0000000000${n}`;
}

function htmlFrom(key: LandingKey, locale: LandingLocale): string {
  const data = LANDING_CONTENT[key][locale] || LANDING_CONTENT[key].en || LANDING_CONTENT[key].tr;
  const parts = [`<h1>${data.title}</h1>`, `<p>${data.lead}</p>`, `<p>${data.summary}</p>`];

  for (const section of data.sections || []) {
    parts.push(`<h2>${section.title}</h2>`);
    for (const paragraph of section.paragraphs || []) {
      parts.push(`<p>${paragraph}</p>`);
    }
  }

  if (data.faq?.length) {
    parts.push('<h2>FAQ</h2>');
    for (const item of data.faq) {
      parts.push(`<h3>${item.question}</h3><p>${item.answer}</p>`);
    }
  }

  const routeLocale = locale === 'de' ? 'de' : locale === 'en' ? 'en' : 'tr';
  if (locale === 'tr') {
    parts.push(
      '<h2>Sorumlu kullanım ve sonraki adımlar</h2>',
      '<p>Bu rehber, tek başına kesin karar verdirmek için değil, sorununuzu daha sakin ve anlaşılır hale getirmek için hazırlanır. İçerikteki semboller, kişisel deneyim ve güncel bağlamla birlikte okunmalıdır. Önemli bir karar, sağlık, hukuk, finans veya güvenlik konusu içeriyorsa profesyonel destek ve gerçek dünya bilgileri öncelikli olmalıdır.</p>',
      '<p>Okuma öncesinde bir ana soru, ilgili tarihler ve sizi en çok düşündüren duyguyu not etmek sonucu daha kullanışlı hale getirir. Okuma sonrasında ise en çok yankı uyandıran iki veya üç noktayı seçip bunları günlük hayatınızdaki somut adımlarla karşılaştırmak daha sağlıklı bir yaklaşım sunar.</p>',
      '<p>GoldMoodAstro editoryal yaklaşımı, ziyaretçiyi hızlı bir sonuca itmek yerine konuyu anlamaya davet eder. Bu nedenle her landing içeriğinde yöntemin sınırları, kullanıcının hazırlık süreci, yorumdan sonra yapılabilecek pratik değerlendirme ve danışman desteğinin hangi noktada anlamlı olabileceği açıkça anlatılır. Böylece sayfa yalnızca bir araç ekranı değil, kendi başına okunabilir bir rehber olur.</p>',
      '<p>İçeriği değerlendirirken kendinize üç soru sorabilirsiniz: Bu bilgi mevcut durumumu daha anlaşılır kılıyor mu, bana daha sakin bir sonraki adım gösteriyor mu, yoksa gereksiz bir kesinlik hissi mi yaratıyor? Faydalı manevi içerik ilk iki soruya hizmet eder. Belirsizlik varsa acele karar almak yerine not almak, bir süre beklemek ve gerekirse alanında deneyimli bir danışmandan ikinci bir bakış almak daha dengeli bir yoldur.</p>',
      '<p>Sayfada anlatılan yöntem, ilk kez gelen kullanıcı için temel kavramları açıklarken deneyimli kullanıcıya da hatırlatıcı bir çerçeve sunar. Konuyu yalnızca sonuç odaklı değil; hazırlık, yorumlama, sınır koyma, beklenti yönetimi ve sonraki adım açısından ele almak güveni artırır. Bu yaklaşım arama motorları için de daha kaliteli bir sinyal üretir; çünkü ziyaretçi sayfada gerçek açıklama, örnek bağlam ve kullanabileceği yönlendirme bulur.</p>',
      '<p>GoldMoodAstro’da landing içerikleri kısa tanıtım metni olarak bırakılmaz; her sayfa kullanıcının niyetini daha iyi adlandırmasına yardımcı olacak şekilde düzenlenir. Ziyaretçi önce yöntemin ne olduğunu, hangi bilgiyle daha iyi çalıştığını, yorumun sınırlarını ve ne tür sorular için daha uygun olduğunu görür. Ardından bu bilgiyi kendi bağlamına nasıl taşıyabileceğini, hangi durumda danışman desteği almanın anlamlı olacağını ve yorumdan sonra hangi pratik notları tutabileceğini öğrenir. Bu katmanlı yapı hem kullanıcı deneyimini hem SEO kalitesini güçlendirir.</p>',
      '<p>İçeriklerin amacı korku, acele ya da bağımlılık yaratmak değil; ziyaretçinin kendi sezgisiyle daha açık bir ilişki kurmasına destek olmaktır. Bu nedenle metinlerde mutlak gelecek iddiası, tıbbi/hukuki/finansal yönlendirme veya danışmanı tek karar kaynağı gibi gösteren ifadelerden kaçınılır. Bunun yerine sembollerin olası anlamları, hazırlık önerileri, güvenli beklenti yönetimi ve okuma sonrası değerlendirilebilecek yumuşak aksiyonlar anlatılır.</p>',
      `<p>Daha derin bir yorum için <a href="/${routeLocale}/consultants">danışmanları inceleyebilir</a> veya ilgili konularda <a href="/${routeLocale}/blog">blog rehberlerini okuyabilirsiniz</a>.</p>`,
    );
  } else if (locale === 'de') {
    parts.push(
      '<h2>Verantwortungsvolle Nutzung und nächste Schritte</h2>',
      '<p>Dieser Leitfaden ist nicht dazu gedacht, allein endgültige Entscheidungen zu treffen. Er soll helfen, eine Frage ruhiger und verständlicher zu betrachten. Symbole sollten immer gemeinsam mit persönlicher Erfahrung und aktuellem Kontext gelesen werden. Bei Gesundheit, Recht, Finanzen oder Sicherheit haben professionelle Unterstützung und reale Informationen Vorrang.</p>',
      '<p>Vor einer Lesung helfen eine Hauptfrage, relevante Daten und das wichtigste Gefühl, das Thema klarer zu machen. Nach der Lesung ist es sinnvoll, zwei oder drei Punkte auszuwählen, die wirklich Resonanz erzeugen, und sie mit konkreten Schritten im Alltag zu vergleichen.</p>',
      '<p>Der redaktionelle Ansatz von GoldMoodAstro lädt dazu ein, ein Thema zu verstehen, statt vorschnell ein endgültiges Ergebnis zu erwarten. Deshalb erklärt jede Landing-Seite die Grenzen der Methode, die Vorbereitung der Nutzerinnen und Nutzer, eine praktische Auswertung nach der Deutung und den Moment, in dem eine menschliche Beratung hilfreich sein kann. So ist die Seite nicht nur ein Werkzeug, sondern ein eigenständig lesbarer Leitfaden.</p>',
      '<p>Beim Lesen können drei Fragen helfen: Macht diese Information meine Situation verständlicher, zeigt sie einen ruhigeren nächsten Schritt, oder erzeugt sie unnötige Gewissheit? Nützliche spirituelle Inhalte dienen den ersten beiden Fragen. Wenn Unsicherheit bleibt, sind Notizen, etwas Abstand und bei Bedarf eine zweite Perspektive durch erfahrene Beratung oft ausgewogener als eine schnelle Entscheidung.</p>',
      '<p>Die beschriebene Methode erklärt grundlegende Begriffe für neue Besucherinnen und Besucher und bietet erfahrenen Nutzerinnen und Nutzern zugleich einen klaren Rahmen. Ein Thema nicht nur vom Ergebnis her zu betrachten, sondern auch über Vorbereitung, Deutung, Grenzen, Erwartungen und nächste Schritte, stärkt Vertrauen. Auch für Suchqualität ist das hilfreich, weil die Seite echte Erklärung, Beispielkontext und sinnvolle Orientierung bietet.</p>',
      '<p>Landing-Inhalte bei GoldMoodAstro bleiben nicht bei einer kurzen Einführung stehen. Jede Seite ist so aufgebaut, dass Nutzerinnen und Nutzer ihre Absicht klarer benennen können. Sie erfahren zuerst, was die Methode ist, mit welchen Informationen sie besser funktioniert, wo ihre Grenzen liegen und für welche Fragen sie besonders geeignet ist. Danach wird erklärt, wie die Deutung in den eigenen Kontext übertragen werden kann, wann menschliche Beratung sinnvoll ist und welche praktischen Notizen nach der Lesung hilfreich sein können. Diese Struktur stärkt Nutzererlebnis und SEO-Qualität zugleich.</p>',
      '<p>Ziel der Inhalte ist nicht Angst, Eile oder Abhängigkeit, sondern eine klarere Beziehung zur eigenen Intuition. Deshalb vermeiden die Texte absolute Zukunftsbehauptungen, medizinische, rechtliche oder finanzielle Anweisungen und Formulierungen, die Beratung als einzige Entscheidungsquelle darstellen. Stattdessen beschreiben sie mögliche Bedeutungen von Symbolen, Vorbereitung, sichere Erwartungshaltung und sanfte nächste Schritte nach der Deutung.</p>',
      `<p>Für eine tiefere Deutung können Sie <a href="/${routeLocale}/consultants">Beraterinnen und Berater ansehen</a> oder weitere <a href="/${routeLocale}/blog">Blog-Leitfäden lesen</a>.</p>`,
    );
  } else {
    parts.push(
      '<h2>Responsible use and next steps</h2>',
      '<p>This guide is not designed to make final decisions on its own. It helps turn a question into calmer, clearer language. Symbols should be read together with personal experience and current context. If the topic involves health, law, money or safety, professional support and real-world information should come first.</p>',
      '<p>Before a reading, write one main question, relevant dates and the feeling that most strongly surrounds the topic. After the reading, choose two or three points that truly resonate and compare them with practical steps in daily life. This keeps spiritual guidance reflective instead of absolute.</p>',
      '<p>GoldMoodAstro editorial content invites visitors to understand a topic rather than rush toward a final answer. That is why each landing page explains the limits of the method, how to prepare, how to review the interpretation afterward and when a human consultant may add useful nuance. The page should work as a readable guide, not only as a thin tool screen.</p>',
      '<p>While reading, ask three questions: does this information make my situation clearer, does it suggest a calmer next step, or does it create unnecessary certainty? Helpful spiritual content serves the first two questions. If uncertainty remains, taking notes, pausing and asking an experienced consultant for a second perspective is often healthier than forcing a quick decision.</p>',
      '<p>The method described on this page explains core concepts for first-time visitors while giving experienced users a clear frame to return to. Looking at a topic through preparation, interpretation, boundaries, expectation management and next steps builds more trust than focusing only on the result. It also creates a stronger quality signal for search because the visitor finds real explanation, example context and useful paths forward.</p>',
      '<p>GoldMoodAstro landing content is not left as a short promotional introduction. Each page is structured to help visitors name their intention more clearly. A reader first learns what the method is, what information makes it work better, where its limits are and which kinds of questions it supports best. Then the guide explains how to bring the interpretation back into personal context, when a human consultant can add nuance and which practical notes may be useful after the reading. This layered structure improves both user experience and search quality.</p>',
      '<p>The purpose of the content is not to create fear, urgency or dependency. It is to support a clearer relationship with intuition and reflection. For that reason, the text avoids absolute future claims, medical, legal or financial direction and language that frames a consultant as the only source of decision-making. Instead, it explains possible symbol meanings, preparation, healthy expectation management and gentle actions to consider after the interpretation.</p>',
      `<p>For deeper guidance, you can <a href="/${routeLocale}/consultants">explore consultants</a> or continue with related <a href="/${routeLocale}/blog">blog guides</a>.</p>`,
    );
  }

  return parts.join('');
}

function metaTitle(data: { title: string }): string {
  const value = `${data.title} | GoldMoodAstro Rehberi`;
  return value.length <= 60 ? value : data.title.slice(0, 57).trim();
}

function metaDescription(data: { description: string; summary: string }): string {
  const base = `${data.description} ${data.summary}`.replace(/\s+/g, ' ').trim();
  if (base.length >= 120 && base.length <= 160) return base;
  if (base.length > 160) return base.slice(0, 157).replace(/\s+\S*$/, '') + '...';
  return `${base} GoldMoodAstro ile sorumlu, çok dilli ve uygulanabilir rehberlik alın.`.slice(0, 160);
}

let sql = `-- =============================================================
-- FILE: 219_landing_pages_seed.sql
-- Landing pages moved into custom_pages (module_key='landing')
-- Source: frontend/src/components/seo/seo-landing-content.ts
-- =============================================================

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'custom_pages' AND COLUMN_NAME = 'landing_key');
SET @sql := IF(@col = 0, 'ALTER TABLE custom_pages ADD COLUMN landing_key VARCHAR(40) NULL AFTER module_key', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'custom_pages' AND INDEX_NAME = 'custom_pages_landing_key_idx');
SET @sql := IF(@idx = 0, 'ALTER TABLE custom_pages ADD INDEX custom_pages_landing_key_idx (landing_key)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

`;

sql += 'INSERT INTO custom_pages (id, module_key, landing_key, is_published, seo_index, featured, featured_image, display_order, order_num, image_url, created_at, updated_at) VALUES\n';
sql += keys
  .map((key, index) => {
    const data = LANDING_CONTENT[key].tr || LANDING_CONTENT[key].en;
    return `  (${sqlStr(idFor(index))}, 'landing', ${sqlStr(key)}, 1, 1, ${index < 3 ? 1 : 0}, ${sqlStr(data.image)}, ${300 + index}, ${300 + index}, ${sqlStr(data.image)}, NOW(3), NOW(3))`;
  })
  .join(',\n');
sql += '\nON DUPLICATE KEY UPDATE module_key = VALUES(module_key), landing_key = VALUES(landing_key), is_published = VALUES(is_published), seo_index = VALUES(seo_index), featured_image = VALUES(featured_image), image_url = VALUES(image_url), updated_at = NOW(3);\n\n';

sql += 'INSERT INTO custom_pages_i18n (id, custom_page_id, locale, title, slug, content, summary, featured_image_alt, meta_title, meta_description, tags, created_at, updated_at) VALUES\n';
sql += keys
  .flatMap((key, index) =>
    locales.map((locale) => {
      const data = LANDING_CONTENT[key][locale] || LANDING_CONTENT[key].en || LANDING_CONTENT[key].tr;
      return `  (${sqlStr(i18nIdFor(index, locale))}, ${sqlStr(idFor(index))}, ${sqlStr(locale)}, ${sqlStr(data.title)}, ${sqlStr(slugs[key][locale])}, ${sqlStr(JSON.stringify({ html: htmlFrom(key, locale) }))}, ${sqlStr(data.summary)}, ${sqlStr(`${data.title} hero image`)}, ${sqlStr(metaTitle(data))}, ${sqlStr(metaDescription(data))}, ${sqlStr(tags[key])}, NOW(3), NOW(3))`;
    }),
  )
  .join(',\n');
sql += '\nON DUPLICATE KEY UPDATE title = VALUES(title), slug = VALUES(slug), content = VALUES(content), summary = VALUES(summary), featured_image_alt = VALUES(featured_image_alt), meta_title = VALUES(meta_title), meta_description = VALUES(meta_description), tags = VALUES(tags), updated_at = NOW(3);\n';

writeFileSync('backend/src/db/sql/219_landing_pages_seed.sql', sql);
console.log('Generated backend/src/db/sql/219_landing_pages_seed.sql');
