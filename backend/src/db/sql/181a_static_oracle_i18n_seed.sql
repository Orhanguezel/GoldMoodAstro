-- 181a_static_oracle_i18n_seed.sql
-- Faz 4 devam: tarot statik kataloğu için EN+DE başlangıç i18n.
-- Mevcut katalog id'leri UUID() ile seed'lendiği için slug üzerinden bağlanır.

INSERT INTO tarot_card_i18n (id, card_id, locale, name, upright_meaning, reversed_meaning, keywords)
SELECT UUID(), c.id, v.locale, v.name, v.upright_meaning, v.reversed_meaning, v.keywords
FROM tarot_cards c
JOIN (
  SELECT 'the-fool' slug, 'en' locale, 'The Fool' name, 'New beginnings, innocence, adventure, freedom and spontaneity.' upright_meaning, 'Naivety, recklessness, risk-taking and hesitation.' reversed_meaning, '["beginnings","freedom","risk"]' keywords
  UNION ALL SELECT 'the-fool','de','Der Narr','Neuanfang, Unschuld, Abenteuer, Freiheit und Spontaneität.','Naivität, Leichtsinn, Risiko und Unentschlossenheit.','["anfang","freiheit","risiko"]'
  UNION ALL SELECT 'the-magician','en','The Magician','Creativity, skill, focus, manifestation and willpower.','Manipulation, weak planning and unused talents.','["will","creation","skill"]'
  UNION ALL SELECT 'the-magician','de','Der Magier','Kreativität, Können, Fokus, Manifestation und Willenskraft.','Manipulation, schwache Planung und ungenutzte Talente.','["wille","schöpfung","fähigkeit"]'
  UNION ALL SELECT 'the-high-priestess','en','The High Priestess','Intuition, subconscious wisdom, mystery, inner voice and sacred knowledge.','Hidden agendas, suppressed intuition and superficiality.','["intuition","mystery","subconscious"]'
  UNION ALL SELECT 'the-high-priestess','de','Die Hohepriesterin','Intuition, unbewusstes Wissen, Geheimnis, innere Stimme und heiliges Wissen.','Verborgene Absichten, unterdrückte Intuition und Oberflächlichkeit.','["intuition","geheimnis","unterbewusstsein"]'
  UNION ALL SELECT 'the-empress','en','The Empress','Abundance, motherhood, fertility, nature, nourishment and creativity.','Creative blocks, overdependence and a sense of emptiness.','["abundance","nature","creativity"]'
  UNION ALL SELECT 'the-empress','de','Die Herrscherin','Fülle, Mütterlichkeit, Fruchtbarkeit, Natur, Fürsorge und Kreativität.','Kreative Blockaden, Abhängigkeit und innere Leere.','["fülle","natur","kreativität"]'
  UNION ALL SELECT 'the-emperor','en','The Emperor','Authority, structure, discipline, control, fatherhood and rationality.','Tyranny, rigidity, lack of discipline and loss of control.','["authority","discipline","structure"]'
  UNION ALL SELECT 'the-emperor','de','Der Herrscher','Autorität, Struktur, Disziplin, Kontrolle, Vaterprinzip und Rationalität.','Tyrannei, Starrheit, Disziplinlosigkeit und Kontrollverlust.','["autorität","disziplin","struktur"]'
  UNION ALL SELECT 'the-hierophant','en','The Hierophant','Tradition, belief, spiritual guidance, social rules and learning.','Rebellion, rejection of tradition, personal beliefs and dogmatism.','["tradition","belief","guidance"]'
  UNION ALL SELECT 'the-hierophant','de','Der Hierophant','Tradition, Glaube, spirituelle Führung, soziale Regeln und Lehre.','Rebellion, Bruch mit Traditionen, persönliche Überzeugungen und Dogmatismus.','["tradition","glaube","führung"]'
  UNION ALL SELECT 'the-lovers','en','The Lovers','Love, harmony, relationships, values, choices and partnership.','Lack of self-love, disharmony, poor choices and disconnection.','["love","choice","harmony"]'
  UNION ALL SELECT 'the-lovers','de','Die Liebenden','Liebe, Harmonie, Beziehungen, Werte, Entscheidungen und Partnerschaft.','Mangel an Selbstliebe, Disharmonie, schlechte Entscheidungen und Distanz.','["liebe","wahl","harmonie"]'
  UNION ALL SELECT 'the-chariot','en','The Chariot','Victory, willpower, determination, discipline, success and control.','Lack of direction, aggression, loss of control and setbacks.','["victory","will","success"]'
  UNION ALL SELECT 'the-chariot','de','Der Wagen','Sieg, Willenskraft, Entschlossenheit, Disziplin, Erfolg und Kontrolle.','Richtungslosigkeit, Aggression, Kontrollverlust und Rückschläge.','["sieg","wille","erfolg"]'
  UNION ALL SELECT 'strength','en','Strength','Inner strength, courage, compassion, patience and self-control.','Insecurity, weakness, fear and aggression.','["strength","courage","patience"]'
  UNION ALL SELECT 'strength','de','Die Kraft','Innere Stärke, Mut, Mitgefühl, Geduld und Selbstbeherrschung.','Unsicherheit, Schwäche, Angst und Aggression.','["kraft","mut","geduld"]'
  UNION ALL SELECT 'the-hermit','en','The Hermit','Introspection, solitude, guidance, self-search and wisdom.','Isolation, fear of loneliness, withdrawal and social distance.','["wisdom","solitude","search"]'
  UNION ALL SELECT 'the-hermit','de','Der Eremit','Innenschau, Alleinsein, Führung, Selbstsuche und Weisheit.','Isolation, Angst vor Einsamkeit, Rückzug und soziale Distanz.','["weisheit","einsamkeit","suche"]'
  UNION ALL SELECT 'wheel-of-fortune','en','Wheel of Fortune','Fate, change, luck, turning points and cycles.','Bad luck, resistance and changes beyond control.','["fate","luck","change"]'
  UNION ALL SELECT 'wheel-of-fortune','de','Rad des Schicksals','Schicksal, Wandel, Glück, Wendepunkte und Zyklen.','Pech, Widerstand und unkontrollierbare Veränderungen.','["schicksal","glück","wandel"]'
  UNION ALL SELECT 'justice','en','Justice','Justice, honesty, truth, cause and effect, responsibility.','Injustice, dishonesty and avoiding accountability.','["justice","truth","balance"]'
  UNION ALL SELECT 'justice','de','Gerechtigkeit','Gerechtigkeit, Ehrlichkeit, Wahrheit, Ursache und Wirkung, Verantwortung.','Ungerechtigkeit, Unehrlichkeit und Ausweichen vor Verantwortung.','["gerechtigkeit","wahrheit","balance"]'
  UNION ALL SELECT 'the-hanged-man','en','The Hanged Man','Surrender, a new perspective, sacrifice and pause.','Delay, resistance, pointless sacrifice and indecision.','["perspective","sacrifice","pause"]'
  UNION ALL SELECT 'the-hanged-man','de','Der Gehängte','Hingabe, neue Perspektive, Opfer und Pause.','Verzögerung, Widerstand, sinnloses Opfer und Unentschlossenheit.','["perspektive","opfer","pause"]'
  UNION ALL SELECT 'death','en','Death','Ending, transformation, transition and making room for a new beginning.','Resistance to change, stagnation and clinging to the past.','["transformation","ending","transition"]'
  UNION ALL SELECT 'death','de','Der Tod','Ende, Transformation, Übergang und Raum für einen Neubeginn.','Widerstand gegen Veränderung, Stillstand und Festhalten an der Vergangenheit.','["transformation","ende","übergang"]'
  UNION ALL SELECT 'temperance','en','Temperance','Balance, patience, harmony, moderation and finding purpose.','Imbalance, excess, disharmony and haste.','["balance","harmony","moderation"]'
  UNION ALL SELECT 'temperance','de','Mäßigkeit','Balance, Geduld, Harmonie, Maß und Sinnfindung.','Ungleichgewicht, Übermaß, Disharmonie und Hast.','["balance","harmonie","maß"]'
  UNION ALL SELECT 'the-devil','en','The Devil','Attachment, material pull, shadow self and restriction.','Liberation, independence, facing the shadow and awareness.','["attachment","restriction","material"]'
  UNION ALL SELECT 'the-devil','de','Der Teufel','Bindung, materielle Versuchung, Schattenanteile und Begrenzung.','Befreiung, Unabhängigkeit, Schattenarbeit und Bewusstsein.','["bindung","begrenzung","materie"]'
  UNION ALL SELECT 'the-tower','en','The Tower','Sudden change, chaos, collapse, awakening and revelation.','Avoiding collapse, fear and delayed disruption.','["collapse","awakening","chaos"]'
  UNION ALL SELECT 'the-tower','de','Der Turm','Plötzlicher Wandel, Chaos, Zusammenbruch, Erwachen und Offenbarung.','Vermeidung des Zusammenbruchs, Angst und verzögerte Erschütterung.','["zusammenbruch","erwachen","chaos"]'
  UNION ALL SELECT 'the-star','en','The Star','Hope, inspiration, healing, renewal and peace.','Hopelessness, lack of inspiration and loss of faith.','["hope","healing","inspiration"]'
  UNION ALL SELECT 'the-star','de','Der Stern','Hoffnung, Inspiration, Heilung, Erneuerung und Frieden.','Hoffnungslosigkeit, fehlende Inspiration und Glaubensverlust.','["hoffnung","heilung","inspiration"]'
  UNION ALL SELECT 'the-moon','en','The Moon','Illusion, fear, anxiety, the subconscious and confusion.','Overcoming fears, clarity and what was hidden becoming visible.','["fear","illusion","subconscious"]'
  UNION ALL SELECT 'the-moon','de','Der Mond','Illusion, Angst, Unruhe, Unterbewusstsein und Verwirrung.','Ängste überwinden, Klarheit und Offenlegung des Verborgenen.','["angst","illusion","unterbewusstsein"]'
  UNION ALL SELECT 'the-sun','en','The Sun','Happiness, success, vitality, joy and illumination.','Temporary pessimism, over-optimism and delayed success.','["success","joy","vitality"]'
  UNION ALL SELECT 'the-sun','de','Die Sonne','Glück, Erfolg, Lebenskraft, Freude und Erleuchtung.','Vorübergehender Pessimismus, Überoptimismus und verzögerter Erfolg.','["erfolg","freude","lebenskraft"]'
  UNION ALL SELECT 'judgement','en','Judgement','Facing truth, awakening, decision, forgiveness and renewal.','Self-judgment, indecision and being stuck in the past.','["awakening","decision","reckoning"]'
  UNION ALL SELECT 'judgement','de','Das Gericht','Wahrheit, Erwachen, Entscheidung, Vergebung und Erneuerung.','Selbstverurteilung, Unentschlossenheit und Festhalten an der Vergangenheit.','["erwachen","entscheidung","klärung"]'
  UNION ALL SELECT 'the-world','en','The World','Completion, success, travel, wholeness and celebration.','Unfinished work, delay and lack of vision.','["completion","wholeness","success"]'
  UNION ALL SELECT 'the-world','de','Die Welt','Vollendung, Erfolg, Reise, Ganzheit und Feier.','Unerledigtes, Verzögerung und fehlende Vision.','["vollendung","ganzheit","erfolg"]'
) v ON v.slug = c.slug
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  upright_meaning = VALUES(upright_meaning),
  reversed_meaning = VALUES(reversed_meaning),
  keywords = VALUES(keywords);
