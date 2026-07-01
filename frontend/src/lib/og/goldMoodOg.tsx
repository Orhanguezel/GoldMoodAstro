import { ImageResponse } from 'next/og';
import { DEFAULT_TOKENS } from '../tokens/defaults';

export const ogSize = {
  width: 1200,
  height: 630,
};

type GoldMoodOgParams = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  metric?: string;
  chips?: string[];
  symbols?: string[];
};

export function createGoldMoodOgImage({
  title,
  subtitle,
  eyebrow = 'GoldMoodAstro',
  metric,
  chips = [],
  symbols = ['☉', '☽', '✦'],
}: GoldMoodOgParams) {
  const colors = DEFAULT_TOKENS.colors;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${colors.bg_base_dark} 0%, ${colors.bg_deep_dark} 46%, ${colors.brand_accent} 100%)`,
          color: colors.gold_50,
          fontFamily: 'Georgia, serif',
          padding: 64,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 16% 18%, ${colors.gold_50}48, transparent 24%), radial-gradient(circle at 86% 72%, ${colors.brand_primary_light}30, transparent 30%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: -90,
            top: -80,
            width: 420,
            height: 420,
            borderRadius: 420,
            border: `2px solid ${colors.gold_50}48`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 72,
            bottom: 52,
            display: 'flex',
            gap: 18,
            color: `${colors.gold_50}7a`,
            fontSize: 42,
          }}
        >
          {symbols.map((symbol) => (
            <span key={symbol}>{symbol}</span>
          ))}
        </div>
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 42,
                background: colors.brand_primary,
                boxShadow: `0 0 36px ${colors.brand_primary}66`,
              }}
            />
            <div
              style={{
                fontSize: 26,
                letterSpacing: 4,
                textTransform: 'uppercase',
                color: colors.brand_primary_light,
              }}
            >
              {eyebrow}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {metric ? (
              <div
                style={{
                  display: 'flex',
                  alignSelf: 'flex-start',
                  border: `1px solid ${colors.gold_50}73`,
                  borderRadius: 999,
                  padding: '12px 24px',
                  fontSize: 30,
                  color: colors.brand_primary_light,
                  background: 'rgba(0, 0, 0, 0.38)',
                }}
              >
                {metric}
              </div>
            ) : null}
            <div
              style={{
                maxWidth: 920,
                fontSize: 76,
                lineHeight: 0.98,
                fontWeight: 700,
                textWrap: 'balance',
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                style={{
                  maxWidth: 820,
                  fontSize: 31,
                  lineHeight: 1.25,
                  color: colors.text_secondary_dark,
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {chips.map((chip) => (
              <div
                key={chip}
                style={{
                  border: `1px solid ${colors.gold_50}2e`,
                  borderRadius: 999,
                  padding: '10px 18px',
                  fontSize: 23,
                  color: colors.gold_50,
                  background: 'rgba(255, 255, 255, 0.07)',
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    ogSize,
  );
}

export const zodiacLabels: Record<string, string> = {
  aries: 'Aries',
  taurus: 'Taurus',
  gemini: 'Gemini',
  cancer: 'Cancer',
  leo: 'Leo',
  virgo: 'Virgo',
  libra: 'Libra',
  scorpio: 'Scorpio',
  sagittarius: 'Sagittarius',
  capricorn: 'Capricorn',
  aquarius: 'Aquarius',
  pisces: 'Pisces',
};
