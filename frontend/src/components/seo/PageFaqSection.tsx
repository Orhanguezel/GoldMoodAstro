import FaqAccordion, { type FaqAccordionItem } from '@/components/common/FaqAccordion';
import JsonLd from '@/seo/JsonLd';
import { faqSchema } from '@/seo/jsonld';

/** Görünür SSS + aynı içerikle FAQPage JSON-LD (server component). */
export default function PageFaqSection({
  id,
  items,
  title,
  eyebrow,
}: {
  id: string;
  items: FaqAccordionItem[];
  title: string;
  eyebrow: string;
}) {
  if (!items.length) return null;
  return (
    <>
      <JsonLd id={id} data={faqSchema(items)} />
      <FaqAccordion items={items} title={title} eyebrow={eyebrow} />
    </>
  );
}
