-- 039_compatibility_seed.sql
-- FAZ 20 — Burç Uyumu Seed

INSERT IGNORE INTO compatibility_readings (id, sign_a, sign_b, locale, title, summary, content, love_score, friendship_score, career_score, sexual_score, source) VALUES
(UUID(), 'aries', 'scorpio', 'tr', 'Koç ve Akrep Uyumu: Ateş ve Buzun Dansı', 
'İki yönetici gezegeni Mars olan bu ikili arasındaki enerji patlamasına hazır olun.', 
'Koç ve Akrep arasındaki ilişki, zodyakın en yoğun ve tutkulu eşleşmelerinden biridir. Her iki burç da geleneksel olarak Mars tarafından yönetilir (Akrep ayrıca Plüton tarafından da yönetilir), bu da aralarında doğal bir dinamizm ve güç mücadelesi yaratır.\n\nAşkta: İnanılmaz bir çekim gücü vardır. Akrep\'in derinliği Koç\'un yüzeysel olmayan cesaretiyle birleştiğinde sarsılmaz bir bağ oluşabilir.\n\nİş Hayatında: İkisi de son derece hırslıdır. Eğer aynı hedef için çalışırlarsa önlerinde kimse duramaz.', 
95, 80, 85, 98, 'llm')
ON DUPLICATE KEY UPDATE updated_at = NOW();
