export type LandingKey =
  | 'kahve-fali'
  | 'ruya-tabiri'
  | 'birth-chart'
  | 'numeroloji'
  | 'yildizname'
  | 'tarot'
  | 'sinastri'
  | 'pricing'
  | 'buyuk-uclu'
  | 'yukselen-burc';

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
        { title: 'Using astrology responsibly', paragraphs: ['Accurate birth time is the foundation of house and rising sign interpretation. If the time is wrong or unknown, the houses and the ascendant shift, and the reading is then based on a chart that is not merely incomplete but incorrect. Rather than working from a guess, we recommend a rectification study that determines the time from documented life events. This distinction should always be clear so the user understands the confidence level of the analysis.', 'GoldMoodAstro avoids fatalistic claims. Astrology can support reflection, planning and emotional language, but important decisions should also consider real-world information and professional advice when needed. The chart is a map; the life is still lived through choice, relationship and action.'] },
        { title: 'Birth Time Rectification (Determining the Birth Time)', paragraphs: ['Birth time rectification is a professional astrological analysis for people who do not know their birth time or are unsure whether the recorded time is correct. An accurate birth time is essential for the rising sign, house placements, planetary positions and forward-looking timing techniques to be interpreted reliably.', 'A rectification study examines the date of birth, the place of birth and the known time range, together with major turning points: marriage, divorce, the birth of children, education, career changes, relocation, health processes and significant developments in the lives of family members. These events are compared against astrological transits, progressions, solar returns and other timing techniques in order to establish the birth time with the highest probability of accuracy.', 'Rectification is an important step towards more precise birth chart analysis, career astrology, relationship (synastry) analysis, annual forecasts and transit readings. Because it requires extensive research and an individual assessment, it is carried out as a detailed consultation process rather than an instant calculation.', 'Since every life story is unique, the birth time reached through rectification represents the strongest astrological probability supported by the available data. The aim is to have your birth chart constructed as accurately as possible, so that every further analysis rests on a more reliable foundation.'] },
      ],
      faq: [
        { question: 'Do I need an exact birth time?', answer: 'Yes. The rising sign, house placements and timing techniques all depend directly on the birth time; if the time is wrong or missing, the chart itself is built incorrectly and the reading cannot be relied upon. If you do not know your birth time, we recommend a rectification analysis — which determines it from your life events — rather than working from a guess.' },
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
        { title: 'Astrolojiyi sorumlu kullanmak', paragraphs: ['Doğru doğum saati, ev ve yükselen burç yorumunun temelidir. Saat yanlış ya da bilinmiyorsa evler ve yükselen kayar; bu durumda yapılan yorum eksik değil, doğrudan yanlış bir harita üzerinden yapılmış olur. Saat bilinmiyorsa tahminle ilerlemek yerine, yaşam olaylarından yola çıkarak saati belirleyen rektifikasyon çalışması önerilir. Kullanıcının analizin güven düzeyini anlayabilmesi için bu ayrım her zaman açıkça belirtilmelidir.', 'GoldMoodAstro kaderci iddialardan kaçınır. Astroloji; düşünmeyi, planlamayı ve duygusal bir dil kurmayı destekleyebilir; ancak önemli kararlarda gerçek dünya bilgileri ve gerektiğinde profesyonel tavsiye de dikkate alınmalıdır. Harita bir haritadır; hayat yine de seçimle, ilişkiyle ve eylemle yaşanır.'] },
        { title: 'Doğum Saati Rektifikasyonu (Doğum Saati Belirleme)', paragraphs: ['Doğum saati rektifikasyonu, doğum saatini bilmeyen veya doğum saatinin doğruluğundan emin olmayan kişiler için uygulanan profesyonel bir astrolojik analizdir. Doğru doğum saati; yükselen burç, ev yerleşimleri, gezegen konumları ve geleceğe yönelik zamanlama tekniklerinin güvenilir şekilde yorumlanabilmesi için büyük önem taşır.', 'Rektifikasyon çalışmasında doğum tarihi, doğum yeri ve bilinen doğum saati aralığının yanı sıra; evlilik, boşanma, çocukların doğumu, eğitim, kariyer değişiklikleri, taşınma, sağlık süreçleri, aile bireylerinin yaşamındaki önemli gelişmeler ve diğer dönüm noktaları detaylı olarak incelenir. Bu bilgiler, astrolojik transitler, progresyonlar, solar dönüşler ve diğer zamanlama teknikleriyle karşılaştırılarak en yüksek doğruluk oranına sahip doğum saati belirlenmeye çalışılır.', 'Doğum saati rektifikasyonu; doğum haritası analizi, kariyer astrolojisi, ilişki (sinastri) analizi, yıllık öngörüler ve transit yorumlarının daha isabetli yapılabilmesi için önemli bir adımdır. Bu hizmet, kapsamlı araştırma ve kişiye özel değerlendirme gerektirdiğinden detaylı bir danışmanlık süreci olarak yürütülür.', 'Her bireyin yaşam öyküsü kendine özgü olduğundan, rektifikasyon sonucunda ulaşılan doğum saati mevcut veriler doğrultusunda elde edilen en güçlü astrolojik olasılığı ifade eder. Amaç, doğum haritanızın mümkün olan en doğru şekilde oluşturulmasını sağlayarak daha güvenilir ve kapsamlı astrolojik analizler sunmaktır.'] },
      ],
      faq: [
        { question: 'Kesin bir doğum saatine ihtiyacım var mı?', answer: 'Evet. Yükselen burç, ev yerleşimleri ve zamanlama teknikleri doğrudan doğum saatine dayanır; saat yanlış ya da eksikse harita da yanlış kurulur ve yorum güvenilir olmaz. Doğum saatinizi bilmiyorsanız tahminle ilerlemek yerine, yaşam olaylarınızdan yola çıkarak saati belirleyen rektifikasyon analizini öneririz.' },
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
        { title: 'Astrologie verantwortungsvoll nutzen', paragraphs: ['Eine genaue Geburtszeit ist die Grundlage der Häuser- und Aszendentendeutung. Ist die Zeit falsch oder unbekannt, verschieben sich Häuser und Aszendent; die Deutung beruht dann nicht auf einem unvollständigen, sondern auf einem falschen Horoskop. Statt einer Schätzung empfehlen wir eine Rektifikation, die die Zeit aus dokumentierten Lebensereignissen ermittelt. Diese Unterscheidung sollte immer transparent sein, damit die Nutzerinnen und Nutzer das Vertrauensniveau der Analyse verstehen.', 'GoldMoodAstro vermeidet fatalistische Aussagen. Astrologie kann Reflexion, Planung und emotionale Sprache unterstützen, doch wichtige Entscheidungen sollten auch reale Informationen und bei Bedarf professionelle Beratung einbeziehen. Das Horoskop ist eine Landkarte; das Leben wird weiterhin durch Entscheidungen, Beziehungen und Handeln gelebt.'] },
        { title: 'Geburtszeit-Rektifikation (Bestimmung der Geburtszeit)', paragraphs: ['Die Geburtszeit-Rektifikation ist eine professionelle astrologische Analyse für Menschen, die ihre Geburtszeit nicht kennen oder sich über deren Richtigkeit nicht sicher sind. Eine genaue Geburtszeit ist entscheidend, damit Aszendent, Häuserstellungen, Planetenpositionen und zukunftsbezogene Timing-Techniken verlässlich gedeutet werden können.', 'In einer Rektifikation werden Geburtsdatum, Geburtsort und der bekannte Zeitraum gemeinsam mit wichtigen Wendepunkten untersucht: Heirat, Scheidung, Geburt der Kinder, Ausbildung, berufliche Veränderungen, Umzüge, gesundheitliche Prozesse und bedeutende Entwicklungen im Leben von Familienangehörigen. Diese Ereignisse werden mit astrologischen Transiten, Progressionen, Solarrückläufen und weiteren Timing-Techniken abgeglichen, um die Geburtszeit mit der höchsten Treffsicherheit zu bestimmen.', 'Die Rektifikation ist ein wichtiger Schritt zu treffenderen Geburtshoroskop-Analysen, Berufsastrologie, Beziehungsanalysen (Synastrie), Jahresprognosen und Transitdeutungen. Da sie umfangreiche Recherche und eine individuelle Auswertung erfordert, wird sie als ausführlicher Beratungsprozess durchgeführt und nicht als sofortige Berechnung.', 'Da jede Lebensgeschichte einzigartig ist, stellt die durch Rektifikation ermittelte Geburtszeit die stärkste astrologische Wahrscheinlichkeit auf Basis der vorliegenden Daten dar. Ziel ist es, Ihr Geburtshoroskop so genau wie möglich zu erstellen, damit jede weitere Analyse auf einer verlässlicheren Grundlage steht.'] },
      ],
      faq: [
        { question: 'Brauche ich eine exakte Geburtszeit?', answer: 'Ja. Aszendent, Häuserstellungen und Timing-Techniken hängen unmittelbar von der Geburtszeit ab; ist die Zeit falsch oder unbekannt, wird bereits das Horoskop falsch erstellt und die Deutung ist nicht verlässlich. Wenn Sie Ihre Geburtszeit nicht kennen, empfehlen wir statt einer Schätzung eine Rektifikation, die die Zeit aus Ihren Lebensereignissen ermittelt.' },
        { question: 'Ist ein Geburtshoroskop ein festes Schicksal?', answer: 'Nein. Es zeigt symbolische Muster und Potenziale, kein unausweichliches Drehbuch.' },
      ],
      image: '/img/natal_chart.png',
      authorTitle: 'Redaktion für Geburtshoroskope',
      expertise: ['Geburtshoroskop', 'Astrologie', 'Natal-Analyse'],
    },
  },
  numeroloji: {
    en: {
      slug: 'numerology',
      title: 'Numerology Analysis Guide',
      description: 'A practical guide to numerology, life path numbers, name symbolism, personal cycles and responsible interpretation.',
      eyebrow: 'Numerology',
      lead: 'Numerology reads numbers in names and birth dates as symbolic patterns for rhythm, motivation and repeating life themes.',
      summary: 'Numerology does not define fixed fate. It supports self-awareness by interpreting name, birth date and number symbolism around strengths, decision style and personal cycles. GoldMoodAstro treats numbers as reflective language rather than absolute labels.',
      sections: [
        { title: 'How numerology works', paragraphs: ['Birth dates and letters are converted into number values such as life path, destiny number, soul urge and personal year. Each number carries symbolic themes, but those themes become useful only when they are read with context.', 'A good numerology reading explains the calculation, names the pattern and offers grounded reflection. It should help the person notice tendencies without reducing their whole identity to a number.'] },
        { title: 'What numerology can show', paragraphs: ['Numerology can help users notice strengths, repeating patterns and themes that become more active in certain periods. It can clarify why some decisions feel aligned while others create friction.', 'It should not be the only source for decisions, but it can create a useful structure for self-observation, journaling and calmer planning.'] },
        { title: 'GoldMoodAstro numerology approach', paragraphs: ['We avoid fear-based or deterministic language. Numbers are treated as symbols that widen awareness and choice, not as verdicts about personality or future.', 'For a better reading, enter birth data carefully and compare the result with recurring patterns in daily life. The most useful insight is the one that helps you act with more clarity.'] },
      ],
      faq: [
        { question: 'What is numerology?', answer: 'Numerology interprets symbolic meanings such as life path, destiny number and personal cycles through name and birth date.' },
        { question: 'What is numerology analysis useful for?', answer: 'It helps a person notice strengths, repeating patterns and themes to consider in decision-making.' },
      ],
      image: '/img/natal_chart.png',
      authorTitle: 'Numerology and personal cycles editors',
      expertise: ['Numerology', 'Personal Cycles', 'Awareness'],
    },
    tr: {
      slug: 'numeroloji',
      title: 'Numeroloji Analizi Rehberi',
      description: 'Numeroloji, hayat yolu sayısı, isim sembolizmi, kişisel döngüler ve sorumlu yorumlama üzerine pratik bir rehber.',
      eyebrow: 'Numeroloji',
      lead: 'Numeroloji; isimlerdeki ve doğum tarihlerindeki sayıları ritim, motivasyon ve tekrar eden yaşam temaları için sembolik örüntüler olarak okur.',
      summary: 'Numeroloji değişmez bir kader tanımı yapmaz. İsim, doğum tarihi ve sayı sembolizmini güçlü yanlar, karar tarzı ve kişisel döngüler çevresinde yorumlayarak öz farkındalığı destekler. GoldMoodAstro sayıları mutlak etiketler değil, düşünmeye yardımcı bir dil olarak ele alır.',
      sections: [
        { title: 'Numeroloji nasıl çalışır', paragraphs: ['Doğum tarihleri ve harfler; hayat yolu, kader sayısı, ruh arzusu ve kişisel yıl gibi değerlere dönüştürülür. Her sayı sembolik temalar taşır; fakat bu temalar ancak bağlamla okunduğunda faydalı hale gelir.', 'İyi bir numeroloji yorumu hesaplamayı açıklar, örüntüyü adlandırır ve ayakları yere basan bir düşünme zemini sunar. Kişiyi yalnızca bir sayıya indirgemeden eğilimlerini fark etmesine yardımcı olmalıdır.'] },
        { title: 'Numeroloji neleri gösterebilir', paragraphs: ['Numeroloji, kullanıcıların güçlü yanlarını, tekrar eden örüntülerini ve belirli dönemlerde daha görünür hale gelen temaları fark etmesine yardımcı olabilir. Bazı kararların neden uyumlu, bazılarının neden sürtünmeli hissettirdiğini açıklığa kavuşturabilir.', 'Kararlar için tek kaynak olmamalıdır; ancak kendini gözlemlemek, günlük tutmak ve daha sakin plan yapmak için yararlı bir yapı sunabilir.'] },
        { title: 'GoldMoodAstro numeroloji yaklaşımı', paragraphs: ['Korku temelli ya da kaderci bir dilden kaçınırız. Sayılar; kişilik ya da gelecek hakkında hüküm değil, farkındalığı ve seçimi genişleten semboller olarak ele alınır.', 'Daha iyi bir okuma için doğum bilgilerini dikkatle girin ve sonucu günlük hayatta tekrar eden örüntülerle karşılaştırın. En yararlı içgörü, daha net hareket etmenize yardımcı olandır.'] },
      ],
      faq: [
        { question: 'Numeroloji nedir?', answer: 'Numeroloji; hayat yolu, kader sayısı ve kişisel döngüler gibi sembolik anlamları isim ve doğum tarihi üzerinden yorumlar.' },
        { question: 'Numeroloji analizi ne işe yarar?', answer: 'Kişinin güçlü yanlarını, tekrar eden örüntülerini ve karar süreçlerinde dikkate alabileceği temaları fark etmesine yardımcı olur.' },
      ],
      image: '/img/natal_chart.png',
      authorTitle: 'Numeroloji ve kişisel döngüler editörleri',
      expertise: ['Numeroloji', 'Kişisel Döngüler', 'Farkındalık'],
    },
    de: {
      slug: 'numerologie',
      title: 'Leitfaden zur Numerologie-Analyse',
      description: 'Ein praktischer Leitfaden zu Numerologie, Lebenswegzahl, Namenssymbolik, persönlichen Zyklen und verantwortungsvoller Deutung.',
      eyebrow: 'Numerologie',
      lead: 'Numerologie liest Zahlen in Namen und Geburtsdaten als symbolische Muster für Rhythmus, Motivation und wiederkehrende Lebensthemen.',
      summary: 'Numerologie legt kein festes Schicksal fest. Sie unterstützt Selbstwahrnehmung, indem Name, Geburtsdatum und Zahlensymbolik rund um Stärken, Entscheidungsstil und persönliche Zyklen gedeutet werden. GoldMoodAstro versteht Zahlen als reflektierende Sprache, nicht als absolute Etiketten.',
      sections: [
        { title: 'Wie Numerologie funktioniert', paragraphs: ['Geburtsdaten und Buchstaben werden in Zahlenwerte wie Lebenswegzahl, Schicksalszahl, Seelenwunsch und persönliches Jahr übersetzt. Jede Zahl trägt symbolische Themen, doch nützlich werden sie erst im Kontext.', 'Eine gute numerologische Deutung erklärt die Berechnung, benennt das Muster und bietet geerdete Reflexion. Sie soll Tendenzen sichtbar machen, ohne die Person auf eine Zahl zu reduzieren.'] },
        { title: 'Was Numerologie zeigen kann', paragraphs: ['Numerologie kann helfen, Stärken, wiederkehrende Muster und Themen zu erkennen, die in bestimmten Phasen aktiver werden. Sie kann verdeutlichen, warum manche Entscheidungen stimmig wirken und andere Reibung erzeugen.', 'Sie sollte nicht die einzige Entscheidungsgrundlage sein, kann aber eine hilfreiche Struktur für Selbstbeobachtung, Journaling und ruhigeres Planen bieten.'] },
        { title: 'Der GoldMoodAstro-Ansatz', paragraphs: ['Wir vermeiden angstbasierte oder deterministische Sprache. Zahlen werden als Symbole behandelt, die Bewusstsein und Wahlmöglichkeiten erweitern, nicht als Urteile über Persönlichkeit oder Zukunft.', 'Für eine bessere Lesung geben Sie Geburtsdaten sorgfältig ein und vergleichen Sie das Ergebnis mit wiederkehrenden Mustern im Alltag. Die wertvollste Einsicht ist die, die klareres Handeln ermöglicht.'] },
      ],
      faq: [
        { question: 'Was ist Numerologie?', answer: 'Numerologie deutet symbolische Bedeutungen wie Lebenswegzahl, Schicksalszahl und persönliche Zyklen über Name und Geburtsdatum.' },
        { question: 'Wofür ist eine Numerologie-Analyse nützlich?', answer: 'Sie hilft, Stärken, wiederkehrende Muster und Themen für Entscheidungen bewusster wahrzunehmen.' },
      ],
      image: '/img/natal_chart.png',
      authorTitle: 'Redaktion für Numerologie und persönliche Zyklen',
      expertise: ['Numerologie', 'Persönliche Zyklen', 'Bewusstsein'],
    },
  },
  tarot: {
    en: {
      slug: 'tarot',
      title: 'Tarot Reading and Card Meanings Guide',
      description: 'A responsible guide to tarot spreads, card meanings, relationship questions, career decisions and symbolic spiritual guidance.',
      eyebrow: 'Tarot Guidance',
      lead: 'Tarot is a symbolic guidance method that helps reveal emotions, options and decision patterns through the language of cards.',
      summary: 'Tarot does not give fixed future statements. It opens a symbolic space to reflect on current energy, questions and choices. On GoldMoodAstro, tarot is interpreted through responsible guidance for relationships, career, decisions and self-awareness.',
      sections: [
        { title: 'How tarot works', paragraphs: ['A tarot deck speaks through archetypes and symbols. A card is not read only by its dictionary meaning; the question, emotional context and the relationship between cards all matter.', 'Single card readings offer quick insight, three card spreads create a broader timeline, and deeper spreads help with layered questions about decisions, relationships and direction.'] },
        { title: 'What tarot can help you learn', paragraphs: ['Tarot can clarify relationship dynamics, emotional confusion around a choice, career motivation or the quiet voice underneath a question. It does not say "this will happen"; it says "this theme is asking for attention."', 'After a reading, users often see the real question, the emotion influencing the decision and the option that requires more awareness.'] },
        { title: 'GoldMoodAstro tarot approach', paragraphs: ['GoldMoodAstro tarot content is informed by Rider-Waite-Smith symbolism and written in clear modern language. We avoid fear, dependency and absolute fate claims.', 'A strong tarot question is specific and reflective. Instead of "what will happen?", ask "what do I need to see here?" or "which dynamic is active in this relationship?"'] },
      ],
      faq: [
        { question: 'What is a tarot reading?', answer: 'A tarot reading interprets questions, emotions and possibilities through card symbols.' },
        { question: 'Does tarot predict the future with certainty?', answer: 'No. Tarot is symbolic guidance that brings awareness to current energies and choices.' },
      ],
      image: '/img/tarot.png',
      authorTitle: 'Tarot and symbolism editors',
      expertise: ['Tarot', 'Symbolism', 'Spiritual Guidance'],
    },
    tr: {
      slug: 'tarot',
      title: 'Tarot Falı ve Kart Anlamları Rehberi',
      description: 'Tarot açılımları, kart anlamları, ilişki soruları, kariyer kararları ve sembolik manevi rehberlik üzerine sorumlu bir rehber.',
      eyebrow: 'Tarot Rehberliği',
      lead: 'Tarot, kartların diliyle duyguları, seçenekleri ve karar örüntülerini görünür kılmaya yardımcı olan sembolik bir rehberlik yöntemidir.',
      summary: 'Tarot değişmez gelecek cümleleri vermez. Mevcut enerji, soru ve seçimler üzerine düşünmek için sembolik bir alan açar. GoldMoodAstro’da tarot; ilişkiler, kariyer, kararlar ve öz farkındalık için sorumlu rehberlik anlayışıyla yorumlanır.',
      sections: [
        { title: 'Tarot nasıl çalışır', paragraphs: ['Bir tarot destesi arketipler ve semboller aracılığıyla konuşur. Bir kart yalnızca sözlük anlamıyla okunmaz; soru, duygusal bağlam ve kartlar arasındaki ilişki de önemlidir.', 'Tek kart açılımları hızlı içgörü sunar, üç kart açılımları daha geniş bir zaman çizgisi kurar, derin açılımlar ise kararlar, ilişkiler ve yön arayışı gibi katmanlı sorulara alan açar.'] },
        { title: 'Tarot neyi fark ettirebilir', paragraphs: ['Tarot; ilişki dinamiklerini, bir seçim etrafındaki duygusal karışıklığı, kariyer motivasyonunu ya da sorunun altındaki daha sessiz sesi netleştirebilir. "Bu olacak" demez; "bu tema dikkat istiyor" der.', 'Okumadan sonra kullanıcı çoğu zaman asıl soruyu, kararı etkileyen duyguyu ve daha fazla farkındalık isteyen seçeneği görür.'] },
        { title: 'GoldMoodAstro tarot yaklaşımı', paragraphs: ['GoldMoodAstro tarot içeriği Rider-Waite-Smith sembolizminden beslenir ve açık, modern bir dille yazılır. Korku, bağımlılık ve mutlak kader iddialarından kaçınırız.', 'Güçlü bir tarot sorusu belirli ve düşünmeye açıktır. "Ne olacak?" yerine "burada neyi görmem gerekiyor?" ya da "bu ilişkide hangi dinamik aktif?" diye sormak daha sağlıklıdır.'] },
      ],
      faq: [
        { question: 'Tarot falı nedir?', answer: 'Tarot falı; soru, duygu ve olasılıkları kart sembolleri üzerinden yorumlayan bir rehberlik yöntemidir.' },
        { question: 'Tarot geleceği kesin olarak söyler mi?', answer: 'Hayır. Tarot, mevcut enerji ve seçimlere farkındalık getiren sembolik bir rehberliktir.' },
      ],
      image: '/img/tarot.png',
      authorTitle: 'Tarot ve sembolizm editörleri',
      expertise: ['Tarot', 'Sembolizm', 'Manevi Rehberlik'],
    },
    de: {
      slug: 'tarot',
      title: 'Leitfaden zu Tarotlegung und Kartenbedeutungen',
      description: 'Ein verantwortungsvoller Leitfaden zu Tarotlegungen, Kartenbedeutungen, Beziehungsfragen, Karriereentscheidungen und symbolischer spiritueller Orientierung.',
      eyebrow: 'Tarot-Orientierung',
      lead: 'Tarot ist eine symbolische Orientierungsmethode, die Gefühle, Optionen und Entscheidungsmuster durch die Sprache der Karten sichtbar macht.',
      summary: 'Tarot gibt keine festen Zukunftsaussagen. Es öffnet einen symbolischen Raum, um über aktuelle Energie, Fragen und Entscheidungen nachzudenken. Auf GoldMoodAstro wird Tarot verantwortungsvoll für Beziehungen, Beruf, Entscheidungen und Selbstwahrnehmung gedeutet.',
      sections: [
        { title: 'Wie Tarot funktioniert', paragraphs: ['Ein Tarotdeck spricht durch Archetypen und Symbole. Eine Karte wird nicht nur nach ihrer Wörterbuchbedeutung gelesen; Frage, emotionaler Kontext und die Beziehung der Karten zueinander zählen ebenfalls.', 'Einzelkarten bieten schnelle Einsicht, Drei-Karten-Legungen schaffen einen weiteren Zeitrahmen, und tiefere Legungen helfen bei vielschichtigen Fragen zu Entscheidungen, Beziehungen und Richtung.'] },
        { title: 'Was Tarot sichtbar machen kann', paragraphs: ['Tarot kann Beziehungsdynamiken, emotionale Verwirrung rund um eine Entscheidung, berufliche Motivation oder die leise Stimme unter einer Frage klären. Es sagt nicht "das wird passieren", sondern "dieses Thema braucht Aufmerksamkeit".', 'Nach einer Lesung erkennen Nutzerinnen und Nutzer oft die eigentliche Frage, die Emotion hinter der Entscheidung und die Option, die mehr Bewusstsein braucht.'] },
        { title: 'Der GoldMoodAstro-Tarotansatz', paragraphs: ['GoldMoodAstro-Tarotinhalte orientieren sich an Rider-Waite-Smith-Symbolik und sind in klarer moderner Sprache verfasst. Wir vermeiden Angst, Abhängigkeit und absolute Schicksalsbehauptungen.', 'Eine starke Tarotfrage ist konkret und reflektierend. Fragen Sie statt "Was wird passieren?" lieber "Was muss ich hier sehen?" oder "Welche Dynamik ist in dieser Beziehung aktiv?"'] },
      ],
      faq: [
        { question: 'Was ist eine Tarotlegung?', answer: 'Eine Tarotlegung deutet Fragen, Gefühle und Möglichkeiten über Kartensymbole.' },
        { question: 'Sagt Tarot die Zukunft sicher voraus?', answer: 'Nein. Tarot ist symbolische Orientierung, die Bewusstsein für aktuelle Energien und Entscheidungen schafft.' },
      ],
      image: '/img/tarot.png',
      authorTitle: 'Redaktion für Tarot und Symbolik',
      expertise: ['Tarot', 'Symbolik', 'Spirituelle Orientierung'],
    },
  },
  sinastri: {
    en: {
      slug: 'synastry',
      title: 'Synastry and Love Compatibility Guide',
      description: 'A guide to synastry, birth chart comparison, relationship astrology, attraction patterns and conscious communication.',
      eyebrow: 'Synastry Guide',
      lead: 'Synastry compares two birth charts to understand attraction, communication, emotional safety and growth areas in a relationship.',
      summary: 'Synastry does not guarantee relationship outcomes. It shows how two charts interact, which themes flow easily and which areas require more conscious communication. GoldMoodAstro uses relationship astrology as a tool for awareness, not blame.',
      sections: [
        { title: 'How synastry works', paragraphs: ['Synastry compares two birth charts using birth date, time and place. Sun, Moon, Venus, Mars, Mercury and rising signs are read together to understand connection and friction.', 'The same aspect can feel different depending on maturity, timing and lived context. A strong attraction marker is not a promise, and a challenging aspect is not a sentence.'] },
        { title: 'What synastry can reveal', paragraphs: ['Synastry should not reduce a relationship to compatible or incompatible. It helps reveal attraction, trust, communication style, conflict patterns and growth areas.', 'The goal is to understand what needs care, what flows naturally and where clearer boundaries or conversation may help.'] },
        { title: 'Responsible relationship astrology', paragraphs: ['We do not use synastry as a fixed fate judgment. Charts show potentials and challenges, while choices and communication remain human.', 'For the best reading, enter birth data carefully and read the result as a tool for awareness rather than blame.'] },
      ],
      faq: [
        { question: 'What is synastry?', answer: 'Synastry compares two birth charts to explore relationship dynamics, attraction and growth areas.' },
        { question: 'Does synastry give a guaranteed result?', answer: 'No. It shows themes, challenges and opportunities for conscious communication.' },
      ],
      image: '/img/synastry_chart.png',
      authorTitle: 'Astrology and relationship dynamics editors',
      expertise: ['Synastry', 'Relationship Astrology', 'Birth Chart'],
    },
    tr: {
      slug: 'sinastri',
      title: 'Sinastri ve İlişki Uyumu Rehberi',
      description: 'Sinastri, doğum haritası karşılaştırması, ilişki astrolojisi, çekim örüntüleri ve bilinçli iletişim üzerine rehber.',
      eyebrow: 'Sinastri Rehberi',
      lead: 'Sinastri, bir ilişkideki çekimi, iletişimi, duygusal güvenliği ve gelişim alanlarını anlamak için iki doğum haritasını karşılaştırır.',
      summary: 'Sinastri ilişki sonucunu garanti etmez. İki haritanın nasıl etkileştiğini, hangi temaların kolay aktığını ve hangi alanların daha bilinçli iletişim istediğini gösterir. GoldMoodAstro ilişki astrolojisini suçlama değil farkındalık aracı olarak kullanır.',
      sections: [
        { title: 'Sinastri nasıl çalışır', paragraphs: ['Sinastri; doğum tarihi, saat ve yer bilgisiyle iki doğum haritasını karşılaştırır. Güneş, Ay, Venüs, Mars, Merkür ve yükselen burçlar bağlantı ve sürtünmeyi anlamak için birlikte okunur.', 'Aynı açı; olgunluk, zamanlama ve yaşanmış bağlama göre farklı hissedilebilir. Güçlü bir çekim göstergesi vaat değildir; zorlayıcı bir açı da hüküm değildir.'] },
        { title: 'Sinastri neyi gösterebilir', paragraphs: ['Sinastri bir ilişkiyi uyumlu ya da uyumsuz diye basitleştirmemelidir. Çekimi, güveni, iletişim tarzını, çatışma örüntülerini ve gelişim alanlarını görünür kılar.', 'Amaç neyin özen istediğini, neyin doğal aktığını ve nerede daha açık sınır ya da konuşma gerekebileceğini anlamaktır.'] },
        { title: 'Sorumlu ilişki astrolojisi', paragraphs: ['Sinastriyi sabit bir kader yargısı olarak kullanmayız. Haritalar potansiyelleri ve zorlukları gösterir; seçimler ve iletişim ise insana aittir.', 'En iyi okuma için doğum bilgilerini dikkatle girin ve sonucu suçlama değil farkındalık aracı olarak okuyun.'] },
      ],
      faq: [
        { question: 'Sinastri nedir?', answer: 'Sinastri, ilişki dinamiklerini, çekimi ve gelişim alanlarını keşfetmek için iki doğum haritasını karşılaştırır.' },
        { question: 'Sinastri kesin sonuç verir mi?', answer: 'Hayır. Bilinçli iletişim için temaları, zorlukları ve fırsatları gösterir.' },
      ],
      image: '/img/synastry_chart.png',
      authorTitle: 'Astroloji ve ilişki dinamikleri editörleri',
      expertise: ['Sinastri', 'İlişki Astrolojisi', 'Doğum Haritası'],
    },
    de: {
      slug: 'synastrie',
      title: 'Leitfaden zu Synastrie und Liebeskompatibilität',
      description: 'Ein Leitfaden zu Synastrie, Geburtshoroskop-Vergleich, Beziehungsastrologie, Anziehungsmustern und bewusster Kommunikation.',
      eyebrow: 'Synastrie-Leitfaden',
      lead: 'Synastrie vergleicht zwei Geburtshoroskope, um Anziehung, Kommunikation, emotionale Sicherheit und Wachstumsfelder in einer Beziehung zu verstehen.',
      summary: 'Synastrie garantiert keine Beziehungsergebnisse. Sie zeigt, wie zwei Horoskope interagieren, welche Themen leicht fließen und welche Bereiche bewusstere Kommunikation brauchen. GoldMoodAstro nutzt Beziehungsastrologie als Werkzeug für Bewusstsein, nicht für Schuldzuweisung.',
      sections: [
        { title: 'Wie Synastrie funktioniert', paragraphs: ['Synastrie vergleicht zwei Geburtshoroskope anhand von Geburtsdatum, Uhrzeit und Ort. Sonne, Mond, Venus, Mars, Merkur und Aszendenten werden gemeinsam gelesen, um Verbindung und Reibung zu verstehen.', 'Derselbe Aspekt kann je nach Reife, Timing und gelebtem Kontext anders wirken. Ein starkes Anziehungszeichen ist kein Versprechen, und ein herausfordernder Aspekt ist kein Urteil.'] },
        { title: 'Was Synastrie zeigen kann', paragraphs: ['Synastrie sollte eine Beziehung nicht auf kompatibel oder inkompatibel reduzieren. Sie macht Anziehung, Vertrauen, Kommunikationsstil, Konfliktmuster und Wachstumsfelder sichtbar.', 'Ziel ist zu verstehen, was Fürsorge braucht, was natürlich fließt und wo klarere Grenzen oder Gespräche helfen können.'] },
        { title: 'Verantwortungsvolle Beziehungsastrologie', paragraphs: ['Wir verwenden Synastrie nicht als festes Schicksalsurteil. Horoskope zeigen Potenziale und Herausforderungen, während Entscheidungen und Kommunikation menschlich bleiben.', 'Für die beste Lesung geben Sie Geburtsdaten sorgfältig ein und lesen Sie das Ergebnis als Werkzeug für Bewusstsein statt für Schuld.'] },
      ],
      faq: [
        { question: 'Was ist Synastrie?', answer: 'Synastrie vergleicht zwei Geburtshoroskope, um Beziehungsdynamiken, Anziehung und Wachstumsfelder zu erkunden.' },
        { question: 'Gibt Synastrie ein garantiertes Ergebnis?', answer: 'Nein. Sie zeigt Themen, Herausforderungen und Chancen für bewusste Kommunikation.' },
      ],
      image: '/img/synastry_chart.png',
      authorTitle: 'Redaktion für Astrologie und Beziehungsdynamik',
      expertise: ['Synastrie', 'Beziehungsastrologie', 'Geburtshoroskop'],
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
  'buyuk-uclu': {
    en: {
      slug: 'big-three',
      title: 'The Big Three Guide (Sun, Moon, Rising)',
      description: 'A guide to what the Sun, Moon and rising sign say together, and how to read the big three responsibly.',
      eyebrow: 'The Big Three',
      lead: 'The big three is the combined view of your Sun, Moon and rising sign. It describes your identity, your emotional needs and your outward style together.',
      summary: 'The big three is the most practical way to read yourself without being reduced to a single sign. The Sun describes your direction, the Moon your inner world, and the rising sign the manner you show to others. Reading all three explains why "my sign does not fit me at all" is such a common feeling.',
      sections: [
        { title: 'What the big three is', paragraphs: ['In astrology the "big three" refers to the three most discussed parts of a birth chart: the Sun sign, the Moon sign and the rising sign. Most people know only their Sun sign, yet reading all three produces a far more recognisable portrait.', 'This is not a personality test. It does not label you; it offers a symbolic language for your tendencies, needs and natural style. The aim is not to fit you into a box but to help you see yourself more clearly.'] },
        { title: 'What Sun, Moon and rising describe', paragraphs: ['The Sun describes your life direction, your conscious identity and the self you are growing towards. It shows where you invest energy and what makes you feel alive.', 'The Moon describes emotional needs, how you feel safe and your instinctive reactions. The part of you that appears when you are tired, hurt or joyful is usually the Moon.', 'The rising sign shows how you approach life and how others first perceive you. Because it also determines how the houses are arranged in your chart, calculating it depends on your birth time.'] },
        { title: 'Why your sign alone is not enough', paragraphs: ['"My sign does not fit me" is a common sentence and often a fair instinct, because the Sun sign alone is only one part of the picture.', 'Someone with a Leo Sun, Pisces Moon and Virgo rising may appear precise and measured, enjoy visibility during the day, and still need quiet and solitude in the evening. These are not contradictions but three layers of the same person.'] },
        { title: 'Why birth time matters', paragraphs: ['The rising sign changes roughly every two hours and the Moon changes sign every two to two and a half days. An accurate big three therefore needs your birth time as well as your date and place of birth.', 'If the time is wrong or unknown, the ascendant and house placements shift, and the reading rests on a chart that is not merely incomplete but incorrect. Rather than working from a guess, a rectification study that determines the time from documented life events is recommended.'] },
        { title: 'Using the result responsibly', paragraphs: ['The big three offers a language for looking at yourself and those close to you with more compassion. It is valuable when used to build empathy, not to excuse behaviour.', 'GoldMoodAstro avoids fatalistic claims. Astrology can support reflection, planning and emotional language, but important decisions should also take real-world information and, where needed, professional support into account.'] },
      ],
      faq: [
        { question: 'Do I need my birth time for the big three?', answer: 'For the rising sign, yes — it changes roughly every two hours. Without a birth time your Sun and usually your Moon can still be calculated, but the ascendant and house placements will not be reliable.' },
        { question: 'What if my Sun, Moon and rising contradict each other?', answer: 'They are layers rather than contradictions. An outgoing rising sign with an inward Moon explains feeling comfortable in a crowd and needing solitude afterwards.' },
        { question: 'Does the big three describe my whole personality?', answer: 'No. These are the three most visible parts of a birth chart; planets, houses and aspects complete the picture. The big three is a good starting point, not the final word.' },
      ],
      image: '/img/natal_chart.png',
      authorTitle: 'GoldMoodAstro Editorial Team',
      expertise: ['Big Three', 'Astrology', 'Birth Chart'],
    },
    tr: {
      slug: 'buyuk-uclu',
      title: 'Büyük Üçlü Rehberi (Güneş, Ay, Yükselen)',
      description: 'Güneş, Ay ve yükselen burcun birlikte ne anlattığını; büyük üçlünün doğum haritasındaki yerini ve sorumlu yorumunu anlatan rehber.',
      eyebrow: 'Büyük Üçlü',
      lead: 'Büyük üçlü; Güneş, Ay ve yükselen burcunuzun oluşturduğu üçlü bakıştır. Kimliğinizi, duygusal ihtiyacınızı ve dışa dönük tarzınızı bir arada okur.',
      summary: 'Büyük üçlü tek bir burca sıkışmadan kendinizi okumanın en pratik yoludur. Güneş yaşam yönünüzü, Ay iç dünyanızı, yükselen ise dışarıya yansıyan üslubunuzu tarif eder. Üçünü birlikte değerlendirmek, "burcum bana hiç uymuyor" hissinin neden bu kadar yaygın olduğunu da açıklar.',
      sections: [
        { title: 'Büyük üçlü nedir', paragraphs: ['Astrolojide "büyük üçlü", doğum haritanızın en çok konuşulan üç unsurudur: Güneş burcu, Ay burcu ve yükselen burç. Çoğu insan yalnızca Güneş burcunu bilir; oysa üçü bir arada okunduğunda ortaya çok daha tanıdık bir portre çıkar.', 'Bu üçlü bir kişilik testi değildir. Size etiket koymaz; eğilimlerinizi, ihtiyaçlarınızı ve doğal üslubunuzu tarif eden sembolik bir dil sunar. Amaç sizi bir kalıba sokmak değil, kendinizi daha net görmenize yardımcı olmaktır.'] },
        { title: 'Güneş, Ay ve yükselen ne anlatır', paragraphs: ['Güneş burcu; yaşam yönünüzü, bilinçli kimliğinizi ve "olmak istediğiniz ben"i anlatır. Neye enerji verdiğinizi, neyin sizi canlandırdığını gösterir.', "Ay burcu; duygusal ihtiyaçlarınızı, güvende hissetme biçiminizi ve içgüdüsel tepkilerinizi tarif eder. Yorgunken, üzgünken ya da sevinçliyken ortaya çıkan taraf çoğunlukla Ay'ınızdır.", 'Yükselen burç; hayata nasıl yaklaştığınızı ve başkalarının sizi ilk anda nasıl algıladığını gösterir. Aynı zamanda haritanızdaki evlerin nasıl dizildiğini belirlediği için hesaplanması doğum saatine bağlıdır.'] },
        { title: 'Neden yalnızca burcunuz yetmez', paragraphs: ['"Burcum bana hiç uymuyor" cümlesi çok yaygındır ve genellikle haklı bir sezgidir. Çünkü tek başına Güneş burcu, resmin yalnızca bir parçasıdır.', 'Güneşi Aslan, Ayı Balık, yükseleni Başak olan biri; dışarıdan titiz ve ölçülü görünebilir, gün içinde görünür olmaktan keyif alabilir, akşam ise sessizliğe ve yalnız kalabileceği bir alana ihtiyaç duyabilir. Bunlar çelişki değil, aynı insanın üç katmanıdır.'] },
        { title: 'Doğum saati neden önemli', paragraphs: ['Yükselen burç yaklaşık iki saatte bir değişir; Ay ise iki-iki buçuk günde bir burç değiştirir. Bu yüzden büyük üçlünün doğru hesaplanması için doğum tarihi ve yeri kadar doğum saati de gereklidir.', 'Saat yanlış ya da bilinmiyorsa yükselen ve ev yerleşimleri kayar; bu durumda yorum eksik değil, doğrudan yanlış bir harita üzerinden yapılmış olur. Saatinizi bilmiyorsanız tahminle ilerlemek yerine, yaşam olaylarından yola çıkarak saati belirleyen rektifikasyon çalışması önerilir.'] },
        { title: 'Sonucu sorumlu kullanmak', paragraphs: ['Büyük üçlü, kendinize ve yakınlarınıza daha şefkatli bakmak için bir dil sunar. Birinin "neden böyle davrandığını" mazur göstermek için değil, empati kurmak için kullanıldığında değerlidir.', 'GoldMoodAstro kaderci iddialardan kaçınır. Astroloji; düşünmeyi, planlamayı ve duygusal bir dil kurmayı destekleyebilir; ancak önemli kararlarda gerçek dünya bilgileri ve gerektiğinde profesyonel destek de dikkate alınmalıdır.'] },
      ],
      faq: [
        { question: 'Büyük üçlü için doğum saatim gerekli mi?', answer: 'Yükselen burç için evet, gereklidir; yükselen yaklaşık iki saatte bir değişir. Doğum saatiniz olmadan Güneş burcunuz ve çoğu durumda Ay burcunuz hesaplanabilir, ancak yükselen ve ev yerleşimleri güvenilir olmaz.' },
        { question: 'Güneş, Ay ve yükselen çelişirse ne olur?', answer: 'Çelişki değil, katmandır. Örneğin dışa dönük bir yükselenle içine kapanık bir Ay bir arada olabilir; bu, kalabalıkta rahat görünüp sonrasında yalnız kalmaya ihtiyaç duymayı açıklar.' },
        { question: 'Büyük üçlü kişiliğimi tamamen anlatır mı?', answer: 'Hayır. Doğum haritasının en görünür üç unsurudur; gezegenler, evler ve açılar resmi tamamlar. Büyük üçlü iyi bir başlangıçtır, son söz değildir.' },
      ],
      image: '/img/natal_chart.png',
      authorTitle: 'GoldMoodAstro Editoryal Ekibi',
      expertise: ['Büyük Üçlü', 'Astroloji', 'Doğum Haritası'],
    },
    de: {
      slug: 'big-three',
      title: 'Leitfaden zu den großen Drei (Sonne, Mond, Aszendent)',
      description: 'Ein Leitfaden dazu, was Sonne, Mond und Aszendent gemeinsam aussagen und wie die großen Drei verantwortungsvoll gedeutet werden.',
      eyebrow: 'Die großen Drei',
      lead: 'Die großen Drei sind die gemeinsame Betrachtung von Sonne, Mond und Aszendent. Sie beschreiben Identität, emotionale Bedürfnisse und äußeren Stil zusammen.',
      summary: 'Die großen Drei sind der praktischste Weg, sich selbst zu lesen, ohne auf ein einziges Zeichen reduziert zu werden. Die Sonne beschreibt die Richtung, der Mond die innere Welt und der Aszendent die Art, die man nach außen zeigt. Alle drei zusammen erklären, warum das Gefühl "mein Sternzeichen passt gar nicht zu mir" so verbreitet ist.',
      sections: [
        { title: 'Was die großen Drei sind', paragraphs: ['In der Astrologie bezeichnen die "großen Drei" die drei meistbesprochenen Teile eines Geburtshoroskops: Sonnenzeichen, Mondzeichen und Aszendent. Die meisten Menschen kennen nur ihr Sonnenzeichen; alle drei gemeinsam ergeben ein weit wiedererkennbareres Bild.', 'Das ist kein Persönlichkeitstest. Es etikettiert Sie nicht, sondern bietet eine symbolische Sprache für Neigungen, Bedürfnisse und natürlichen Stil. Ziel ist nicht, Sie in eine Schublade zu stecken, sondern Ihnen zu helfen, sich klarer zu sehen.'] },
        { title: 'Was Sonne, Mond und Aszendent beschreiben', paragraphs: ['Die Sonne beschreibt Lebensrichtung, bewusste Identität und das Selbst, auf das Sie zuwachsen. Sie zeigt, wo Sie Energie investieren und was Sie lebendig macht.', 'Der Mond beschreibt emotionale Bedürfnisse, das Gefühl von Sicherheit und instinktive Reaktionen. Der Teil, der erscheint, wenn Sie müde, verletzt oder froh sind, ist meist der Mond.', 'Der Aszendent zeigt, wie Sie das Leben angehen und wie andere Sie zuerst wahrnehmen. Da er auch die Anordnung der Häuser bestimmt, hängt seine Berechnung von der Geburtszeit ab.'] },
        { title: 'Warum das Sternzeichen allein nicht reicht', paragraphs: ['"Mein Sternzeichen passt nicht zu mir" ist ein häufiger Satz und oft eine berechtigte Intuition, denn das Sonnenzeichen allein ist nur ein Teil des Bildes.', 'Wer eine Löwe-Sonne, einen Fische-Mond und einen Jungfrau-Aszendenten hat, kann präzise und zurückhaltend wirken, tagsüber Sichtbarkeit genießen und abends dennoch Stille und Alleinsein brauchen. Das sind keine Widersprüche, sondern drei Schichten derselben Person.'] },
        { title: 'Warum die Geburtszeit wichtig ist', paragraphs: ['Der Aszendent wechselt etwa alle zwei Stunden, der Mond alle zwei bis zweieinhalb Tage das Zeichen. Für korrekte große Drei braucht es daher neben Datum und Ort auch die Geburtszeit.', 'Ist die Zeit falsch oder unbekannt, verschieben sich Aszendent und Häuser; die Deutung beruht dann nicht auf einem unvollständigen, sondern auf einem falschen Horoskop. Statt einer Schätzung empfiehlt sich eine Rektifikation, die die Zeit aus dokumentierten Lebensereignissen ermittelt.'] },
        { title: 'Das Ergebnis verantwortungsvoll nutzen', paragraphs: ['Die großen Drei bieten eine Sprache, um sich selbst und nahestehende Menschen mitfühlender zu betrachten. Wertvoll sind sie, wenn sie Empathie schaffen und nicht Verhalten entschuldigen.', 'GoldMoodAstro vermeidet fatalistische Aussagen. Astrologie kann Reflexion, Planung und emotionale Sprache unterstützen; wichtige Entscheidungen sollten jedoch auch reale Informationen und bei Bedarf professionelle Unterstützung einbeziehen.'] },
      ],
      faq: [
        { question: 'Brauche ich für die großen Drei meine Geburtszeit?', answer: 'Für den Aszendenten ja — er wechselt etwa alle zwei Stunden. Ohne Geburtszeit lassen sich Sonne und meist auch Mond berechnen, Aszendent und Häuserstellungen jedoch nicht verlässlich.' },
        { question: 'Was, wenn Sonne, Mond und Aszendent sich widersprechen?', answer: 'Es sind Schichten statt Widersprüche. Ein kontaktfreudiger Aszendent mit einem nach innen gewandten Mond erklärt, warum man sich in einer Gruppe wohlfühlt und danach Rückzug braucht.' },
        { question: 'Beschreiben die großen Drei meine ganze Persönlichkeit?', answer: 'Nein. Sie sind die drei sichtbarsten Teile eines Horoskops; Planeten, Häuser und Aspekte vervollständigen das Bild. Die großen Drei sind ein guter Anfang, nicht das letzte Wort.' },
      ],
      image: '/img/natal_chart.png',
      authorTitle: 'GoldMoodAstro Redaktion',
      expertise: ['Große Drei', 'Astrologie', 'Geburtshoroskop'],
    },
  },
  'yukselen-burc': {
    en: {
      slug: 'rising-sign-calculator',
      title: 'Rising Sign Guide (Calculation and Meaning)',
      description: 'What the rising sign is, how it is calculated and why birth time is essential, plus its effect on the house system and first impressions.',
      eyebrow: 'Rising Sign',
      lead: 'The rising sign is the zodiac sign ascending on the horizon at the moment of your birth. It describes how you approach life and how others first perceive you.',
      summary: 'The rising sign changes roughly every two hours, so two people born on the same day can have different ascendants. It also determines how the houses are arranged in the chart — a wrong ascendant shifts the entire chart.',
      sections: [
        { title: 'What the rising sign is', paragraphs: ['The rising sign, or ascendant, is the zodiac sign rising on the eastern horizon at the moment of your birth. It is the starting point of your chart: it marks the cusp of the first house and sets the order of the remaining eleven.', 'While the Sun describes who you are growing towards and the Moon what you feel inside, the rising sign describes how you appear outwardly and the manner in which you approach life. Together they form the big three.'] },
        { title: 'Why birth time is essential', paragraphs: ['The rising sign changes roughly every two hours, which makes it the most time-sensitive element of a birth chart. Someone born in the morning and someone born at noon on the same day produce two different charts.', 'If the time is wrong or unknown, the ascendant shifts — and with it every house placement. The reading is then based on a chart that is not merely incomplete but incorrect. Rather than working from a guess, a rectification study that determines the time from documented life events is recommended.'] },
        { title: 'Why the rising sign feels different from the Sun sign', paragraphs: ['One of the most common reasons behind "my sign does not fit me" is the rising sign. Others usually meet your ascendant first, while you describe yourself through your Sun sign.', 'Someone with a Sagittarius Sun and Capricorn rising may feel adventurous and optimistic inside while appearing measured, reserved and serious outwardly. That is not a contradiction but the gap between inner motivation and outer manner.'] },
        { title: 'How the rising sign shapes the house system', paragraphs: ['The ascendant is not just a label; it is the skeleton of the chart. The first house begins at the rising sign and the remaining houses follow in order. Which planet falls into which area of life therefore depends directly on it.', 'The same planetary positions produce very different meanings under different ascendants. Because the rising sign decides where career, relationship and money themes sit, timing techniques depend on it too.'] },
        { title: 'Using the result responsibly', paragraphs: ['The rising sign offers a language for understanding yourself and how others perceive you. It is a tool for awareness, not a verdict on personality.', 'GoldMoodAstro avoids fatalistic claims. Astrology can support reflection and planning, but important decisions should also take real-world information and, where needed, professional support into account.'] },
      ],
      faq: [
        { question: 'Is birth time required for the rising sign?', answer: 'Yes. Because the ascendant changes roughly every two hours, it cannot be calculated reliably without a birth time. If you do not have it, a rectification study is recommended.' },
        { question: 'My rising sign differs from my Sun sign — which is correct?', answer: 'Both are. They describe different layers: the Sun your life direction, the rising sign your outward manner and the arrangement of the houses.' },
        { question: 'Is the birth place needed as well?', answer: 'Yes. The ascendant depends on the horizon at the moment of birth, which varies with latitude and longitude. Date and time alone are not enough.' },
      ],
      image: '/img/natal_chart.png',
      authorTitle: 'GoldMoodAstro Editorial Team',
      expertise: ['Rising Sign', 'Astrology', 'Birth Chart'],
    },
    tr: {
      slug: 'yukselen-burc-hesaplayici',
      title: 'Yükselen Burç Rehberi (Hesaplama ve Yorum)',
      description: 'Yükselen burç nedir, nasıl hesaplanır, doğum saati neden şart? Yükselen burcun ev sistemine ve ilk izlenime etkisini anlatan rehber.',
      eyebrow: 'Yükselen Burç',
      lead: 'Yükselen burç, doğduğunuz anda ufukta yükselen zodyak burcudur. Hayata yaklaşımınızı ve başkalarının sizi ilk anda nasıl algıladığını tarif eder.',
      summary: 'Yükselen burç yaklaşık iki saatte bir değişir; bu yüzden aynı gün doğan iki kişinin yükseleni farklı olabilir. Doğum haritasındaki evlerin nasıl dizileceğini de yükselen belirler — yani yanlış bir yükselen, haritanın tamamını kaydırır.',
      sections: [
        { title: 'Yükselen burç nedir', paragraphs: ['Yükselen burç (ascendant), doğduğunuz anda doğu ufkunda yükselmekte olan zodyak burcudur. Doğum haritanızın başlangıç noktasıdır: birinci evin girişini işaretler ve diğer on bir evin sırasını belirler.', 'Güneş burcu "kim olmaya yöneldiğinizi", Ay burcu "içeride ne hissettiğinizi" anlatırken; yükselen "dışarıya nasıl göründüğünüzü" ve hayata hangi üslupla yaklaştığınızı tarif eder. Üçü birlikte büyük üçlüyü oluşturur.'] },
        { title: 'Neden doğum saati şart', paragraphs: ['Yükselen burç ortalama iki saatte bir değişir. Bu, yükselenin doğum haritasındaki en saat-duyarlı unsur olduğu anlamına gelir: sabah doğan ile öğlen doğan aynı kişi değil, farklı yükselenlere sahip iki farklı harita üretir.', 'Saat yanlış ya da bilinmiyorsa yükselen kayar; yükselen kayınca tüm ev yerleşimleri de kayar. Bu durumda yapılan yorum eksik değil, doğrudan yanlış bir harita üzerinden yapılmış olur. Saatinizi bilmiyorsanız tahminle ilerlemek yerine, yaşam olaylarından yola çıkarak saati belirleyen rektifikasyon çalışması önerilir.'] },
        { title: 'Yükselen ile Güneş burcu neden farklı hissettirir', paragraphs: ['"Burcum bana hiç uymuyor" cümlesinin en sık sebeplerinden biri yükselen burçtur. İnsanlar sizi çoğunlukla önce yükseleniniz üzerinden tanır; siz ise kendinizi Güneş burcunuzla tarif edersiniz.', 'Örneğin Güneşi Yay, yükseleni Oğlak olan biri içeride maceracı ve iyimser hissedebilir ama dışarıya ölçülü, mesafeli ve ciddi görünebilir. Bu bir çelişki değil; aynı kişinin iç motivasyonu ile dış üslubu arasındaki farktır.'] },
        { title: 'Yükselen burcun ev sistemine etkisi', paragraphs: ['Yükselen yalnızca bir etiket değildir; haritanın iskeletidir. Birinci ev yükselenle başlar, sonraki evler sırayla dizilir. Bu yüzden hangi gezegenin hangi yaşam alanına düştüğü doğrudan yükselene bağlıdır.', 'Aynı gezegen konumları, farklı yükselenlerle bambaşka anlamlar üretir. Kariyer, ilişki ve para gibi başlıkların haritada nereye oturduğunu yükselen belirlediği için, zamanlama teknikleri de ona bağımlıdır.'] },
        { title: 'Sonucu sorumlu kullanmak', paragraphs: ['Yükselen burç, kendinizi ve başkalarının sizi nasıl algıladığını anlamak için bir dil sunar. Bir kişilik hükmü değil, farkındalık aracıdır.', 'GoldMoodAstro kaderci iddialardan kaçınır. Astroloji düşünmeyi ve planlamayı destekleyebilir; ancak önemli kararlarda gerçek dünya bilgileri ve gerektiğinde profesyonel destek de dikkate alınmalıdır.'] },
      ],
      faq: [
        { question: 'Yükselen burç için doğum saati zorunlu mu?', answer: 'Evet. Yükselen yaklaşık iki saatte bir değiştiği için saat olmadan güvenilir şekilde hesaplanamaz. Saatiniz yoksa rektifikasyon çalışması önerilir.' },
        { question: 'Yükselen burcum Güneş burcumdan farklı, hangisi doğru?', answer: 'İkisi de doğru; farklı katmanları anlatırlar. Güneş yaşam yönünüzü, yükselen dışa dönük üslubunuzu ve haritanın ev düzenini tarif eder.' },
        { question: 'Doğum yeri de gerekli mi?', answer: 'Evet. Yükselen, doğum anındaki ufuk çizgisine bağlıdır; bu da enlem-boylama göre değişir. Bu yüzden tarih ve saatin yanında doğum yeri de gereklidir.' },
      ],
      image: '/img/natal_chart.png',
      authorTitle: 'GoldMoodAstro Editoryal Ekibi',
      expertise: ['Yükselen Burç', 'Astroloji', 'Doğum Haritası'],
    },
    de: {
      slug: 'rising-sign-calculator',
      title: 'Aszendent-Leitfaden (Berechnung und Bedeutung)',
      description: 'Was der Aszendent ist, wie er berechnet wird und warum die Geburtszeit unerlässlich ist — samt Wirkung auf Häusersystem und ersten Eindruck.',
      eyebrow: 'Aszendent',
      lead: 'Der Aszendent ist das Tierkreiszeichen, das im Moment Ihrer Geburt am Horizont aufsteigt. Er beschreibt, wie Sie das Leben angehen und wie andere Sie zuerst wahrnehmen.',
      summary: 'Der Aszendent wechselt etwa alle zwei Stunden; zwei am selben Tag geborene Menschen können daher verschiedene Aszendenten haben. Er bestimmt auch die Anordnung der Häuser — ein falscher Aszendent verschiebt das gesamte Horoskop.',
      sections: [
        { title: 'Was der Aszendent ist', paragraphs: ['Der Aszendent ist das Tierkreiszeichen, das im Moment der Geburt am östlichen Horizont aufsteigt. Er ist der Ausgangspunkt des Horoskops: Er markiert die Spitze des ersten Hauses und legt die Reihenfolge der übrigen elf fest.', 'Während die Sonne beschreibt, worauf Sie zuwachsen, und der Mond, was Sie innerlich fühlen, beschreibt der Aszendent Ihr äußeres Auftreten und die Art, wie Sie das Leben angehen. Zusammen bilden sie die großen Drei.'] },
        { title: 'Warum die Geburtszeit unerlässlich ist', paragraphs: ['Der Aszendent wechselt etwa alle zwei Stunden und ist damit das zeitempfindlichste Element eines Horoskops. Eine morgens und eine mittags geborene Person ergeben zwei verschiedene Horoskope.', 'Ist die Zeit falsch oder unbekannt, verschiebt sich der Aszendent und mit ihm jede Häuserstellung. Die Deutung beruht dann nicht auf einem unvollständigen, sondern auf einem falschen Horoskop. Statt einer Schätzung empfiehlt sich eine Rektifikation aus dokumentierten Lebensereignissen.'] },
        { title: 'Warum sich der Aszendent anders anfühlt als das Sonnenzeichen', paragraphs: ['Einer der häufigsten Gründe für "mein Sternzeichen passt nicht zu mir" ist der Aszendent. Andere begegnen meist zuerst Ihrem Aszendenten, während Sie sich über Ihr Sonnenzeichen beschreiben.', 'Wer eine Schütze-Sonne und einen Steinbock-Aszendenten hat, kann sich innerlich abenteuerlustig fühlen, nach außen aber zurückhaltend und ernst wirken. Das ist kein Widerspruch, sondern der Unterschied zwischen innerer Motivation und äußerer Art.'] },
        { title: 'Wie der Aszendent das Häusersystem prägt', paragraphs: ['Der Aszendent ist kein bloßes Etikett, sondern das Gerüst des Horoskops. Das erste Haus beginnt beim Aszendenten, die weiteren folgen der Reihe nach. Welcher Planet in welchen Lebensbereich fällt, hängt daher unmittelbar von ihm ab.', 'Dieselben Planetenstände ergeben unter verschiedenen Aszendenten sehr unterschiedliche Bedeutungen. Da der Aszendent bestimmt, wo Karriere-, Beziehungs- und Geldthemen liegen, hängen auch Timing-Techniken von ihm ab.'] },
        { title: 'Das Ergebnis verantwortungsvoll nutzen', paragraphs: ['Der Aszendent bietet eine Sprache, um sich selbst und die Wahrnehmung anderer zu verstehen. Er ist ein Werkzeug für Bewusstheit, kein Urteil über die Persönlichkeit.', 'GoldMoodAstro vermeidet fatalistische Aussagen. Astrologie kann Reflexion und Planung unterstützen; wichtige Entscheidungen sollten jedoch auch reale Informationen und bei Bedarf professionelle Unterstützung einbeziehen.'] },
      ],
      faq: [
        { question: 'Ist die Geburtszeit für den Aszendenten erforderlich?', answer: 'Ja. Da der Aszendent etwa alle zwei Stunden wechselt, lässt er sich ohne Geburtszeit nicht verlässlich berechnen. Fehlt sie, empfiehlt sich eine Rektifikation.' },
        { question: 'Mein Aszendent unterscheidet sich vom Sonnenzeichen — was stimmt?', answer: 'Beides. Sie beschreiben verschiedene Ebenen: die Sonne die Lebensrichtung, der Aszendent das äußere Auftreten und die Häuseranordnung.' },
        { question: 'Wird auch der Geburtsort benötigt?', answer: 'Ja. Der Aszendent hängt vom Horizont zum Geburtszeitpunkt ab, der mit Breiten- und Längengrad variiert. Datum und Uhrzeit allein genügen nicht.' },
      ],
      image: '/img/natal_chart.png',
      authorTitle: 'GoldMoodAstro Redaktion',
      expertise: ['Aszendent', 'Astrologie', 'Geburtshoroskop'],
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
