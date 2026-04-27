import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { format, parseISO } from 'date-fns';
import { colors, spacing, font, radius, shadows } from '@/theme/tokens';
import type { Review } from '@/types';

type Props = {
  reviews: Review[];
  loading?: boolean;
  emptyText?: string;
};

function ratingLabel(avg: number): string {
  return avg.toFixed(1);
}

function formatDate(value?: string): string {
  if (!value) return '';
  try {
    return format(parseISO(value), 'dd MMMM yyyy');
  } catch {
    return '';
  }
}

function isTrueBoolean(value: boolean | number | undefined): boolean {
  return value === true || value === 1;
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} style={[styles.star, { fontSize: size }, rating >= n ? styles.starFilled : styles.starEmpty]}>
          {rating >= n ? '★' : '☆'}
        </Text>
      ))}
    </View>
  );
}

function buildSummary(reviews: Review[]) {
  if (!reviews.length) return { count: 0, avg: 0 };

  const sum = reviews.reduce((acc, review) => acc + (Number(review.rating) || 0), 0);
  return {
    count: reviews.length,
    avg: sum / reviews.length,
  };
}

export default function ReviewList({ reviews, loading, emptyText = 'Henüz değerlendirme yok.' }: Props) {
  const summary = buildSummary(reviews);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!reviews.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Değerlendirmeler</Text>
      <View style={styles.summary}>
        <Text style={styles.avgText}>{ratingLabel(summary.avg)}</Text>
        <StarRow rating={Math.round(summary.avg)} size={16} />
        <Text style={styles.countText}>
          {summary.count} değerlendirme
        </Text>
      </View>

      {reviews.map((review) => {
        const reply = review.consultant_reply || review.admin_reply;
        return (
          <View key={review.id} style={styles.card}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.author}>
                  {review.name ? `${review.name}` : 'Danışan'}
                </Text>
                <Text style={styles.date}>{formatDate(review.created_at)}</Text>
              </View>
              <View style={styles.scoreRow}>
                <StarRow rating={Number(review.rating)} />
                {isTrueBoolean(review.is_verified) ? (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓ Doğrulanmış görüşme</Text>
                  </View>
                ) : null}
              </View>
            </View>
            {!!review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}

            {!!reply ? (
              <View style={styles.replyBox}>
                <Text style={styles.replyTitle}>
                  {review.consultant_reply ? 'Astrologun Cevabı' : 'Admin Cevabı'}
                </Text>
                <Text style={styles.replyText}>{reply}</Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.stardust,
    fontFamily: font.display,
    fontSize: 20,
  },
  summary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  avgText: {
    color: colors.gold,
    fontFamily: font.sansBold,
    fontSize: 28,
  },
  starRow: {
    flexDirection: 'row',
    gap: 4,
  },
  star: {
    color: colors.textMuted,
    fontFamily: font.serif,
  },
  starFilled: {
    color: colors.gold,
  },
  starEmpty: {
    color: colors.textMuted,
  },
  countText: {
    color: colors.textDim,
    fontSize: 13,
    fontFamily: font.sans,
  },
  card: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  author: {
    fontFamily: font.sansMedium,
    color: colors.stardust,
    fontSize: 14,
  },
  date: {
    color: colors.textDim,
    fontFamily: font.sans,
    fontSize: 11,
  },
  scoreRow: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  comment: {
    color: colors.text,
    fontFamily: font.sans,
    fontSize: 14,
    lineHeight: 22,
  },
  verifiedBadge: {
    marginTop: 2,
    backgroundColor: `${colors.success}20`,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  verifiedText: {
    color: colors.success,
    fontFamily: font.sansMedium,
    fontSize: 11,
  },
  replyBox: {
    marginTop: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    paddingLeft: spacing.md,
    gap: 6,
  },
  replyTitle: {
    color: colors.gold,
    fontFamily: font.sansMedium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  replyText: {
    color: colors.textDim,
    fontFamily: font.sans,
    fontSize: 13,
    lineHeight: 20,
  },
  loader: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textDim,
    fontFamily: font.sans,
    fontSize: 14,
  },
});
