-- backend/src/db/sql/181_tarot_seed.sql
-- FAZ 21 — Tarot 22 Major Arcana + Sample Minor

INSERT INTO tarot_cards (id, slug, name_tr, arcana, suit, number, upright_meaning, reversed_meaning, keywords) VALUES
(UUID(), 'the-fool', 'Mecnun (Joker)', 'major', 'none', 0, 'Yeni başlangıçlar, masumiyet, macera, özgürlük, spontanlık.', 'Safdillik, pervasızlık, risk alma, kararsızlık.', '["başlangıç", "özgürlük", "risk"]'),
(UUID(), 'the-magician', 'Büyücü', 'major', 'none', 1, 'Yaratıcılık, beceri, odaklanma, tezahür ettirme, irade gücü.', 'Manipülasyon, zayıf planlama, kullanılmayan yetenekler.', '["irade", "yaratım", "beceri"]'),
(UUID(), 'the-high-priestess', 'Azize', 'major', 'none', 2, 'Sezgi, bilinçaltı, gizem, içsel ses, kutsal bilgi.', 'Gizli gündemler, sezgilerin bastırılması, yüzeysellik.', '["sezgi", "gizem", "bilinçaltı"]'),
(UUID(), 'the-empress', 'İmparatoriçe', 'major', 'none', 3, 'Bolluk, annelik, doğurganlık, doğa, besleyicilik, yaratıcılık.', 'Yaratıcı tıkanıklık, aşırı bağımlılık, boşluk hissi.', '["bolluk", "doğa", "yaratıcılık"]'),
(UUID(), 'the-emperor', 'İmparator', 'major', 'none', 4, 'Otorite, yapı, disiplin, kontrol, babalık, rasyonellik.', 'Tiranlık, katılık, disiplinsizlik, kontrol kaybı.', '["otorite", "disiplin", "yapı"]'),
(UUID(), 'the-hierophant', 'Aziz', 'major', 'none', 5, 'Gelenek, inanç, ruhsal rehberlik, toplumsal kurallar, eğitim.', 'İsyan, geleneklere karşı çıkma, kişisel inançlar, dogmatizm.', '["gelenek", "inanç", "rehberlik"]'),
(UUID(), 'the-lovers', 'Aşıklar', 'major', 'none', 6, 'Aşk, uyum, ilişkiler, değerler, seçimler, ortaklık.', 'Öz-sevgi eksikliği, uyumsuzluk, kötü seçimler, kopukluk.', '["aşk", "seçim", "uyum"]'),
(UUID(), 'the-chariot', 'Araba', 'major', 'none', 7, 'Zafer, irade, kararlılık, disiplin, başarı, kontrol.', 'Yönsüzlük, saldırganlık, kontrol kaybı, başarısızlık.', '["zafer", "irade", "başarı"]'),
(UUID(), 'strength', 'Güç', 'major', 'none', 8, 'İçsel güç, cesaret, şefkat, sabır, kontrol.', 'Kendine güvensizlik, zayıflık, korku, saldırganlık.', '["güç", "cesaret", "sabır"]'),
(UUID(), 'the-hermit', 'Ermiş', 'major', 'none', 9, 'İçe dönüş, yalnızlık, rehberlik, öz-arayış, bilgelik.', 'İzolasyon, yalnızlık korkusu, geri çekilme, asosyallik.', '["bilgelik", "yalnızlık", "arayış"]'),
(UUID(), 'wheel-of-fortune', 'Kader Çarkı', 'major', 'none', 10, 'Kader, değişim, şans, dönüm noktaları, döngüler.', 'Kötü şans, direnç, kontrol edilemeyen değişimler.', '["kader", "şans", "değişim"]'),
(UUID(), 'justice', 'Adalet', 'major', 'none', 11, 'Adalet, dürüstlük, gerçek, sebep-sonuç, sorumluluk.', 'Adaletsizlik, dürüst olmama, hesap vermekten kaçma.', '["adalet", "gerçek", "denge"]'),
(UUID(), 'the-hanged-man', 'Asılan Adam', 'major', 'none', 12, 'Teslimiyet, yeni bakış açısı, fedakarlık, duraklama.', 'Gecikme, direnç, boşuna fedakarlık, kararsızlık.', '["perspektif", "fedakarlık", "duraklama"]'),
(UUID(), 'death', 'Ölüm', 'major', 'none', 13, 'Sonlanma, dönüşüm, geçiş, yeni bir başlangıca yer açma.', 'Değişime direnç, durgunluk, geçmişe tutunma.', '["dönüşüm", "son", "geçiş"]'),
(UUID(), 'temperance', 'Denge', 'major', 'none', 14, 'Denge, sabır, uyum, ölçülülük, amaç bulma.', 'Dengesizlik, aşırılık, uyumsuzluk, acelecilik.', '["denge", "uyum", "ölçülülük"]'),
(UUID(), 'the-devil', 'Şeytan', 'major', 'none', 15, 'Bağımlılık, maddiyat, gölge benlik, kısıtlanma.', 'Kurtuluş, bağımsızlık, gölgelerle yüzleşme, farkındalık.', '["bağımlılık", "kısıtlanma", "maddiyat"]'),
(UUID(), 'the-tower', 'Yıkılan Kule', 'major', 'none', 16, 'Ani değişim, kaos, yıkım, uyanış, vahy.', 'Yıkımdan kaçınma, korku, felaketin gecikmesi.', '["yıkım", "uyanış", "kaos"]'),
(UUID(), 'the-star', 'Yıldız', 'major', 'none', 17, 'Umut, ilham, şifa, yenilenme, huzur.', 'Umutsuzluk, ilham eksikliği, inançsızlık.', '["umut", "şifa", "ilham"]'),
(UUID(), 'the-moon', 'Ay', 'major', 'none', 18, 'İllüzyon, korku, anksiyete, bilinçaltı, kafa karışıklığı.', 'Korkuların aşılması, netlik, gizli olanın açığa çıkması.', '["korku", "illüzyon", "bilinçaltı"]'),
(UUID(), 'the-sun', 'Güneş', 'major', 'none', 19, 'Mutluluk, başarı, canlılık, neşe, aydınlanma.', 'Geçici karamsarlık, aşırı iyimserlik, başarıda gecikme.', '["başarı", "neşe", "canlılık"]'),
(UUID(), 'judgement', 'Mahkeme', 'major', 'none', 20, 'Yüzleşme, uyanış, karar, affetme, yenilenme.', 'Kendini yargılama, kararsızlık, geçmişe takılma.', '["uyanış", "karar", "yüzleşme"]'),
(UUID(), 'the-world', 'Dünya', 'major', 'none', 21, 'Tamamlanma, başarı, seyahat, bütünlük, kutlama.', 'Yarım kalmış işler, gecikme, vizyon eksikliği.', '["tamamlanma", "bütünlük", "başarı"]');

-- ─── Minor Arcana — 4 takım × 14 kart = 56 (Ace + 2-10 + Page/Knight/Queen/King) ───
-- Aces (4)
INSERT INTO tarot_cards (id, slug, name_tr, arcana, suit, number, upright_meaning, reversed_meaning, keywords) VALUES
(UUID(), 'ace-of-cups', 'Kupa Ası', 'minor', 'cups', 1, 'Yeni duygusal başlangıç, aşk, mutluluk, sezgi.', 'Duygusal blokaj, bastırılmış duygular, ayrılık.', '["aşk", "duygu", "başlangıç"]'),
(UUID(), 'ace-of-swords', 'Kılıç Ası', 'minor', 'swords', 1, 'Zihinsel netlik, yeni fikir, zafer, dürüstlük.', 'Kafa karışıklığı, iletişim bozukluğu, adaletsizlik.', '["zihin", "fikir", "netlik"]'),
(UUID(), 'ace-of-wands', 'Değnek Ası', 'minor', 'wands', 1, 'İlham, yeni tutku, yaratıcılık, enerji.', 'Gecikme, motivasyon kaybı, yaratıcı tıkanıklık.', '["tutku", "ilham", "enerji"]'),
(UUID(), 'ace-of-pentacles', 'Tılsım Ası', 'minor', 'pentacles', 1, 'Yeni maddi fırsat, bolluk, pratiklik, başarı.', 'Maddi kayıp, zayıf planlama, açgözlülük.', '["para", "fırsat", "başarı"]');

-- ─── Cups (Kupalar) — duygu, ilişki, sezgi ─────────────────────────────────
INSERT INTO tarot_cards (id, slug, name_tr, arcana, suit, number, upright_meaning, reversed_meaning, keywords) VALUES
(UUID(), 'two-of-cups', 'Kupa İkilisi', 'minor', 'cups', 2, 'Karşılıklı sevgi, ortaklık, uyum, çekim, anlaşma.', 'Uyumsuzluk, küskünlük, dengesiz ilişki, ayrılık.', '["ortaklık","uyum","çekim"]'),
(UUID(), 'three-of-cups', 'Kupa Üçlüsü', 'minor', 'cups', 3, 'Dostluk, kutlama, topluluk, neşe, başarı paylaşımı.', 'Yalnızlık, dedikodu, sosyal kopukluk, abartı.', '["dostluk","kutlama","topluluk"]'),
(UUID(), 'four-of-cups', 'Kupa Dörtlüsü', 'minor', 'cups', 4, 'İçe dönüş, tatminsizlik, fırsatları görememek, durgunluk.', 'Yeni farkındalık, motivasyon, fırsatları kabul.', '["tatminsizlik","içe dönüş","fırsat"]'),
(UUID(), 'five-of-cups', 'Kupa Beşlisi', 'minor', 'cups', 5, 'Kayıp, hayal kırıklığı, üzüntü, geride kalanları görmemek.', 'Kabul, iyileşme, geride kalanı fark etme, umut.', '["kayıp","yas","kabul"]'),
(UUID(), 'six-of-cups', 'Kupa Altılısı', 'minor', 'cups', 6, 'Nostalji, çocukluk, masumiyet, geçmişten gelen iyilik.', 'Geçmişe takılma, olgunlaşma, bırakma.', '["nostalji","masumiyet","geçmiş"]'),
(UUID(), 'seven-of-cups', 'Kupa Yedilisi', 'minor', 'cups', 7, 'Hayaller, seçenekler, illüzyon, fantezi, kararsızlık.', 'Netlik, gerçeklere dönüş, odaklanma, seçim.', '["hayal","seçenek","illüzyon"]'),
(UUID(), 'eight-of-cups', 'Kupa Sekizlisi', 'minor', 'cups', 8, 'Bırakma, anlam arayışı, daha derin bir şeye yönelme, ayrılma.', 'Geçmişe dönüş, bırakamama, kararsız ayrılık.', '["bırakma","arayış","ayrılma"]'),
(UUID(), 'nine-of-cups', 'Kupa Dokuzlusu', 'minor', 'cups', 9, 'Dilek tutma kartı, tatmin, mutluluk, başarıya ulaşma.', 'Yüzeysel mutluluk, doyumsuzluk, kibir.', '["dilek","tatmin","mutluluk"]'),
(UUID(), 'ten-of-cups', 'Kupa Onlusu', 'minor', 'cups', 10, 'Ailevi mutluluk, uyum, duygusal tamamlanma, huzur.', 'Aile çatışması, uyumsuzluk, kopuk bağlar.', '["aile","mutluluk","uyum"]'),
(UUID(), 'page-of-cups', 'Kupa Prensi', 'minor', 'cups', 11, 'Yaratıcı haber, romantik teklif, sezgisel mesaj, hayalperest.', 'Duygusal olgunsuzluk, blokaj, kötü haber.', '["mesaj","romantizm","yaratıcılık"]'),
(UUID(), 'knight-of-cups', 'Kupa Şövalyesi', 'minor', 'cups', 12, 'Romantik teklif, idealizm, duygusal misyon, çekicilik.', 'Aldatıcı romantizm, pasif-agresiflik, kararsızlık.', '["romantizm","teklif","idealizm"]'),
(UUID(), 'queen-of-cups', 'Kupa Kraliçesi', 'minor', 'cups', 13, 'Şefkat, sezgisellik, duygusal olgunluk, empati.', 'Aşırı duygusallık, manipülasyon, bağımlılık.', '["şefkat","sezgi","empati"]'),
(UUID(), 'king-of-cups', 'Kupa Kralı', 'minor', 'cups', 14, 'Duygusal denge, bilgelik, diplomasi, sakin liderlik.', 'Pasif-agresif, duygusal manipülasyon, kontrolsüzlük.', '["denge","bilgelik","diplomasi"]');

-- ─── Swords (Kılıçlar) — zihin, iletişim, çatışma ──────────────────────────
INSERT INTO tarot_cards (id, slug, name_tr, arcana, suit, number, upright_meaning, reversed_meaning, keywords) VALUES
(UUID(), 'two-of-swords', 'Kılıç İkilisi', 'minor', 'swords', 2, 'Kararsızlık, çıkmaz, denge arayışı, gerçeği görmemek.', 'Karar verme, gerçekle yüzleşme, kilidin açılması.', '["kararsızlık","çıkmaz","denge"]'),
(UUID(), 'three-of-swords', 'Kılıç Üçlüsü', 'minor', 'swords', 3, 'Kalp kırıklığı, üzüntü, ihanet, ayrılık, acı gerçek.', 'İyileşme, affetme, acıyı bırakma.', '["kalp kırıklığı","üzüntü","ayrılık"]'),
(UUID(), 'four-of-swords', 'Kılıç Dörtlüsü', 'minor', 'swords', 4, 'Dinlenme, geri çekilme, iyileşme, içsel toparlanma.', 'Tükenme, dinlenememek, zorla devam etmek.', '["dinlenme","iyileşme","mola"]'),
(UUID(), 'five-of-swords', 'Kılıç Beşlisi', 'minor', 'swords', 5, 'Çatışma, kazanma uğruna kaybetme, kibir, agresiflik.', 'Barış, geri çekilme, çatışmayı bırakma, uzlaşma.', '["çatışma","kibir","kayıp"]'),
(UUID(), 'six-of-swords', 'Kılıç Altılısı', 'minor', 'swords', 6, 'Geçiş, zorlu durumdan uzaklaşma, iyileşmeye yolculuk.', 'Geçmişe takılma, hareket edememe, dirence kapılma.', '["geçiş","yolculuk","iyileşme"]'),
(UUID(), 'seven-of-swords', 'Kılıç Yedilisi', 'minor', 'swords', 7, 'Strateji, dolambaçlı yol, hile, gizlilik, kaçma.', 'Dürüstlük, itiraf, suçluluk, yakalanma.', '["strateji","gizlilik","hile"]'),
(UUID(), 'eight-of-swords', 'Kılıç Sekizlisi', 'minor', 'swords', 8, 'Kısıtlanmışlık hissi, kendini hapsetme, çaresizlik (zihinsel).', 'Özgürleşme, farkındalık, kısıtlamayı kırma.', '["kısıtlama","çaresizlik","hapis"]'),
(UUID(), 'nine-of-swords', 'Kılıç Dokuzlusu', 'minor', 'swords', 9, 'Anksiyete, kabus, endişe, suçluluk, uykusuzluk.', 'Endişeden çıkış, paylaşma, iyileşmeye başlama.', '["anksiyete","endişe","kabus"]'),
(UUID(), 'ten-of-swords', 'Kılıç Onlusu', 'minor', 'swords', 10, 'Dibe vurma, son, ihanet, acı bir sonun gelişi, yenilenme öncesi.', 'İyileşme başlangıcı, dipten çıkış, yenilenme.', '["dip","son","yenilenme"]'),
(UUID(), 'page-of-swords', 'Kılıç Prensi', 'minor', 'swords', 11, 'Merak, yeni fikir, zihinsel keşif, doğrudan iletişim.', 'Dedikodu, savunmasız iletişim, savruk düşünce.', '["merak","fikir","iletişim"]'),
(UUID(), 'knight-of-swords', 'Kılıç Şövalyesi', 'minor', 'swords', 12, 'Hızlı eylem, kararlılık, mücadele, zihinsel cesaret.', 'Acelecilik, dürtüsellik, hesapsız risk.', '["hız","cesaret","mücadele"]'),
(UUID(), 'queen-of-swords', 'Kılıç Kraliçesi', 'minor', 'swords', 13, 'Bağımsız zihin, dürüstlük, sınırlar, deneyimle bilgelik.', 'Sertlik, soğukluk, eleştirellik, küskünlük.', '["bağımsızlık","dürüstlük","sınır"]'),
(UUID(), 'king-of-swords', 'Kılıç Kralı', 'minor', 'swords', 14, 'Adalet, mantık, otorite, etik liderlik, açık zihin.', 'Sertlik, manipülasyon, soğuk yargı, tiranlık.', '["adalet","mantık","otorite"]');

-- ─── Wands (Değnekler) — tutku, eylem, yaratım ─────────────────────────────
INSERT INTO tarot_cards (id, slug, name_tr, arcana, suit, number, upright_meaning, reversed_meaning, keywords) VALUES
(UUID(), 'two-of-wands', 'Değnek İkilisi', 'minor', 'wands', 2, 'Planlama, gelecek vizyonu, karar anı, ufuk.', 'Korku, plansızlık, fırsatların kaçırılması.', '["plan","vizyon","karar"]'),
(UUID(), 'three-of-wands', 'Değnek Üçlüsü', 'minor', 'wands', 3, 'Genişleme, fırsatlar, vizyonun gerçekleşmesi, beklenti.', 'Engeller, gecikme, dar bakış.', '["genişleme","fırsat","beklenti"]'),
(UUID(), 'four-of-wands', 'Değnek Dörtlüsü', 'minor', 'wands', 4, 'Kutlama, ev, istikrar, kök salma, başarı eşiği.', 'Geçici uyumsuzluk, taşınma, eşik gerginliği.', '["kutlama","ev","istikrar"]'),
(UUID(), 'five-of-wands', 'Değnek Beşlisi', 'minor', 'wands', 5, 'Çatışma, rekabet, fikir farklılığı, küçük gerilimler.', 'Anlaşma, çatışmadan kaçınma, iç çatışma.', '["rekabet","çatışma","gerilim"]'),
(UUID(), 'six-of-wands', 'Değnek Altılısı', 'minor', 'wands', 6, 'Zafer, kabul görme, başarı, takdir, liderlik.', 'Tanınmama, başarı arayışı, ego, kibir.', '["zafer","başarı","takdir"]'),
(UUID(), 'seven-of-wands', 'Değnek Yedilisi', 'minor', 'wands', 7, 'Pozisyonu savunma, mücadele, dayanıklılık, irade.', 'Geri çekilme, baskıya boyun eğme, yorgunluk.', '["savunma","irade","mücadele"]'),
(UUID(), 'eight-of-wands', 'Değnek Sekizlisi', 'minor', 'wands', 8, 'Hızlı haber, hareket, ivme, doğrudan eylem, mesaj.', 'Gecikme, durgunluk, iletişim engeli.', '["hız","hareket","mesaj"]'),
(UUID(), 'nine-of-wands', 'Değnek Dokuzlusu', 'minor', 'wands', 9, 'Dayanıklılık, son virajda direnç, koruma, deneyim.', 'Bitkinlik, paranoya, savunmaya kapanma.', '["dayanıklılık","direnç","koruma"]'),
(UUID(), 'ten-of-wands', 'Değnek Onlusu', 'minor', 'wands', 10, 'Yük, fazla sorumluluk, son aşama, ağır taşıma.', 'Yükten kurtulma, devretme, hafifleme.', '["yük","sorumluluk","ağırlık"]'),
(UUID(), 'page-of-wands', 'Değnek Prensi', 'minor', 'wands', 11, 'Yeni fikir, ilham, keşif, hevesli başlangıç.', 'Hayal kırıklığı, plansızlık, dağınık ilham.', '["ilham","keşif","heves"]'),
(UUID(), 'knight-of-wands', 'Değnek Şövalyesi', 'minor', 'wands', 12, 'Tutku, macera, atılım, karizma, hızlı eylem.', 'Aceleci karar, plansız risk, sönen ateş.', '["macera","tutku","atılım"]'),
(UUID(), 'queen-of-wands', 'Değnek Kraliçesi', 'minor', 'wands', 13, 'Özgüven, karizma, sıcak liderlik, yaratıcı güç.', 'Kıskançlık, talepkarlık, dağınık enerji.', '["özgüven","karizma","liderlik"]'),
(UUID(), 'king-of-wands', 'Değnek Kralı', 'minor', 'wands', 14, 'Vizyoner liderlik, ilham, girişimcilik, doğal otorite.', 'Despotluk, sabırsızlık, ego şişkinliği.', '["vizyon","liderlik","girişim"]');

-- ─── Pentacles (Tılsımlar) — para, beden, somut alan ──────────────────────
INSERT INTO tarot_cards (id, slug, name_tr, arcana, suit, number, upright_meaning, reversed_meaning, keywords) VALUES
(UUID(), 'two-of-pentacles', 'Tılsım İkilisi', 'minor', 'pentacles', 2, 'Denge kurma, çoklu sorumluluk, esneklik, akış.', 'Dengesizlik, fazla yük, finansal stres.', '["denge","esneklik","öncelik"]'),
(UUID(), 'three-of-pentacles', 'Tılsım Üçlüsü', 'minor', 'pentacles', 3, 'Ekip çalışması, ustalık, planlı ilerleme, iş birliği.', 'İş birliği eksikliği, yetersiz beceri, anlaşmazlık.', '["ekip","ustalık","iş birliği"]'),
(UUID(), 'four-of-pentacles', 'Tılsım Dörtlüsü', 'minor', 'pentacles', 4, 'Tutuculuk, biriktirme, güvenlik arayışı, kontrol.', 'Cömertlik, paylaşma, açılma, kayıp korkusu azalır.', '["tutuculuk","güvenlik","kontrol"]'),
(UUID(), 'five-of-pentacles', 'Tılsım Beşlisi', 'minor', 'pentacles', 5, 'Maddi/manevi yoksunluk, dışta kalma, zor zaman.', 'İyileşme, yardım kabul etme, krizi atlatma.', '["yoksunluk","kriz","dışlanma"]'),
(UUID(), 'six-of-pentacles', 'Tılsım Altılısı', 'minor', 'pentacles', 6, 'Cömertlik, denge ile verme/alma, paylaşım, yardım.', 'Dengesiz verme, borçluluk, koşullu yardım.', '["cömertlik","paylaşım","denge"]'),
(UUID(), 'seven-of-pentacles', 'Tılsım Yedilisi', 'minor', 'pentacles', 7, 'Sabır, uzun vadeli yatırım, değerlendirme, hasat öncesi.', 'Sabırsızlık, kötü yatırım, sonuç beklenmeyen iş.', '["sabır","yatırım","değerlendirme"]'),
(UUID(), 'eight-of-pentacles', 'Tılsım Sekizlisi', 'minor', 'pentacles', 8, 'Ustalaşma, özen, beceri geliştirme, odaklı çalışma.', 'Özensizlik, sıkılma, kalitesiz iş.', '["ustalık","özen","öğrenme"]'),
(UUID(), 'nine-of-pentacles', 'Tılsım Dokuzlusu', 'minor', 'pentacles', 9, 'Bağımsızlık, lüks, kendinin ödülü, refah, kendi emeğin.', 'Yalnızlık, savurganlık, finansal bağımlılık.', '["bağımsızlık","refah","ödül"]'),
(UUID(), 'ten-of-pentacles', 'Tılsım Onlusu', 'minor', 'pentacles', 10, 'Aile mirası, kalıcı bolluk, gelenek, kuşaklar arası.', 'Aile çatışması, miras sorunu, kalıcılık eksiği.', '["miras","bolluk","aile"]'),
(UUID(), 'page-of-pentacles', 'Tılsım Prensi', 'minor', 'pentacles', 11, 'Öğrenme, yeni fırsat, plan, çalışkanlık, somut başlangıç.', 'Tembellik, plansızlık, kaçırılan fırsat.', '["öğrenme","fırsat","planlama"]'),
(UUID(), 'knight-of-pentacles', 'Tılsım Şövalyesi', 'minor', 'pentacles', 12, 'Çalışkanlık, tutarlılık, sabırlı ilerleme, güvenilirlik.', 'Tek düzelik, atalet, fazlaca temkinli.', '["çalışkanlık","tutarlılık","güven"]'),
(UUID(), 'queen-of-pentacles', 'Tılsım Kraliçesi', 'minor', 'pentacles', 13, 'Bolluk, besleyicilik, pratik bilgelik, ev/iş dengesi.', 'İhmal, dengesizlik, finansal kaygı, öz-bakım eksiği.', '["bolluk","besleyicilik","denge"]'),
(UUID(), 'king-of-pentacles', 'Tılsım Kralı', 'minor', 'pentacles', 14, 'Maddi başarı, cömert liderlik, sağlam temel, güven.', 'Açgözlülük, materyalizm, kontrolcülük.', '["başarı","cömertlik","temel"]');

UPDATE tarot_cards
SET image_url = CONCAT('/uploads/tarot/', slug, '.png')
WHERE image_url IS NULL OR image_url = '';
