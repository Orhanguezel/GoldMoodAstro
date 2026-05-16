import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Music2, Play, Square, RotateCcw } from 'lucide-react-native';
import { useAppTheme, type AppTheme } from '@/theme';
import { useAmbientMixer } from '@/hooks/useAmbientMixer';
import type { StemId, ZodiacSignKey } from '@/lib/relax/types';

const STEM_LABELS: Record<StemId, string> = {
  pad: 'Pad',
  rain: 'Yağmur',
  wind: 'Rüzgâr',
  water: 'Su',
  chimes: 'Çan',
  forest: 'Orman',
  binaural: 'Derin',
  crackle: 'Ateş',
};

function buildStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
    card: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.xl,
      padding: spacing.lg,
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      gap: spacing.md,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.inkDeep,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.line,
    },
    title: { fontFamily: font.display, fontSize: 18, color: colors.text },
    subtitle: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted, marginTop: 4 },
    notice: {
      fontFamily: font.sans,
      fontSize: 12,
      color: colors.textDim,
      lineHeight: 18,
      padding: 12,
      borderRadius: radius.md,
      backgroundColor: colors.inkDeep,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    stemLabel: { width: 56, fontFamily: font.sansMedium, fontSize: 11, color: colors.textMuted },
    track: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.lineSoft,
      overflow: 'hidden',
    },
    fill: { height: '100%', backgroundColor: colors.gold, borderRadius: 3 },
    stemVal: { width: 32, fontFamily: font.mono, fontSize: 10, color: colors.gold, textAlign: 'right' },
    actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    playBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: radius.pill,
      backgroundColor: colors.gold,
    },
    playBtnDisabled: { opacity: 0.45 },
    playText: { fontFamily: font.sansBold, fontSize: 12, color: colors.ink },
    ghostBtn: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.line,
    },
  });
}

type Props = {
  sign?: ZodiacSignKey;
};

export function RelaxMixerCard({ sign = 'aries' }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { colors } = theme;
  const mixer = useAmbientMixer(sign);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Music2 size={22} color={colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Rahatlatıcı ortam</Text>
          <Text style={styles.subtitle}>Burç enerjisine göre katman miksi</Text>
        </View>
      </View>

      {!mixer.stemsAvailable ? (
        <Text style={styles.notice}>
          Ses dosyaları henüz uygulamaya eklenmedi (FAZ 35 T35-1). Stem’ler
          `assets/sounds/relax/*.m4a` olarak paketlendiğinde buradan çalacak.
        </Text>
      ) : (
        mixer.stemIds.map((stem) => {
          const v = mixer.gains[stem] ?? 0;
          return (
            <Pressable
              key={stem}
              style={styles.row}
              onPress={() => mixer.setStemGain(stem, Math.min(1, v + 0.15))}
              onLongPress={() => mixer.setStemGain(stem, Math.max(0, v - 0.15))}
            >
              <Text style={styles.stemLabel}>{STEM_LABELS[stem]}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(v * 100)}%` }]} />
              </View>
              <Text style={styles.stemVal}>{Math.round(v * 100)}</Text>
            </Pressable>
          );
        })
      )}

      <View style={styles.actions}>
        <Pressable
          style={[styles.playBtn, (!mixer.stemsAvailable || mixer.busy) && styles.playBtnDisabled]}
          onPress={() => mixer.toggle()}
          disabled={!mixer.stemsAvailable || mixer.busy}
        >
          {mixer.busy ? (
            <ActivityIndicator color={colors.ink} size="small" />
          ) : mixer.playing ? (
            <>
              <Square size={16} color={colors.ink} fill={colors.ink} />
              <Text style={styles.playText}>Durdur</Text>
            </>
          ) : (
            <>
              <Play size={16} color={colors.ink} fill={colors.ink} />
              <Text style={styles.playText}>Çal</Text>
            </>
          )}
        </Pressable>
        <Pressable style={styles.ghostBtn} onPress={mixer.resetToSeed}>
          <RotateCcw size={16} color={colors.gold} />
        </Pressable>
      </View>
    </View>
  );
}
