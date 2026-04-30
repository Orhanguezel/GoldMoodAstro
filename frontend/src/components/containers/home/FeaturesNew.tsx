import Image from 'next/image';
import { fetchSetting } from '@/i18n/server';

const COPY = {
  tr: {
    eyebrow: 'Deneyim',
    title: 'Sade ve <em>derin</em> bir<br/>astroloji rehberi.',
    features: [
      {
        num: '— I —',
        title: 'Kendi <em>doğum haritanızı</em><br/>her zaman cebinizde taşıyın.',
        body: 'Swiss Ephemeris altyapısıyla saniye hassasiyetinde hesaplanmış natal harita. Gezegenler, evler, açılar ve transit etkiler — yorumlanmış, görselleştirilmiş, paylaşılabilir.',
        meta: ['Natal Harita', 'Transitler', 'Açı Yorumları'],
      },
      {
        num: '— II —',
        title: 'Sabah ışığında size özel<br/><em>bir paragraf.</em>',
        body: 'Bugünün gezegen geçişleri, sizin haritanızla nasıl konuşuyor? Yapay zeka ile yazılmış ama astrolog tarafından kalibre edilmiş bir günlük rehber. Aynı cümleyi iki kez okumazsınız.',
        meta: ['Günlük', 'Haftalık', 'Aylık Öngörü'],
      },
      {
        num: '— III —',
        title: 'İki ruhun <em>haritası</em><br/>üst üste gelince.',
        body: 'Sinastri, sadece "uyumlu mu?" sorusunun cevabı değil — iki insanın hangi alanda birbirini güçlendireceğini, hangisinde sınanacağını gösteren bir derinlik aracıdır. Partnerinizle haritalarınızı paylaşın.',
        meta: ['Sinastri', 'Kompozit Harita', 'Ortak Transit'],
      }
    ]
  },
  en: {
    eyebrow: 'Experience',
    title: 'A simple yet <em>deep</em><br/>astrology guide.',
    features: [
      {
        num: '— I —',
        title: 'Keep your <em>birth chart</em><br/>always in your pocket.',
        body: 'A natal chart calculated with second precision using the Swiss Ephemeris infrastructure. Planets, houses, aspects, and transiting effects — interpreted, visualized, shareable.',
        meta: ['Natal Chart', 'Transits', 'Aspect Readings'],
      },
      {
        num: '— II —',
        title: 'A unique paragraph<br/><em>in the morning light.</em>',
        body: 'How do today\'s planetary transits speak to your chart? A daily guide written by AI but calibrated by an astrologer. You will not read the same sentence twice.',
        meta: ['Daily', 'Weekly', 'Monthly Forecast'],
      },
      {
        num: '— III —',
        title: 'When two souls\' <em>charts</em><br/>overlap.',
        body: 'Synastry is not just the answer to "are we compatible?" — it is a tool of depth showing where two people will empower each other, and where they will be tested. Share your charts with your partner.',
        meta: ['Synastry', 'Composite Chart', 'Shared Transit'],
      }
    ]
  }
};

function settingString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'url' in value) return String((value as { url?: unknown }).url || '');
  return '';
}

export default async function FeaturesNew({ locale = 'tr' }: { locale?: string }) {
  const isTr = locale === 'tr';
  const copy = COPY[isTr ? 'tr' : 'en'];

  const [natalImg, dailyImg, synastryImg] = await Promise.all([
    fetchSetting('ui_feature_natal_image', '*', { revalidate: 600 }),
    fetchSetting('ui_feature_daily_image', '*', { revalidate: 600 }),
    fetchSetting('ui_feature_synastry_image', '*', { revalidate: 600 }),
  ]);

  const natalPath = settingString(natalImg?.value) || '/img/natal_chart.png';
  const dailyPath = settingString(dailyImg?.value) || '/img/daily_reading.png';
  const synastryPath = settingString(synastryImg?.value) || '/img/synastry_chart.png';

  return (
    <section className="py-32 px-6 bg-[var(--gm-bg-deep)] relative border-t border-[var(--gm-border-soft)]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24 reveal">
          <span className="font-display text-[11px] tracking-[0.42em] text-[var(--gm-gold-deep)] uppercase mb-6 block">
            {copy.eyebrow}
          </span>
          <h2 
            className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light leading-tight text-[var(--gm-text)]"
            dangerouslySetInnerHTML={{ __html: copy.title }}
          />
        </div>

        <div className="space-y-32">
          {/* Feature 1: Birth chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center reveal">
            <div>
              <div className="font-display text-[14px] tracking-[0.2em] text-[var(--gm-gold)] mb-6">
                {copy.features[0].num}
              </div>
              <h3 
                className="font-serif text-3xl lg:text-4xl text-[var(--gm-text)] leading-snug mb-6 [&>em]:text-[var(--gm-gold)] [&>em]:italic"
                dangerouslySetInnerHTML={{ __html: copy.features[0].title }}
              />
              <p className="text-[var(--gm-text-dim)] font-light leading-relaxed text-lg mb-8">
                {copy.features[0].body}
              </p>
              <div className="flex flex-wrap gap-4 font-display text-[9px] tracking-[0.3em] uppercase text-[var(--gm-gold-deep)]">
                {copy.features[0].meta.map((m, i) => (
                  <span key={i} className="border border-[var(--gm-gold)]/30 py-2 px-4 rounded-full">{m}</span>
                ))}
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-[var(--gm-primary)]/20 to-[var(--gm-gold)]/20 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
                
                <div className="relative aspect-[4/3] w-full max-w-[440px] overflow-hidden rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-bg-deep)] shadow-2xl">
                  <Image
                    src={natalPath}
                    alt="Natal Chart Example"
                    fill
                    sizes="(max-width: 768px) 100vw, 440px"
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  
                  {/* Overlay Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[var(--gm-text)]/90 via-[var(--gm-text)]/40 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--gm-gold)] animate-pulse shadow-[0_0_10px_var(--gm-gold)]" />
                      <span className="font-display text-[10px] tracking-[0.25em] text-[var(--gm-gold)] uppercase font-medium">Canlı Transit Takibi</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Daily reading */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center reveal md:direction-rtl">
            <div className="md:order-2">
              <div className="font-display text-[14px] tracking-[0.2em] text-[var(--gm-gold)] mb-6">
                {copy.features[1].num}
              </div>
              <h3 
                className="font-serif text-3xl lg:text-4xl text-[var(--gm-text)] leading-snug mb-6 [&>em]:text-[var(--gm-gold)] [&>em]:italic"
                dangerouslySetInnerHTML={{ __html: copy.features[1].title }}
              />
              <p className="text-[var(--gm-text-dim)] font-light leading-relaxed text-lg mb-8">
                {copy.features[1].body}
              </p>
              <div className="flex flex-wrap gap-4 font-display text-[9px] tracking-[0.3em] uppercase text-[var(--gm-gold-deep)]">
                {copy.features[1].meta.map((m, i) => (
                  <span key={i} className="border border-[var(--gm-gold)]/30 py-2 px-4 rounded-full">{m}</span>
                ))}
              </div>
            </div>
            <div className="flex justify-center md:justify-start md:order-1">
              <div className="relative group">
                {/* Morning Light Glow */}
                <div className="absolute -inset-4 bg-gradient-to-br from-[var(--gm-gold)]/30 to-[var(--gm-primary)]/10 rounded-full blur-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-700" />
                
                <div className="relative aspect-[4/3] w-full max-w-[440px] overflow-hidden rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)] shadow-2xl">
                  <Image
                    src={dailyPath}
                    alt="Daily Reading Example"
                    fill
                    sizes="(max-width: 768px) 100vw, 440px"
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  
                  {/* Morning Light Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[var(--gm-gold)]/5 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Sinastri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center reveal">
            <div>
              <div className="font-display text-[14px] tracking-[0.2em] text-[var(--gm-gold)] mb-6">
                {copy.features[2].num}
              </div>
              <h3 
                className="font-serif text-3xl lg:text-4xl text-[var(--gm-text)] leading-snug mb-6 [&>em]:text-[var(--gm-gold)] [&>em]:italic"
                dangerouslySetInnerHTML={{ __html: copy.features[2].title }}
              />
              <p className="text-[var(--gm-text-dim)] font-light leading-relaxed text-lg mb-8">
                {copy.features[2].body}
              </p>
              <div className="flex flex-wrap gap-4 font-display text-[9px] tracking-[0.3em] uppercase text-[var(--gm-gold-deep)]">
                {copy.features[2].meta.map((m, i) => (
                  <span key={i} className="border border-[var(--gm-gold)]/30 py-2 px-4 rounded-full">{m}</span>
                ))}
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="relative group">
                {/* Cosmic Bond Glow */}
                <div className="absolute -inset-4 bg-gradient-to-bl from-[var(--gm-primary)]/20 to-blue-500/10 rounded-full blur-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-700" />
                
                <div className="relative aspect-[4/3] w-full max-w-[440px] overflow-hidden rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)] shadow-2xl">
                  <Image
                    src={synastryPath}
                    alt="Synastry Chart Example"
                    fill
                    sizes="(max-width: 768px) 100vw, 440px"
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  
                  {/* Overlay Interaction Badge */}
                  <div className="absolute top-4 right-4 px-4 py-1.5 bg-[var(--gm-text)]/90 backdrop-blur-md border border-[var(--gm-gold)]/30 rounded-full shadow-xl">
                    <span className="font-display text-[9px] tracking-[0.25em] text-[var(--gm-gold)] uppercase font-medium">Uyum Oranı: %85</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Energy Reflection / Theme Background Background Decor */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[300px] pointer-events-none opacity-40 mix-blend-screen overflow-hidden"
        style={{
          backgroundImage: 'var(--gm-bg-image)',
          backgroundSize: 'contain',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'no-repeat',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
        }}
      />
    </section>
  );
}
