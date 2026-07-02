import JsonLd from '@/seo/JsonLd';
import { articleSchema, breadcrumbSchema, faqSchema, graph } from '@/seo/jsonld';
import LandingIntro from '@/components/common/LandingIntro';
import FaqAccordion from '@/components/common/FaqAccordion';
import AuthorBio from '@goldmood/shared-ui/content/AuthorBio';

type LandingKey = 'kahve-fali' | 'ruya-tabiri' | 'birth-chart' | 'pricing' | 'yildizname';

type LandingData = {
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

const DATA: Record<LandingKey, LandingData> = {
  'kahve-fali': {
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
  'ruya-tabiri': {
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
  'birth-chart': {
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
  pricing: {
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
  yildizname: {
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
};

export default function SeoLandingArticle({ type, locale }: { type: LandingKey; locale: string }) {
  const data = DATA[type];
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
  const pageUrl = `${siteUrl}/${locale}/${data.slug}`;
  const image = data.image.startsWith('http') ? data.image : `${siteUrl}${data.image}`;

  return (
    <>
      <JsonLd
        id={`${type}-seo-schema`}
        data={graph([
          breadcrumbSchema([
            { name: 'GoldMoodAstro', item: `${siteUrl}/${locale}` },
            { name: data.title, item: pageUrl },
          ]),
          articleSchema({
            headline: data.title,
            description: data.description,
            image,
            datePublished: '2026-07-02T00:00:00.000Z',
            dateModified: '2026-07-02T00:00:00.000Z',
            author: { name: 'GoldMoodAstro Editorial Team', url: `${siteUrl}/${locale}/about` },
            publisherId: `${siteUrl}/#org`,
            url: pageUrl,
            speakableSelectors: ['h1', '[data-speakable]'],
            inLanguage: locale,
          }),
          faqSchema(data.faq),
        ])}
      />
      <LandingIntro
        eyebrow={data.eyebrow}
        title={data.title}
        lead={data.lead}
        summary={data.summary}
        sections={data.sections}
        showHeader={false}
      />
      <FaqAccordion items={data.faq} title={`${data.eyebrow} Questions`} />
      <AuthorBio
        name="GoldMoodAstro Editorial Team"
        title={data.authorTitle}
        bio={`${data.title} content is reviewed for clarity, responsible guidance and practical spiritual literacy.`}
        expertise={data.expertise}
      />
    </>
  );
}
