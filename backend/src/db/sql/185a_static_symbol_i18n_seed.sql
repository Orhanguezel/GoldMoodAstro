-- 185a_static_symbol_i18n_seed.sql
-- Faz 4 devam: kahve/rüya sembol katalogları için EN+DE başlangıç i18n.
-- 183_coffee_seed.sql ve 185_dream_seed.sql sonrasında çalışır.

INSERT INTO coffee_symbol_i18n (id, symbol_id, locale, name, meaning, category)
SELECT UUID(), s.id, v.locale, v.name, v.meaning, v.category
FROM coffee_symbols s
JOIN (
  SELECT 'bird' slug, 'en' locale, 'Bird' name, 'News, good tidings and a joyful development.' meaning, '["news","general"]' category
  UNION ALL SELECT 'bird','de','Vogel','Nachricht, gute Neuigkeit und eine erfreuliche Entwicklung.','["nachricht","allgemein"]'
  UNION ALL SELECT 'road','en','Road','Travel, a new beginning or a long process.' ,'["career","general"]'
  UNION ALL SELECT 'road','de','Weg','Reise, Neubeginn oder ein längerer Prozess.','["karriere","allgemein"]'
  UNION ALL SELECT 'heart','en','Heart','Love, affection and emotional attachment.','["love"]'
  UNION ALL SELECT 'heart','de','Herz','Liebe, Zuneigung und emotionale Bindung.','["liebe"]'
  UNION ALL SELECT 'ring','en','Ring','Marriage, engagement, contract or commitment.','["love","social"]'
  UNION ALL SELECT 'ring','de','Ring','Ehe, Verlobung, Vertrag oder verbindliche Zusage.','["liebe","sozial"]'
  UNION ALL SELECT 'moon','en','Moon','Peace, emotional depth and hidden secrets.','["general","emotion"]'
  UNION ALL SELECT 'moon','de','Mond','Ruhe, emotionale Tiefe und verborgene Geheimnisse.','["allgemein","gefühl"]'
  UNION ALL SELECT 'sun','en','Sun','Success, clarity and things falling into place.','["career","general"]'
  UNION ALL SELECT 'sun','de','Sonne','Erfolg, Klarheit und Dinge, die sich fügen.','["karriere","allgemein"]'
  UNION ALL SELECT 'mountain','en','Mountain','Challenge, obstacle and a situation requiring patience.','["career","obstacle"]'
  UNION ALL SELECT 'mountain','de','Berg','Herausforderung, Hindernis und eine Lage, die Geduld braucht.','["karriere","hindernis"]'
  UNION ALL SELECT 'fish','en','Fish','Fortune, provision and material abundance.','["money"]'
  UNION ALL SELECT 'fish','de','Fisch','Glück, Versorgung und materielle Fülle.','["geld"]'
  UNION ALL SELECT 'snake','en','Snake','Jealousy, hidden danger or a difficult person nearby.','["obstacle","social"]'
  UNION ALL SELECT 'snake','de','Schlange','Neid, verborgene Gefahr oder eine schwierige Person im Umfeld.','["hindernis","sozial"]'
  UNION ALL SELECT 'eye','en','Eye','Evil eye, being watched or someone paying close attention.','["social","evil_eye"]'
  UNION ALL SELECT 'eye','de','Auge','Böser Blick, Beobachtung oder besondere Aufmerksamkeit durch jemanden.','["sozial","böser_blick"]'
  UNION ALL SELECT 'key','en','Key','Solution, an opening door or acquiring property.','["money","general"]'
  UNION ALL SELECT 'key','de','Schlüssel','Lösung, eine neue Tür oder Besitz/Immobilie.','["geld","allgemein"]'
  UNION ALL SELECT 'tree','en','Tree','Family, rooted change, health and longevity.','["health","family"]'
  UNION ALL SELECT 'tree','de','Baum','Familie, verwurzelte Veränderung, Gesundheit und langes Leben.','["gesundheit","familie"]'
  UNION ALL SELECT 'horse','en','Horse','A wish, nobility and a desire that may happen quickly.','["general","success"]'
  UNION ALL SELECT 'horse','de','Pferd','Wunsch, Würde und ein Anliegen, das sich schnell erfüllen kann.','["allgemein","erfolg"]'
  UNION ALL SELECT 'ship','en','Ship','Fortune from afar or a journey across distance.','["general","news"]'
  UNION ALL SELECT 'ship','de','Schiff','Glück aus der Ferne oder eine Reise über Distanz.','["allgemein","nachricht"]'
  UNION ALL SELECT 'star','en','Star','Recognition, inspiration and great luck.','["success","luck"]'
  UNION ALL SELECT 'star','de','Stern','Anerkennung, Inspiration und großes Glück.','["erfolg","glück"]'
) v ON v.slug = s.slug
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  meaning = VALUES(meaning),
  category = VALUES(category);

INSERT INTO dream_symbol_i18n (id, symbol_id, locale, name, meaning, category)
SELECT UUID(), s.id, v.locale, v.name, v.meaning, v.category
FROM dream_symbols s
JOIN (
  SELECT 'water' slug, 'en' locale, 'Water' name, 'Emotional state, purity, renewal or uncertainty.' meaning, '["general","emotion"]' category
  UNION ALL SELECT 'water','de','Wasser','Emotionale Lage, Reinheit, Erneuerung oder Unsicherheit.','["allgemein","gefühl"]'
  UNION ALL SELECT 'snake','en','Snake','Enemy, jealousy, healing or transformation.','["warning","transformation"]'
  UNION ALL SELECT 'snake','de','Schlange','Feind, Neid, Heilung oder Transformation.','["warnung","transformation"]'
  UNION ALL SELECT 'flying','en','Flying','Freedom, loss of control or higher goals.','["general","psychological"]'
  UNION ALL SELECT 'flying','de','Fliegen','Freiheit, Kontrollverlust oder höhere Ziele.','["allgemein","psychologisch"]'
  UNION ALL SELECT 'falling','en','Falling','Loss of control, insecurity or fear of failure.','["warning","psychological"]'
  UNION ALL SELECT 'falling','de','Fallen','Kontrollverlust, Unsicherheit oder Angst vor Scheitern.','["warnung","psychologisch"]'
  UNION ALL SELECT 'teeth_falling','en','Teeth Falling Out','Loss of power, fear of aging or the weight of words.','["warning","health"]'
  UNION ALL SELECT 'teeth_falling','de','Zähne fallen aus','Kraftverlust, Angst vor dem Älterwerden oder die Last der Worte.','["warnung","gesundheit"]'
  UNION ALL SELECT 'fire','en','Fire','Passion, anger, destruction or purification.','["emotion","warning"]'
  UNION ALL SELECT 'fire','de','Feuer','Leidenschaft, Wut, Zerstörung oder Reinigung.','["gefühl","warnung"]'
  UNION ALL SELECT 'death','en','Death','The end of a phase, new beginnings and change.','["transformation","general"]'
  UNION ALL SELECT 'death','de','Tod','Ende einer Phase, Neubeginn und Veränderung.','["transformation","allgemein"]'
  UNION ALL SELECT 'baby','en','Baby','New ideas, innocence or something needing protection.','["good_news","general"]'
  UNION ALL SELECT 'baby','de','Baby','Neue Ideen, Unschuld oder etwas Schutzbedürftiges.','["gute_nachricht","allgemein"]'
  UNION ALL SELECT 'money','en','Money','Self-worth, power, opportunities or material concern.','["money","psychological"]'
  UNION ALL SELECT 'money','de','Geld','Selbstwert, Macht, Chancen oder materielle Sorge.','["geld","psychologisch"]'
  UNION ALL SELECT 'house','en','House','Self, mind, family or security.','["family","psychological"]'
  UNION ALL SELECT 'house','de','Haus','Selbst, Geist, Familie oder Sicherheit.','["familie","psychologisch"]'
  UNION ALL SELECT 'sea','en','Sea','The subconscious, vastness, peace or inner storm.','["emotion","general"]'
  UNION ALL SELECT 'sea','de','Meer','Unterbewusstsein, Weite, Frieden oder innerer Sturm.','["gefühl","allgemein"]'
  UNION ALL SELECT 'door','en','Door','New opportunities, secrets, obstacles or transition.','["good_news","general"]'
  UNION ALL SELECT 'door','de','Tür','Neue Chancen, Geheimnisse, Hindernisse oder Übergang.','["gute_nachricht","allgemein"]'
  UNION ALL SELECT 'key','en','Key','Solution, authority, hidden knowledge or property.','["success","general"]'
  UNION ALL SELECT 'key','de','Schlüssel','Lösung, Befugnis, verborgenes Wissen oder Besitz.','["erfolg","allgemein"]'
  UNION ALL SELECT 'bridge','en','Bridge','Transition, connection and a moment of decision.','["transformation","general"]'
  UNION ALL SELECT 'bridge','de','Brücke','Übergang, Verbindung und ein Entscheidungsmoment.','["transformation","allgemein"]'
  UNION ALL SELECT 'road','en','Road','Life path, choice of direction and process.','["career","general"]'
  UNION ALL SELECT 'road','de','Weg','Lebensweg, Richtungswahl und Prozess.','["karriere","allgemein"]'
) v ON v.slug = s.slug
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  meaning = VALUES(meaning),
  category = VALUES(category);
