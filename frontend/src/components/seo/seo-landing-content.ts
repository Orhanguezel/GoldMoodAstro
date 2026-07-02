export type LandingKey = 'kahve-fali' | 'ruya-tabiri' | 'birth-chart' | 'pricing' | 'yildizname';

export type LandingLocale = 'tr' | 'en' | 'de';

export type LandingData = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  lead: string;
  summary: string;
  sections: Array<{ title: string; paragraphs: string[] }>;
  faq: Array<{ question: string; answer: string }>;
  image: string;
  authorTitle: string;
  expertise: string[];
};

export const LANDING_CONTENT: Record<LandingKey, Record<LandingLocale, LandingData>> = {
  'kahve-fali': {
    en: {
      slug: 'kahve-fali',
      title: 'Coffee Reading Guide',
      description: 'A practical guide to coffee reading symbols, cup preparation, interpretation context and responsible spiritual guidance.',
      eyebrow: 'Coffee Reading',
      lead: 'Coffee reading turns cup shapes, residue paths and intuitive symbols into a reflective conversation about the present moment.',
      summary: 'Coffee reading is most useful when it is read as symbolic guidance rather than a fixed prediction. A cup can suggest emotional patterns, relationship questions, career tension or a decision that needs more care. GoldMoodAstro combines traditional symbol language with modern, responsible interpretation so the reading supports awareness instead of fear.',
      sections: [
        { title: 'How coffee reading works', paragraphs: ['A coffee reading begins with the cup, but the cup is only one layer. The reader observes density, direction, open spaces, repeated shapes and the relationship between symbols. A bird, path, heart or mountain does not mean the same thing in every cup. It changes according to where it appears, what surrounds it and which question the person brings.', 'The most reliable readings avoid dramatic certainty. They ask what a symbol may be inviting you to notice. A clear path can point to movement, but the helpful question is whether you are ready for that movement. A closed shape may show hesitation, but it does not mean failure. It can mean that timing, communication or emotional clarity needs attention.'] },
        { title: 'What a good interpretation includes', paragraphs: ['A strong interpretation connects symbols with context. It names the theme, explains why that theme appears, and gives the person a grounded way to reflect on it. In relationship readings, this can mean exploring trust, distance, waiting or unresolved conversation. In career readings, it can mean noticing pressure, opportunity, delayed news or the need for a more practical plan.', 'GoldMoodAstro readings are written to be calm and useful. We avoid language that creates dependency, panic or absolute fate claims. A cup may open a helpful mirror, but choices remain human. The best result comes when the person reads the interpretation slowly, compares it with real life and uses it to ask better questions.'] },
        { title: 'Preparing for a better reading', paragraphs: ['Before a reading, choose one focus instead of asking everything at once. A question such as "what should I understand about this relationship dynamic?" creates a clearer interpretation than "what will happen to me?" Good light and a clean photo also matter when the reading uses image analysis, because symbol clarity affects the first layer of interpretation.', 'After the reading, look for repeated symbols and emotional resonance. If a symbol feels important, write down why. If something does not fit, do not force it. Responsible spiritual guidance should expand perspective, not replace personal judgment, professional support or direct communication with the people involved.'] },
      ],
      faq: [
        { question: 'Is coffee reading a guaranteed prediction?', answer: 'No. It is symbolic guidance for reflection, not a fixed future statement.' },
        { question: 'How can I get a clearer coffee reading?', answer: 'Use a clear cup photo, choose one focus and read the interpretation as a reflective guide.' },
      ],
      image: '/img/coffee.png',
      authorTitle: 'Coffee symbolism editors',
      expertise: ['Coffee Reading', 'Symbolism', 'Spiritual Guidance'],
    },
    tr: {
      slug: 'kahve-fali',
      title: 'Kahve Falı Rehberi',
      description: 'Kahve falı sembolleri, fincan hazırlığı, yorum bağlamı ve sorumlu manevi rehberlik üzerine pratik bir rehber.',
      eyebrow: 'Kahve Falı',
      lead: 'Kahve falı; fincandaki şekilleri, telve izlerini ve sezgisel sembolleri, şimdiki an üzerine düşündüren bir iç konuşmaya dönüştürür.',
      summary: 'Kahve falı, kesinleşmiş bir kehanet gibi değil, sembolik bir rehberlik olarak okunduğunda en faydalı halini alır. Bir fincan; duygusal örüntülere, ilişki sorularına, kariyer gerilimine ya da daha fazla özen isteyen bir karara işaret edebilir. GoldMoodAstro, geleneksel sembol dilini modern ve sorumlu bir yorum anlayışıyla birleştirir; böylece fal korku yerine farkındalığı destekler.',
      sections: [
        { title: 'Kahve falı nasıl çalışır', paragraphs: ['Bir kahve falı fincanla başlar, ancak fincan yalnızca ilk katmandır. Falcı; telvenin yoğunluğunu, yönünü, boş alanları, tekrar eden şekilleri ve semboller arasındaki ilişkiyi gözlemler. Bir kuş, yol, kalp ya da dağ her fincanda aynı anlama gelmez. Nerede belirdiğine, çevresinde ne olduğuna ve kişinin hangi soruyla geldiğine göre anlam değiştirir.', 'En güvenilir yorumlar dramatik kesinlikten kaçınır. Bir sembolün sizi neyi fark etmeye davet ediyor olabileceğini sorar. Açık bir yol harekete işaret edebilir; ama asıl faydalı soru, o harekete hazır olup olmadığınızdır. Kapalı bir şekil tereddüt gösterebilir; fakat bu başarısızlık anlamına gelmez. Zamanlamanın, iletişimin ya da duygusal netliğin ilgi istediğine işaret edebilir.'] },
        { title: 'İyi bir yorum neleri içerir', paragraphs: ['Güçlü bir yorum, sembolleri bağlamla buluşturur. Temayı adlandırır, bu temanın neden ortaya çıktığını açıklar ve kişiye üzerine düşünebileceği sağlam bir zemin sunar. İlişki yorumlarında bu; güveni, mesafeyi, bekleyişi ya da yarım kalmış bir konuşmayı ele almak anlamına gelebilir. Kariyer yorumlarında ise baskıyı, fırsatı, geciken bir haberi ya da daha pratik bir plana duyulan ihtiyacı fark etmek olabilir.', 'GoldMoodAstro yorumları sakin ve işlevsel olacak şekilde yazılır. Bağımlılık, panik ya da mutlak kader iddiaları yaratan bir dilden kaçınırız. Bir fincan faydalı bir ayna açabilir; ancak seçimler her zaman insana aittir. En iyi sonuç, kişi yorumu sindirerek okuduğunda, gerçek hayatıyla karşılaştırdığında ve daha iyi sorular sormak için kullandığında ortaya çıkar.'] },
        { title: 'Daha iyi bir fal için hazırlık', paragraphs: ['Fal öncesinde her şeyi bir arada sormak yerine tek bir odak seçin. "Bu ilişki dinamiği hakkında neyi anlamalıyım?" gibi bir soru, "bana ne olacak?" sorusundan çok daha net bir yorum üretir. Fal görsel analiz kullanıyorsa iyi ışık ve temiz bir fotoğraf da önemlidir; çünkü sembol netliği yorumun ilk katmanını doğrudan etkiler.', 'Fal sonrasında tekrar eden sembollere ve içinizde yankı bulan duygulara bakın. Bir sembol önemli hissettiriyorsa nedenini not edin. Bir şey oturmuyorsa zorlamayın. Sorumlu manevi rehberlik bakış açısını genişletmelidir; kişisel muhakemenin, profesyonel desteğin ya da ilgili kişilerle doğrudan iletişimin yerini almamalıdır.'] },
      ],
      faq: [
        { question: 'Kahve falı garantili bir kehanet midir?', answer: 'Hayır. Kahve falı, üzerine düşünmek için sembolik bir rehberliktir; kesinleşmiş bir gelecek ifadesi değildir.' },
        { question: 'Daha net bir kahve falı için ne yapabilirim?', answer: 'Net bir fincan fotoğrafı kullanın, tek bir odak seçin ve yorumu düşünmeye davet eden bir rehber olarak okuyun.' },
      ],
      image: '/img/coffee.png',
      authorTitle: 'Kahve sembolizmi editörleri',
      expertise: ['Kahve Falı', 'Sembolizm', 'Manevi Rehberlik'],
    },
    de: {
      slug: 'kahve-fali',
      title: 'Leitfaden zum Kaffeesatzlesen',
      description: 'Ein praktischer Leitfaden zu Symbolen des Kaffeesatzlesens, Tassenvorbereitung, Deutungskontext und verantwortungsvoller spiritueller Begleitung.',
      eyebrow: 'Kaffeesatzlesen',
      lead: 'Kaffeesatzlesen verwandelt Formen in der Tasse, Spuren des Kaffeesatzes und intuitive Symbole in ein reflektierendes Gespräch über den gegenwärtigen Moment.',
      summary: 'Kaffeesatzlesen ist dann am wertvollsten, wenn es als symbolische Orientierung und nicht als feststehende Vorhersage verstanden wird. Eine Tasse kann auf emotionale Muster, Beziehungsfragen, berufliche Spannungen oder eine Entscheidung hinweisen, die mehr Sorgfalt verdient. GoldMoodAstro verbindet die traditionelle Symbolsprache mit einer modernen, verantwortungsvollen Deutung, sodass die Lesung Bewusstsein statt Angst fördert.',
      sections: [
        { title: 'Wie Kaffeesatzlesen funktioniert', paragraphs: ['Eine Kaffeesatzlesung beginnt mit der Tasse, doch die Tasse ist nur eine Ebene. Die lesende Person betrachtet Dichte, Richtung, freie Flächen, wiederkehrende Formen und die Beziehung der Symbole zueinander. Ein Vogel, ein Weg, ein Herz oder ein Berg bedeutet nicht in jeder Tasse dasselbe. Die Bedeutung verändert sich je nachdem, wo das Symbol erscheint, was es umgibt und mit welcher Frage die Person kommt.', 'Die verlässlichsten Deutungen vermeiden dramatische Gewissheit. Sie fragen, worauf ein Symbol Sie aufmerksam machen möchte. Ein freier Weg kann auf Bewegung hindeuten, doch die hilfreiche Frage lautet, ob Sie für diese Bewegung bereit sind. Eine geschlossene Form kann Zögern zeigen, bedeutet aber kein Scheitern. Sie kann darauf hinweisen, dass Timing, Kommunikation oder emotionale Klarheit Aufmerksamkeit brauchen.'] },
        { title: 'Was eine gute Deutung enthält', paragraphs: ['Eine starke Deutung verbindet Symbole mit ihrem Kontext. Sie benennt das Thema, erklärt, warum es erscheint, und gibt der Person eine geerdete Möglichkeit, darüber nachzudenken. Bei Beziehungslesungen kann das bedeuten, Vertrauen, Distanz, Warten oder ein unausgesprochenes Gespräch zu erkunden. Bei beruflichen Lesungen kann es heißen, Druck, Chancen, verzögerte Nachrichten oder den Bedarf an einem praktischeren Plan wahrzunehmen.', 'Die Lesungen von GoldMoodAstro sind bewusst ruhig und nützlich formuliert. Wir vermeiden Sprache, die Abhängigkeit, Panik oder absolute Schicksalsbehauptungen erzeugt. Eine Tasse kann einen hilfreichen Spiegel öffnen, doch die Entscheidungen bleiben menschlich. Das beste Ergebnis entsteht, wenn die Person die Deutung in Ruhe liest, sie mit dem realen Leben vergleicht und daraus bessere Fragen entwickelt.'] },
        { title: 'Vorbereitung auf eine bessere Lesung', paragraphs: ['Wählen Sie vor einer Lesung einen einzigen Fokus, statt alles auf einmal zu fragen. Eine Frage wie "Was sollte ich über diese Beziehungsdynamik verstehen?" führt zu einer klareren Deutung als "Was wird mit mir geschehen?" Auch gutes Licht und ein sauberes Foto sind wichtig, wenn die Lesung eine Bildanalyse nutzt, denn die Klarheit der Symbole beeinflusst die erste Deutungsebene.', 'Achten Sie nach der Lesung auf wiederkehrende Symbole und emotionale Resonanz. Wenn sich ein Symbol wichtig anfühlt, notieren Sie, warum. Wenn etwas nicht passt, erzwingen Sie es nicht. Verantwortungsvolle spirituelle Begleitung soll die Perspektive erweitern und weder das eigene Urteilsvermögen noch professionelle Unterstützung oder das direkte Gespräch mit den beteiligten Menschen ersetzen.'] },
      ],
      faq: [
        { question: 'Ist Kaffeesatzlesen eine garantierte Vorhersage?', answer: 'Nein. Es ist symbolische Orientierung zur Reflexion, keine feststehende Aussage über die Zukunft.' },
        { question: 'Wie erhalte ich eine klarere Kaffeesatzlesung?', answer: 'Verwenden Sie ein deutliches Foto der Tasse, wählen Sie einen Fokus und lesen Sie die Deutung als reflektierenden Leitfaden.' },
      ],
      image: '/img/coffee.png',
      authorTitle: 'Redaktion für Kaffeesymbolik',
      expertise: ['Kaffeesatzlesen', 'Symbolik', 'Spirituelle Begleitung'],
    },
  },
  'ruya-tabiri': {
    en: {
      slug: 'ruya-tabiri',
      title: 'Dream Interpretation Guide',
      description: 'A grounded guide to dream symbols, emotional context, recurring dreams and responsible interpretation.',
      eyebrow: 'Dream Interpretation',
      lead: 'Dream interpretation works best when symbols are read together with emotion, memory and the current life context.',
      summary: 'A dream is not only a strange story from sleep. It can be a symbolic arrangement of emotion, memory, fear, desire and unfinished thought. GoldMoodAstro interprets dreams through symbol language and psychological awareness while avoiding fear-based or deterministic claims.',
      sections: [
        { title: 'Why context matters', paragraphs: ['The same dream symbol can mean different things for different people. Water can suggest emotion, cleansing, uncertainty or overwhelm. A house can suggest the self, family, privacy or a life stage. The feeling inside the dream is often more important than the object itself. A calm sea and a frightening flood both contain water, but they speak in different emotional tones.', 'A useful interpretation begins by asking what the dream made you feel, where the strongest image appeared and what has been active in your life recently. This keeps the reading personal and prevents generic symbol lists from becoming misleading.'] },
        { title: 'Recurring dreams and strong symbols', paragraphs: ['Recurring dreams often show a theme that the mind keeps returning to. This does not mean something bad will happen. It may mean that an emotion has not been integrated or that a practical situation keeps creating the same inner response. Dreams about being late, losing something, being chased or returning to an old place often point to pressure, avoidance, transition or unresolved memory.', 'Strong symbols should be handled gently. A dream can be intense without being prophetic. GoldMoodAstro interpretations focus on the message, not the shock. The goal is to help the person understand what the dream may be asking for: rest, honesty, closure, courage, boundaries or a new way to name an old feeling.'] },
        { title: 'How to use a dream reading', paragraphs: ['Write the dream as soon as you remember it. Include colors, places, people, repeated images and the final feeling. Then read the interpretation and mark only what truly fits. The most helpful insight is usually simple: a relationship needs clarity, a decision creates tension, a fear is asking for attention, or a new phase is beginning internally before it becomes visible externally.', 'Dream interpretation should support self-awareness. It should not replace medical, psychological, legal or financial advice. If dreams are disturbing, frequent or connected with trauma, professional support may be important. Spiritual insight and practical care can exist together.'] },
      ],
      faq: [
        { question: 'Are dreams literal messages?', answer: 'Usually no. Dreams are best read as symbolic and emotional material.' },
        { question: 'What should I include in a dream description?', answer: 'Include the strongest images, feelings, people, places and what was happening in your life.' },
      ],
      image: '/img/dream.png',
      authorTitle: 'Dream symbolism editors',
      expertise: ['Dream Interpretation', 'Symbols', 'Self Awareness'],
    },
    tr: {
      slug: 'ruya-tabiri',
      title: 'Rüya Tabiri Rehberi',
      description: 'Rüya sembolleri, duygusal bağlam, tekrarlayan rüyalar ve sorumlu yorumlama üzerine ayakları yere basan bir rehber.',
      eyebrow: 'Rüya Tabiri',
      lead: 'Rüya tabiri, semboller duygu, hafıza ve o dönemdeki yaşam bağlamıyla birlikte okunduğunda en doğru sonucu verir.',
      summary: 'Bir rüya, yalnızca uykudan kalan tuhaf bir hikâye değildir. Duyguların, anıların, korkuların, arzuların ve yarım kalmış düşüncelerin sembolik bir düzenlemesi olabilir. GoldMoodAstro rüyaları sembol dili ve psikolojik farkındalıkla yorumlar; korku temelli ya da kaderci iddialardan uzak durur.',
      sections: [
        { title: 'Bağlam neden önemlidir', paragraphs: ['Aynı rüya sembolü farklı kişiler için farklı anlamlara gelebilir. Su; duyguya, arınmaya, belirsizliğe ya da bunalmışlığa işaret edebilir. Bir ev; benliği, aileyi, mahremiyeti ya da bir yaşam evresini temsil edebilir. Rüyanın içindeki duygu, çoğu zaman nesnenin kendisinden daha önemlidir. Sakin bir deniz ile korkutucu bir sel; ikisi de su içerir, ama bambaşka duygusal tonlarda konuşurlar.', 'Faydalı bir yorum; rüyanın size ne hissettirdiğini, en güçlü görüntünün nerede belirdiğini ve son zamanlarda hayatınızda nelerin aktif olduğunu sorarak başlar. Bu yaklaşım yorumu kişisel tutar ve ezbere sembol listelerinin yanıltıcı hale gelmesini önler.'] },
        { title: 'Tekrarlayan rüyalar ve güçlü semboller', paragraphs: ['Tekrarlayan rüyalar, zihnin dönüp durduğu bir temayı gösterir çoğu zaman. Bu, kötü bir şey olacağı anlamına gelmez. Bir duygunun henüz bütünleştirilemediğine ya da pratik bir durumun içimizde hep aynı tepkiyi yarattığına işaret edebilir. Geç kalmak, bir şey kaybetmek, kovalanmak ya da eski bir yere geri dönmekle ilgili rüyalar; sıklıkla baskıya, kaçınmaya, geçiş dönemine ya da çözülmemiş bir anıya işaret eder.', 'Güçlü semboller nazikçe ele alınmalıdır. Bir rüya, kehanet olmadan da yoğun olabilir. GoldMoodAstro yorumları şoka değil mesaja odaklanır. Amaç, rüyanın kişiden ne istiyor olabileceğini anlamasına yardımcı olmaktır: dinlenme, dürüstlük, bir konuyu kapatma, cesaret, sınır koyma ya da eski bir duyguya yeni bir isim verme.'] },
        { title: 'Bir rüya yorumu nasıl kullanılır', paragraphs: ['Rüyayı hatırladığınız anda yazın. Renkleri, mekânları, kişileri, tekrar eden görüntüleri ve rüyadan kalan son duyguyu ekleyin. Ardından yorumu okuyun ve yalnızca gerçekten size uyan kısımları işaretleyin. En faydalı içgörü genellikle basittir: bir ilişki netlik istiyor, bir karar gerilim yaratıyor, bir korku ilgi bekliyor ya da yeni bir dönem dışarıdan görünür olmadan önce içeride başlıyor.', 'Rüya tabiri öz farkındalığı desteklemelidir. Tıbbi, psikolojik, hukuki ya da finansal tavsiyenin yerini almamalıdır. Rüyalar rahatsız edici, sık ya da travmayla bağlantılıysa profesyonel destek önemli olabilir. Manevi içgörü ile pratik özen bir arada var olabilir.'] },
      ],
      faq: [
        { question: 'Rüyalar birebir mesaj mıdır?', answer: 'Genellikle hayır. Rüyalar en doğru şekilde sembolik ve duygusal malzeme olarak okunur.' },
        { question: 'Bir rüya anlatımında nelere yer vermeliyim?', answer: 'En güçlü görüntüleri, duyguları, kişileri, mekânları ve o dönemde hayatınızda olup bitenleri ekleyin.' },
      ],
      image: '/img/dream.png',
      authorTitle: 'Rüya sembolizmi editörleri',
      expertise: ['Rüya Yorumu', 'Semboller', 'Öz Farkındalık'],
    },
    de: {
      slug: 'ruya-tabiri',
      title: 'Leitfaden zur Traumdeutung',
      description: 'Ein geerdeter Leitfaden zu Traumsymbolen, emotionalem Kontext, wiederkehrenden Träumen und verantwortungsvoller Deutung.',
      eyebrow: 'Traumdeutung',
      lead: 'Traumdeutung gelingt am besten, wenn Symbole gemeinsam mit Emotionen, Erinnerungen und dem aktuellen Lebenskontext gelesen werden.',
      summary: 'Ein Traum ist nicht nur eine seltsame Geschichte aus dem Schlaf. Er kann eine symbolische Anordnung von Emotionen, Erinnerungen, Ängsten, Wünschen und unabgeschlossenen Gedanken sein. GoldMoodAstro deutet Träume durch Symbolsprache und psychologisches Bewusstsein und vermeidet dabei angstbasierte oder deterministische Aussagen.',
      sections: [
        { title: 'Warum der Kontext zählt', paragraphs: ['Dasselbe Traumsymbol kann für verschiedene Menschen Unterschiedliches bedeuten. Wasser kann auf Emotionen, Reinigung, Unsicherheit oder Überforderung hinweisen. Ein Haus kann für das Selbst, die Familie, Privatsphäre oder eine Lebensphase stehen. Das Gefühl im Traum ist oft wichtiger als das Objekt selbst. Ein ruhiges Meer und eine beängstigende Flut enthalten beide Wasser, sprechen aber in ganz unterschiedlichen emotionalen Tönen.', 'Eine hilfreiche Deutung beginnt mit der Frage, was der Traum in Ihnen ausgelöst hat, wo das stärkste Bild erschien und was in Ihrem Leben zuletzt präsent war. So bleibt die Lesung persönlich, und generische Symbollisten werden nicht irreführend.'] },
        { title: 'Wiederkehrende Träume und starke Symbole', paragraphs: ['Wiederkehrende Träume zeigen oft ein Thema, zu dem der Geist immer wieder zurückkehrt. Das bedeutet nicht, dass etwas Schlimmes geschehen wird. Es kann heißen, dass eine Emotion noch nicht integriert wurde oder dass eine praktische Situation immer wieder dieselbe innere Reaktion auslöst. Träume vom Zuspätkommen, vom Verlieren, vom Verfolgtwerden oder von der Rückkehr an einen alten Ort deuten häufig auf Druck, Vermeidung, Übergang oder eine unverarbeitete Erinnerung hin.', 'Starke Symbole sollten behutsam behandelt werden. Ein Traum kann intensiv sein, ohne prophetisch zu sein. Die Deutungen von GoldMoodAstro konzentrieren sich auf die Botschaft, nicht auf den Schock. Ziel ist es, der Person zu helfen zu verstehen, wonach der Traum fragen könnte: Ruhe, Ehrlichkeit, Abschluss, Mut, Grenzen oder eine neue Art, ein altes Gefühl zu benennen.'] },
        { title: 'Wie man eine Traumdeutung nutzt', paragraphs: ['Schreiben Sie den Traum auf, sobald Sie sich an ihn erinnern. Halten Sie Farben, Orte, Personen, wiederkehrende Bilder und das abschließende Gefühl fest. Lesen Sie dann die Deutung und markieren Sie nur, was wirklich passt. Die hilfreichste Erkenntnis ist meist einfach: Eine Beziehung braucht Klarheit, eine Entscheidung erzeugt Spannung, eine Angst bittet um Aufmerksamkeit, oder eine neue Phase beginnt innerlich, bevor sie äußerlich sichtbar wird.', 'Traumdeutung soll die Selbstwahrnehmung unterstützen. Sie ersetzt keine medizinische, psychologische, rechtliche oder finanzielle Beratung. Wenn Träume belastend, häufig oder mit Traumata verbunden sind, kann professionelle Unterstützung wichtig sein. Spirituelle Einsicht und praktische Fürsorge können nebeneinander bestehen.'] },
      ],
      faq: [
        { question: 'Sind Träume wörtliche Botschaften?', answer: 'Meist nicht. Träume liest man am besten als symbolisches und emotionales Material.' },
        { question: 'Was sollte eine Traumbeschreibung enthalten?', answer: 'Nennen Sie die stärksten Bilder, Gefühle, Personen, Orte und was gerade in Ihrem Leben geschah.' },
      ],
      image: '/img/dream.png',
      authorTitle: 'Redaktion für Traumsymbolik',
      expertise: ['Traumdeutung', 'Symbole', 'Selbstwahrnehmung'],
    },
  },
  'birth-chart': {
    en: {
      slug: 'birth-chart',
      title: 'Birth Chart Analysis Guide',
      description: 'Learn what a natal chart shows through planets, signs, houses, aspects and responsible astrology interpretation.',
      eyebrow: 'Natal Astrology',
      lead: 'A birth chart maps planetary placements for a moment of birth and turns them into a language of temperament, timing and potential.',
      summary: 'A birth chart is not a sentence. It is a symbolic map. The Sun, Moon, rising sign, planets, houses and aspects describe tendencies, needs, strengths and growth points. GoldMoodAstro reads this map as guidance for awareness, not as a rigid limit on personality or future.',
      sections: [
        { title: 'The main parts of a chart', paragraphs: ['The Sun describes vitality and identity. The Moon describes emotional needs and instinctive responses. The rising sign shows how life is approached and how the chart is organized through houses. Mercury, Venus, Mars, Jupiter and Saturn add layers around thinking, love, action, growth and responsibility.', 'Houses place these themes into life areas such as relationships, career, family, creativity and inner work. Aspects show how planets cooperate or challenge each other. A square is not bad and a trine is not automatically easy; each pattern needs context, maturity and practical expression.'] },
        { title: 'What birth chart analysis can help with', paragraphs: ['Natal analysis can help a person name patterns that were already felt but not clearly understood. It may explain why certain relationships feel intense, why career motivation rises in particular environments, or why emotional security depends on specific forms of care. The value is not in labeling the person; it is in making choices more conscious.', 'A good reading also shows strengths. Many people focus only on difficult placements, but a chart includes resilience, talents, instincts and timing. Responsible astrology balances challenge with capacity. It helps the person work with the chart rather than feel trapped by it.'] },
        { title: 'Using astrology responsibly', paragraphs: ['Accurate birth time improves house and rising sign interpretation. If the time is unknown, the reading can still explore planets by sign and aspect, but some timing and house details become less precise. This distinction should always be clear so the user understands the confidence level of the analysis.', 'GoldMoodAstro avoids fatalistic claims. Astrology can support reflection, planning and emotional language, but important decisions should also consider real-world information and professional advice when needed. The chart is a map; the life is still lived through choice, relationship and action.'] },
      ],
      faq: [
        { question: 'Do I need an exact birth time?', answer: 'Exact time is best for rising sign and houses, but partial analysis is still possible without it.' },
        { question: 'Is a birth chart fixed fate?', answer: 'No. It shows symbolic patterns and potentials, not an unavoidable script.' },
      ],
      image: '/img/natal_chart.png',
      authorTitle: 'Natal astrology editors',
      expertise: ['Birth Chart', 'Astrology', 'Natal Analysis'],
    },
    tr: {
      slug: 'birth-chart',
      title: 'Doğum Haritası Analizi Rehberi',
      description: 'Bir doğum haritasının gezegenler, burçlar, evler, açılar ve sorumlu astroloji yorumuyla neler gösterdiğini öğrenin.',
      eyebrow: 'Natal Astroloji',
      lead: 'Doğum haritası, doğum anındaki gezegen konumlarını haritalar ve bunları mizaç, zamanlama ve potansiyelden oluşan bir dile dönüştürür.',
      summary: 'Doğum haritası bir hüküm değil, sembolik bir haritadır. Güneş, Ay, yükselen burç, gezegenler, evler ve açılar; eğilimleri, ihtiyaçları, güçlü yanları ve gelişim noktalarını tarif eder. GoldMoodAstro bu haritayı, kişiliğe ya da geleceğe konmuş katı bir sınır olarak değil, farkındalık için bir rehber olarak okur.',
      sections: [
        { title: 'Haritanın temel unsurları', paragraphs: ['Güneş, yaşam enerjisini ve kimliği anlatır. Ay, duygusal ihtiyaçları ve içgüdüsel tepkileri gösterir. Yükselen burç, hayata nasıl yaklaşıldığını ve haritanın evler üzerinden nasıl düzenlendiğini ortaya koyar. Merkür, Venüs, Mars, Jüpiter ve Satürn ise düşünce, sevgi, eylem, büyüme ve sorumluluk çevresinde katmanlar ekler.', 'Evler bu temaları ilişkiler, kariyer, aile, yaratıcılık ve içsel çalışma gibi yaşam alanlarına yerleştirir. Açılar, gezegenlerin birbirleriyle nasıl işbirliği yaptığını ya da birbirini nasıl zorladığını gösterir. Bir kare açı kötü değildir, bir üçgen açı da otomatik olarak kolay değildir; her örüntü bağlam, olgunluk ve pratik bir ifade ister.'] },
        { title: 'Doğum haritası analizi nelere yardımcı olabilir', paragraphs: ['Natal analiz, kişinin zaten hissettiği ama net biçimde anlamlandıramadığı örüntülere isim koymasına yardımcı olabilir. Bazı ilişkilerin neden bu kadar yoğun hissettirdiğini, kariyer motivasyonunun neden belirli ortamlarda yükseldiğini ya da duygusal güvenliğin neden belirli ilgi biçimlerine bağlı olduğunu açıklayabilir. Değer, kişiyi etiketlemekte değil; seçimleri daha bilinçli hale getirmektedir.', 'İyi bir okuma güçlü yanları da gösterir. Birçok kişi yalnızca zorlayıcı yerleşimlere odaklanır; oysa bir harita dayanıklılığı, yetenekleri, içgüdüleri ve zamanlamayı da içerir. Sorumlu astroloji, zorluğu kapasiteyle dengeler. Kişinin haritaya hapsolmuş hissetmesine değil, haritayla birlikte çalışmasına yardımcı olur.'] },
        { title: 'Astrolojiyi sorumlu kullanmak', paragraphs: ['Doğru doğum saati, ev ve yükselen burç yorumunun kalitesini artırır. Saat bilinmiyorsa okuma yine de gezegenleri burç ve açılar üzerinden inceleyebilir; ancak bazı zamanlama ve ev detayları daha az kesin hale gelir. Kullanıcının analizin güven düzeyini anlayabilmesi için bu ayrım her zaman açıkça belirtilmelidir.', 'GoldMoodAstro kaderci iddialardan kaçınır. Astroloji; düşünmeyi, planlamayı ve duygusal bir dil kurmayı destekleyebilir; ancak önemli kararlarda gerçek dünya bilgileri ve gerektiğinde profesyonel tavsiye de dikkate alınmalıdır. Harita bir haritadır; hayat yine de seçimle, ilişkiyle ve eylemle yaşanır.'] },
      ],
      faq: [
        { question: 'Kesin bir doğum saatine ihtiyacım var mı?', answer: 'Yükselen burç ve evler için kesin saat en iyisidir; ancak saat olmadan da kısmi bir analiz mümkündür.' },
        { question: 'Doğum haritası değişmez bir kader midir?', answer: 'Hayır. Harita, kaçınılmaz bir senaryoyu değil; sembolik örüntüleri ve potansiyelleri gösterir.' },
      ],
      image: '/img/natal_chart.png',
      authorTitle: 'Natal astroloji editörleri',
      expertise: ['Doğum Haritası', 'Astroloji', 'Natal Analiz'],
    },
    de: {
      slug: 'birth-chart',
      title: 'Leitfaden zur Geburtshoroskop-Analyse',
      description: 'Erfahren Sie, was ein Geburtshoroskop durch Planeten, Zeichen, Häuser, Aspekte und verantwortungsvolle astrologische Deutung zeigt.',
      eyebrow: 'Geburtshoroskop',
      lead: 'Ein Geburtshoroskop kartiert die Planetenstände zum Zeitpunkt der Geburt und übersetzt sie in eine Sprache von Temperament, Timing und Potenzial.',
      summary: 'Ein Geburtshoroskop ist kein Urteil, sondern eine symbolische Landkarte. Sonne, Mond, Aszendent, Planeten, Häuser und Aspekte beschreiben Neigungen, Bedürfnisse, Stärken und Wachstumspunkte. GoldMoodAstro liest diese Karte als Orientierung für mehr Bewusstsein, nicht als starre Grenze für Persönlichkeit oder Zukunft.',
      sections: [
        { title: 'Die wichtigsten Bestandteile eines Horoskops', paragraphs: ['Die Sonne beschreibt Vitalität und Identität. Der Mond steht für emotionale Bedürfnisse und instinktive Reaktionen. Der Aszendent zeigt, wie das Leben angegangen wird und wie sich das Horoskop über die Häuser organisiert. Merkur, Venus, Mars, Jupiter und Saturn fügen Ebenen rund um Denken, Liebe, Handeln, Wachstum und Verantwortung hinzu.', 'Die Häuser ordnen diese Themen Lebensbereichen wie Beziehungen, Beruf, Familie, Kreativität und innerer Arbeit zu. Aspekte zeigen, wie Planeten zusammenarbeiten oder einander herausfordern. Ein Quadrat ist nicht schlecht, und ein Trigon ist nicht automatisch leicht; jedes Muster braucht Kontext, Reife und einen praktischen Ausdruck.'] },
        { title: 'Wobei eine Geburtshoroskop-Analyse helfen kann', paragraphs: ['Eine Natal-Analyse kann helfen, Muster zu benennen, die längst gespürt, aber nie klar verstanden wurden. Sie kann erklären, warum bestimmte Beziehungen intensiv wirken, warum die berufliche Motivation in bestimmten Umgebungen steigt oder warum emotionale Sicherheit von bestimmten Formen der Zuwendung abhängt. Der Wert liegt nicht darin, die Person zu etikettieren, sondern darin, Entscheidungen bewusster zu machen.', 'Eine gute Deutung zeigt auch Stärken. Viele Menschen konzentrieren sich nur auf schwierige Konstellationen, doch ein Horoskop enthält ebenso Resilienz, Talente, Instinkte und Timing. Verantwortungsvolle Astrologie bringt Herausforderung und Fähigkeit ins Gleichgewicht. Sie hilft der Person, mit dem Horoskop zu arbeiten, statt sich davon gefangen zu fühlen.'] },
        { title: 'Astrologie verantwortungsvoll nutzen', paragraphs: ['Eine genaue Geburtszeit verbessert die Deutung von Häusern und Aszendent. Ist die Zeit unbekannt, kann die Analyse dennoch Planeten nach Zeichen und Aspekten untersuchen, doch einige Timing- und Hausdetails werden ungenauer. Diese Unterscheidung sollte immer transparent sein, damit die Nutzerinnen und Nutzer das Vertrauensniveau der Analyse verstehen.', 'GoldMoodAstro vermeidet fatalistische Aussagen. Astrologie kann Reflexion, Planung und emotionale Sprache unterstützen, doch wichtige Entscheidungen sollten auch reale Informationen und bei Bedarf professionelle Beratung einbeziehen. Das Horoskop ist eine Landkarte; das Leben wird weiterhin durch Entscheidungen, Beziehungen und Handeln gelebt.'] },
      ],
      faq: [
        { question: 'Brauche ich eine exakte Geburtszeit?', answer: 'Die exakte Zeit ist für Aszendent und Häuser ideal, doch auch ohne sie ist eine Teilanalyse möglich.' },
        { question: 'Ist ein Geburtshoroskop ein festes Schicksal?', answer: 'Nein. Es zeigt symbolische Muster und Potenziale, kein unausweichliches Drehbuch.' },
      ],
      image: '/img/natal_chart.png',
      authorTitle: 'Redaktion für Geburtshoroskope',
      expertise: ['Geburtshoroskop', 'Astrologie', 'Natal-Analyse'],
    },
  },
  pricing: {
    en: {
      slug: 'pricing',
      title: 'Session Pricing Guide',
      description: 'Understand GoldMoodAstro session prices, credit packages, consultant rates and how to choose a guidance option.',
      eyebrow: 'Pricing',
      lead: 'Pricing is easier to evaluate when you understand what changes between a quick reading, a full session and a specialist consultation.',
      summary: 'GoldMoodAstro pricing is built around transparent session options and consultant expertise. A lower price may be right for a focused question, while a longer or more specialized session can be better for relationship patterns, birth chart work, recurring dreams or complex decisions.',
      sections: [
        { title: 'What affects session price', paragraphs: ['Consultant experience, session duration, service type and media format can affect price. A short written or voice-focused reading may require less time than a full chart-based consultation. Video sessions may involve additional preparation and live interpretation. The best choice is not always the most expensive one; it is the format that matches the question.', 'Before booking, users should read the consultant profile, expertise areas, languages, reviews and available service descriptions. A strong match between question and consultant skill usually matters more than choosing by price alone.'] },
        { title: 'Choosing the right option', paragraphs: ['For a single decision, a focused short session may be enough. For birth chart, synastry, long relationship history or repeated emotional patterns, a longer consultation can create more space. If the question is urgent but simple, availability may matter more than deep specialization. If the question is sensitive, choose a consultant whose tone feels safe and grounded.', 'GoldMoodAstro encourages users to prepare one clear question, relevant dates or context and realistic expectations. A session is most helpful when the user is open to reflection rather than looking for a guaranteed answer.'] },
        { title: 'Payment, value and responsibility', paragraphs: ['Secure payment and clear booking details reduce uncertainty. Users should see duration, price and service type before confirming. After the session, the value often comes from notes, perspective and the next step the user can take. Good spiritual guidance should make the user feel more capable, not dependent.', 'Astrology, tarot and symbolic readings are guidance tools. They do not replace legal, medical, psychological or financial advice. Pricing should therefore be understood as payment for interpretive time and perspective, not for guaranteed outcomes.'] },
      ],
      faq: [
        { question: 'Which session should I choose?', answer: 'Choose by question complexity, consultant expertise and the amount of time you need.' },
        { question: 'Are results guaranteed?', answer: 'No. Sessions provide guidance and interpretation, not guaranteed outcomes.' },
      ],
      image: '/img/og-default.png',
      authorTitle: 'Client guidance editors',
      expertise: ['Pricing', 'Spiritual Guidance', 'Booking'],
    },
    tr: {
      slug: 'pricing',
      title: 'Seans Fiyatlandırma Rehberi',
      description: 'GoldMoodAstro seans fiyatlarını, kredi paketlerini, danışman ücretlerini ve size uygun rehberlik seçeneğini nasıl belirleyeceğinizi öğrenin.',
      eyebrow: 'Fiyatlandırma',
      lead: 'Hızlı bir yorum, tam bir seans ve uzman danışmanlığı arasında nelerin değiştiğini anladığınızda fiyatları değerlendirmek çok daha kolaylaşır.',
      summary: 'GoldMoodAstro fiyatlandırması, şeffaf seans seçenekleri ve danışman uzmanlığı üzerine kuruludur. Odaklı tek bir soru için daha uygun fiyatlı bir seçenek yeterli olabilirken; ilişki örüntüleri, doğum haritası çalışması, tekrarlayan rüyalar ya da karmaşık kararlar için daha uzun veya daha uzmanlaşmış bir seans daha doğru olabilir.',
      sections: [
        { title: 'Seans fiyatını neler etkiler', paragraphs: ['Danışman deneyimi, seans süresi, hizmet türü ve görüşme formatı fiyatı etkileyebilir. Kısa bir yazılı ya da sesli yorum, kapsamlı bir harita temelli danışmanlıktan daha az zaman gerektirebilir. Görüntülü seanslar ek hazırlık ve canlı yorum içerebilir. En iyi seçim her zaman en pahalı olan değildir; sorunuzla örtüşen formattır.', 'Randevu almadan önce danışman profilini, uzmanlık alanlarını, dilleri, yorumları ve sunulan hizmet açıklamalarını okumak önemlidir. Soru ile danışman becerisi arasındaki güçlü bir eşleşme, çoğu zaman yalnızca fiyata göre seçim yapmaktan daha belirleyicidir.'] },
        { title: 'Doğru seçeneği belirlemek', paragraphs: ['Tek bir karar için odaklı ve kısa bir seans yeterli olabilir. Doğum haritası, sinastri, uzun bir ilişki geçmişi ya da tekrarlayan duygusal örüntüler içinse daha uzun bir danışmanlık daha fazla alan açar. Soru acil ama basitse, müsaitlik derin uzmanlıktan daha önemli olabilir. Soru hassassa, üslubu güvenli ve sakin hissettiren bir danışman seçin.', 'GoldMoodAstro, kullanıcıların net bir soru, ilgili tarihler ya da bağlam ve gerçekçi beklentilerle hazırlanmasını önerir. Bir seans, kullanıcı garantili bir cevap aramak yerine düşünmeye açık olduğunda en faydalı halini alır.'] },
        { title: 'Ödeme, değer ve sorumluluk', paragraphs: ['Güvenli ödeme ve net rezervasyon detayları belirsizliği azaltır. Kullanıcılar onaylamadan önce süreyi, fiyatı ve hizmet türünü görebilmelidir. Seans sonrasında değer; çoğu zaman notlardan, kazanılan bakış açısından ve kullanıcının atabileceği bir sonraki adımdan gelir. İyi bir manevi rehberlik, kullanıcıyı bağımlı değil daha yetkin hissettirmelidir.', 'Astroloji, tarot ve sembolik yorumlar birer rehberlik aracıdır. Hukuki, tıbbi, psikolojik ya da finansal tavsiyenin yerini almazlar. Bu nedenle fiyatlandırma, garantili sonuçlar için değil; yorumlama süresi ve bakış açısı için yapılan bir ödeme olarak anlaşılmalıdır.'] },
      ],
      faq: [
        { question: 'Hangi seansı seçmeliyim?', answer: 'Sorunuzun karmaşıklığına, danışman uzmanlığına ve ihtiyaç duyduğunuz süreye göre seçim yapın.' },
        { question: 'Sonuçlar garantili midir?', answer: 'Hayır. Seanslar rehberlik ve yorum sunar; garantili sonuç vermez.' },
      ],
      image: '/img/og-default.png',
      authorTitle: 'Danışan rehberliği editörleri',
      expertise: ['Fiyatlandırma', 'Manevi Rehberlik', 'Randevu'],
    },
    de: {
      slug: 'pricing',
      title: 'Leitfaden zu Sitzungspreisen',
      description: 'Verstehen Sie die Sitzungspreise, Guthabenpakete und Beraterhonorare von GoldMoodAstro und wie Sie die passende Beratungsoption wählen.',
      eyebrow: 'Preise',
      lead: 'Preise lassen sich leichter einschätzen, wenn man versteht, was sich zwischen einer schnellen Lesung, einer vollständigen Sitzung und einer Fachberatung ändert.',
      summary: 'Die Preisgestaltung von GoldMoodAstro basiert auf transparenten Sitzungsoptionen und der Expertise der Beraterinnen und Berater. Ein günstigerer Preis kann für eine fokussierte Frage passend sein, während eine längere oder stärker spezialisierte Sitzung bei Beziehungsmustern, Geburtshoroskop-Arbeit, wiederkehrenden Träumen oder komplexen Entscheidungen die bessere Wahl sein kann.',
      sections: [
        { title: 'Was den Sitzungspreis beeinflusst', paragraphs: ['Erfahrung der Beraterin oder des Beraters, Sitzungsdauer, Leistungsart und Medienformat können den Preis beeinflussen. Eine kurze schriftliche oder sprachbasierte Lesung erfordert oft weniger Zeit als eine vollständige horoskopbasierte Beratung. Videositzungen können zusätzliche Vorbereitung und Live-Deutung umfassen. Die beste Wahl ist nicht immer die teuerste, sondern das Format, das zur Frage passt.', 'Vor der Buchung sollten Nutzerinnen und Nutzer das Beraterprofil, die Fachgebiete, Sprachen, Bewertungen und die verfügbaren Leistungsbeschreibungen lesen. Eine gute Übereinstimmung zwischen Frage und Beraterkompetenz zählt meist mehr als die Auswahl allein nach dem Preis.'] },
        { title: 'Die richtige Option wählen', paragraphs: ['Für eine einzelne Entscheidung kann eine fokussierte kurze Sitzung ausreichen. Für Geburtshoroskop, Synastrie, eine lange Beziehungsgeschichte oder wiederkehrende emotionale Muster schafft eine längere Beratung mehr Raum. Ist die Frage dringend, aber einfach, kann Verfügbarkeit wichtiger sein als tiefe Spezialisierung. Ist die Frage sensibel, wählen Sie eine Beraterin oder einen Berater, deren Ton sich sicher und geerdet anfühlt.', 'GoldMoodAstro empfiehlt, eine klare Frage, relevante Daten oder Hintergründe sowie realistische Erwartungen vorzubereiten. Eine Sitzung ist am hilfreichsten, wenn man offen für Reflexion ist, statt eine garantierte Antwort zu erwarten.'] },
        { title: 'Zahlung, Wert und Verantwortung', paragraphs: ['Sichere Zahlung und klare Buchungsdetails reduzieren Unsicherheit. Dauer, Preis und Leistungsart sollten vor der Bestätigung sichtbar sein. Nach der Sitzung entsteht der Wert oft aus Notizen, neuen Perspektiven und dem nächsten Schritt, den man gehen kann. Gute spirituelle Begleitung sollte die Person handlungsfähiger machen, nicht abhängiger.', 'Astrologie, Tarot und symbolische Lesungen sind Orientierungswerkzeuge. Sie ersetzen keine rechtliche, medizinische, psychologische oder finanzielle Beratung. Der Preis ist daher als Vergütung für Deutungszeit und Perspektive zu verstehen, nicht für garantierte Ergebnisse.'] },
      ],
      faq: [
        { question: 'Welche Sitzung sollte ich wählen?', answer: 'Wählen Sie nach der Komplexität Ihrer Frage, der Expertise der Beraterin oder des Beraters und der Zeit, die Sie benötigen.' },
        { question: 'Sind Ergebnisse garantiert?', answer: 'Nein. Sitzungen bieten Orientierung und Deutung, keine garantierten Ergebnisse.' },
      ],
      image: '/img/og-default.png',
      authorTitle: 'Redaktion für Klientenberatung',
      expertise: ['Preise', 'Spirituelle Begleitung', 'Buchung'],
    },
  },
  yildizname: {
    en: {
      slug: 'yildizname',
      title: 'Yildizname Guide',
      description: 'A responsible guide to yildizname, ebced symbolism, lunar mansions and reflective interpretation.',
      eyebrow: 'Yildizname',
      lead: 'Yildizname is a traditional symbolic reading style that connects names, numbers and lunar mansion language.',
      summary: 'Yildizname should be approached as cultural and symbolic guidance. It can open reflection around temperament, timing, emotional tendencies and life themes, but it should not be used as fear-based certainty or as a replacement for personal judgment.',
      sections: [
        { title: 'How yildizname is read', paragraphs: ['Traditional yildizname uses names, birth year and ebced-style number symbolism to connect a person with interpretive themes. These themes are often expressed through lunar mansions, elemental qualities or symbolic descriptions. The value is not in treating the result as an absolute label, but in asking which parts of the reading create recognition.', 'A responsible reading explains the symbolic method without exaggerating its authority. Names and numbers can become a language for reflection, but the person remains more complex than any formula.'] },
        { title: 'What it can reveal', paragraphs: ['Yildizname may describe recurring emotional patterns, relational tendencies, periods of patience, ambition, sensitivity or inner conflict. It can also invite the person to notice strengths that are easy to overlook. A reading becomes more useful when it gives grounded suggestions rather than dramatic warnings.', 'GoldMoodAstro presents yildizname content in a way that respects tradition while avoiding fatalism. The aim is to support calm insight, not anxiety.'] },
        { title: 'Using the result wisely', paragraphs: ['Read the result slowly and compare it with lived experience. Keep what supports awareness and leave what does not fit. A symbolic reading should not pressure anyone into a decision. It can be a mirror for questions, timing and self-understanding, but real life still asks for communication, planning and care.', 'If a topic involves health, money, law, safety or crisis, professional help should guide the decision. Spiritual readings can accompany reflection, but they should not carry responsibilities they are not designed to carry.'] },
      ],
      faq: [
        { question: 'Is yildizname a fixed destiny reading?', answer: 'No. It is best used as symbolic and cultural guidance.' },
        { question: 'What information improves the reading?', answer: 'Clear name information, birth year and a focused question help create a more useful interpretation.' },
      ],
      image: '/img/yildizname.png',
      authorTitle: 'Traditional symbolism editors',
      expertise: ['Yildizname', 'Ebced', 'Symbolic Guidance'],
    },
    tr: {
      slug: 'yildizname',
      title: 'Yıldızname Rehberi',
      description: 'Yıldızname, ebced sembolizmi, ay menzilleri ve düşünmeye davet eden yorumlama üzerine sorumlu bir rehber.',
      eyebrow: 'Yıldızname',
      lead: 'Yıldızname; isimleri, sayıları ve ay menzili dilini birbirine bağlayan geleneksel bir sembolik okuma biçimidir.',
      summary: 'Yıldıznameye kültürel ve sembolik bir rehberlik olarak yaklaşılmalıdır. Mizaç, zamanlama, duygusal eğilimler ve yaşam temaları üzerine düşünme alanı açabilir; ancak korku temelli bir kesinlik ya da kişisel muhakemenin yerine geçen bir araç olarak kullanılmamalıdır.',
      sections: [
        { title: 'Yıldızname nasıl okunur', paragraphs: ['Geleneksel yıldızname; isimleri, doğum yılını ve ebced usulü sayı sembolizmini kullanarak kişiyi yorumsal temalarla buluşturur. Bu temalar çoğu zaman ay menzilleri, element nitelikleri ya da sembolik tasvirlerle ifade edilir. Değer, sonucu mutlak bir etiket gibi görmekte değil; okumanın hangi bölümlerinin içinizde bir tanışıklık uyandırdığını sormaktadır.', 'Sorumlu bir okuma, sembolik yöntemi otoritesini abartmadan açıklar. İsimler ve sayılar düşünmek için bir dil haline gelebilir; ancak insan, her formülden daha karmaşıktır.'] },
        { title: 'Neleri ortaya çıkarabilir', paragraphs: ['Yıldızname; tekrarlayan duygusal örüntüleri, ilişkisel eğilimleri, sabır dönemlerini, hırsı, hassasiyeti ya da içsel çatışmayı tarif edebilir. Ayrıca kişiyi, gözden kaçırması kolay güçlü yanlarını fark etmeye davet edebilir. Bir okuma, dramatik uyarılar yerine ayakları yere basan öneriler sunduğunda daha faydalı hale gelir.', 'GoldMoodAstro, yıldızname içeriğini geleneğe saygı duyan ama kadercilikten kaçınan bir anlayışla sunar. Amaç kaygıyı değil, sakin bir içgörüyü desteklemektir.'] },
        { title: 'Sonucu akıllıca kullanmak', paragraphs: ['Sonucu sindirerek okuyun ve yaşanmış deneyiminizle karşılaştırın. Farkındalığı destekleyeni alın, uymayanı bırakın. Sembolik bir okuma kimseyi bir karara zorlamamalıdır. Sorular, zamanlama ve kendini anlama için bir ayna olabilir; ancak gerçek hayat yine de iletişim, planlama ve özen ister.', 'Konu sağlık, para, hukuk, güvenlik ya da kriz içeriyorsa, karara profesyonel yardım rehberlik etmelidir. Manevi okumalar düşünme sürecine eşlik edebilir; ancak taşımak için tasarlanmadıkları sorumlulukları üstlenmemelidir.'] },
      ],
      faq: [
        { question: 'Yıldızname değişmez bir kader okuması mıdır?', answer: 'Hayır. En doğru kullanım, onu sembolik ve kültürel bir rehberlik olarak görmektir.' },
        { question: 'Hangi bilgiler okumayı iyileştirir?', answer: 'Net isim bilgisi, doğum yılı ve odaklı bir soru, daha faydalı bir yorumun oluşmasına yardımcı olur.' },
      ],
      image: '/img/yildizname.png',
      authorTitle: 'Geleneksel sembolizm editörleri',
      expertise: ['Yıldızname', 'Ebced', 'Sembolik Rehberlik'],
    },
    de: {
      slug: 'yildizname',
      title: 'Yildizname-Leitfaden',
      description: 'Ein verantwortungsvoller Leitfaden zu Yildizname, Ebced-Symbolik, Mondstationen und reflektierender Deutung.',
      eyebrow: 'Yildizname',
      lead: 'Yildizname ist ein traditioneller symbolischer Lesestil, der Namen, Zahlen und die Sprache der Mondstationen miteinander verbindet.',
      summary: 'Yildizname sollte als kulturelle und symbolische Orientierung verstanden werden. Es kann Reflexion über Temperament, Timing, emotionale Neigungen und Lebensthemen anregen, sollte aber weder als angstbasierte Gewissheit noch als Ersatz für das eigene Urteilsvermögen dienen.',
      sections: [
        { title: 'Wie Yildizname gelesen wird', paragraphs: ['Das traditionelle Yildizname verwendet Namen, Geburtsjahr und Zahlensymbolik im Ebced-Stil, um eine Person mit deutenden Themen zu verbinden. Diese Themen werden häufig über Mondstationen, elementare Qualitäten oder symbolische Beschreibungen ausgedrückt. Der Wert liegt nicht darin, das Ergebnis als absolutes Etikett zu behandeln, sondern zu fragen, welche Teile der Lesung Wiedererkennung auslösen.', 'Eine verantwortungsvolle Lesung erklärt die symbolische Methode, ohne ihre Autorität zu übertreiben. Namen und Zahlen können zu einer Sprache der Reflexion werden, doch der Mensch bleibt komplexer als jede Formel.'] },
        { title: 'Was es offenbaren kann', paragraphs: ['Yildizname kann wiederkehrende emotionale Muster, Beziehungsneigungen, Phasen der Geduld, Ehrgeiz, Sensibilität oder innere Konflikte beschreiben. Es kann die Person auch einladen, Stärken wahrzunehmen, die leicht übersehen werden. Eine Lesung wird nützlicher, wenn sie geerdete Anregungen statt dramatischer Warnungen gibt.', 'GoldMoodAstro präsentiert Yildizname-Inhalte auf eine Weise, die die Tradition respektiert und zugleich Fatalismus vermeidet. Ziel ist es, ruhige Einsicht zu fördern, nicht Angst.'] },
        { title: 'Das Ergebnis klug nutzen', paragraphs: ['Lesen Sie das Ergebnis in Ruhe und vergleichen Sie es mit Ihrer gelebten Erfahrung. Behalten Sie, was Ihr Bewusstsein stärkt, und lassen Sie los, was nicht passt. Eine symbolische Lesung sollte niemanden zu einer Entscheidung drängen. Sie kann ein Spiegel für Fragen, Timing und Selbstverständnis sein, doch das reale Leben verlangt weiterhin Kommunikation, Planung und Fürsorge.', 'Wenn ein Thema Gesundheit, Geld, Recht, Sicherheit oder eine Krise betrifft, sollte professionelle Hilfe die Entscheidung leiten. Spirituelle Lesungen können die Reflexion begleiten, aber sie sollten keine Verantwortung tragen, für die sie nicht gedacht sind.'] },
      ],
      faq: [
        { question: 'Ist Yildizname eine feststehende Schicksalslesung?', answer: 'Nein. Am besten nutzt man es als symbolische und kulturelle Orientierung.' },
        { question: 'Welche Informationen verbessern die Lesung?', answer: 'Klare Namensangaben, das Geburtsjahr und eine fokussierte Frage helfen, eine nützlichere Deutung zu erstellen.' },
      ],
      image: '/img/yildizname.png',
      authorTitle: 'Redaktion für traditionelle Symbolik',
      expertise: ['Yildizname', 'Ebced', 'Symbolische Orientierung'],
    },
  },
};

// Locale-normalize + fallback: bilinmeyen locale → tr (birincil pazar); içerik yoksa en.
export function getLanding(type: LandingKey, locale: string): LandingData {
  const loc: LandingLocale = locale === 'en' || locale === 'de' ? locale : 'tr';
  const byLocale = LANDING_CONTENT[type];
  return byLocale[loc] ?? byLocale.en ?? byLocale.tr;
}

// FAQ başlığı sonek + AuthorBio bio metni için basit i18n.
export const LANDING_UI: Record<LandingLocale, { questions: string; bioSuffix: string }> = {
  tr: { questions: 'Soruları', bioSuffix: 'içeriği; açıklık, sorumlu rehberlik ve pratik manevi okuryazarlık için gözden geçirilir.' },
  en: { questions: 'Questions', bioSuffix: 'content is reviewed for clarity, responsible guidance and practical spiritual literacy.' },
  de: { questions: 'Fragen', bioSuffix: 'Inhalte werden auf Klarheit, verantwortungsvolle Orientierung und praktische spirituelle Kompetenz geprüft.' },
};

export function landingLocale(locale: string): LandingLocale {
  return locale === 'en' || locale === 'de' ? locale : 'tr';
}
