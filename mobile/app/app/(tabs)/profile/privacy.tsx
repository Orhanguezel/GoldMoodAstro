import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { ArrowLeft, AlertTriangle, ArrowRight, Download, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { kvkkApi } from '@/lib/api';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { KvkkAccountDeletionStatus } from '@/types';

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function previewSnippet(jsonText: string) {
  const maxLength = 1600;
  if (jsonText.length <= maxLength) return jsonText;
  return `${jsonText.slice(0, maxLength)}\n\n...verinin tamamı paylaşım ekranından gönderilmektedir`;
}

function isPendingDeletion(status: KvkkAccountDeletionStatus | null): status is KvkkAccountDeletionStatus {
  return status?.status === 'pending';
}

export default function PrivacyScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<KvkkAccountDeletionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportText, setExportText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadDeletionStatus = useCallback(async () => {
    try {
      setStatusLoading(true);
      const data = await kvkkApi.getDeletionStatus();
      setStatus(data);
    } catch (err) {
      console.error('KVKK status fetch failed:', err);
      setStatus(null);
    } finally {
      setStatusLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      if (!isAuthenticated) {
        router.replace('/auth/login' as any);
        return;
      }
      loadDeletionStatus();
    }, [authLoading, isAuthenticated, loadDeletionStatus]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDeletionStatus();
  };

  const onExport = async () => {
    Keyboard.dismiss();
    try {
      setIsExporting(true);
      const payload = await kvkkApi.exportMyData();
      const jsonText = JSON.stringify(payload, null, 2);
      setExportText(jsonText);
      try {
        await Share.share({
          message: `GoldMoodAstro veri dışa aktarma (${new Date().toLocaleString('tr-TR')})\n\n${jsonText}`,
        });
      } catch {
        Alert.alert('İndirme hazır', 'Verileriniz çekildi. Paylaşım özelliği desteklenmiyor ise ekrandaki önizlemeyi kontrol edin.');
      }
      Alert.alert('İndir', 'Veri paketiniz hazır ve paylaşım için gönderildi.');
    } catch (err: unknown) {
      console.error('KVKK export failed:', err);
      Alert.alert('Hata', (err as Error).message || 'Veri indirilemedi.');
    } finally {
      setIsExporting(false);
    }
  };

  const onRequestDeletion = async () => {
    if (isPendingDeletion(status)) {
      Alert.alert('Talep aktif', 'Zaten beklemede bir hesap silme talebiniz var.');
      return;
    }
    if (isRequesting) return;

    Alert.alert(
      'Hesabı sil',
      'Hesabınızı 7 gün sonra kalıcı silmek üzere işleme alalım mı?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Evet, başlat',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsRequesting(true);
              const { data } = await kvkkApi.requestDeletion(deletionReason);
              setStatus(data);
              setDeletionReason('');
              Alert.alert('Talep oluşturuldu', 'Hesabınız 7 gün içinde silinecek. Bu süre içinde iptal edebilirsiniz.');
            } catch (err: unknown) {
              console.error('KVKK request deletion failed:', err);
              Alert.alert('Hata', (err as Error).message || 'Talep oluşturulamadı.');
            } finally {
              setIsRequesting(false);
            }
          },
        },
      ],
    );
  };

  const onCancelDeletion = async () => {
    if (!isPendingDeletion(status)) {
      Alert.alert('Bilgi', 'Bekleyen bir hesap silme talebi yok.');
      return;
    }

    Alert.alert(
      'Talebi iptal et',
      'Hesap silme talebini iptal etmek istediğine emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true);
              await kvkkApi.cancelDeletion();
              await loadDeletionStatus();
              Alert.alert('İptal edildi', 'Hesap silme talebin başarıyla iptal edildi.');
            } catch (err: unknown) {
              console.error('KVKK cancel deletion failed:', err);
              Alert.alert('Hata', (err as Error).message || 'Talep iptal edilemedi.');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ],
    );
  };

  const pendingDate = status ? formatDate(status.scheduled_for) : '-';

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        >
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={18} color={colors.text} />
              <Text style={styles.backText}>Geri Dön</Text>
            </Pressable>
            <Text style={styles.title}>Tehlikeli Bölge</Text>
          </View>
          <Text style={styles.subtitle}>
            KVKK kapsamında veri taşınabilirliği ve hesap silme akışı.
          </Text>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Download size={18} color={colors.gold} />
              <Text style={styles.sectionTitle}>Verilerimi İndir</Text>
            </View>
            <Text style={styles.sectionText}>
              Hesabına ait veriler JSON olarak hazırlandıktan sonra paylaşım paneli ile dışarı aktarılır.
            </Text>
            <Pressable
              style={[styles.primaryButton, isExporting && styles.disabled]}
              onPress={onExport}
              disabled={isExporting}
            >
              {isExporting ? <ActivityIndicator size="small" color={colors.bg} /> : <Text style={styles.primaryButtonText}>Verilerimi İndir</Text>}
            </Pressable>
            {exportText ? (
              <View style={styles.previewCard}>
                <Text style={styles.sectionSubTitle}>İndirilen veri önizlemesi</Text>
                <View style={styles.previewWrapper}>
                  <Text style={styles.previewText}>{previewSnippet(exportText)}</Text>
                </View>
              </View>
            ) : null}
            <Text style={styles.infoText}>Uzun dosyalarda paylaşıma geçerken kısa süren yükleme olabilir.</Text>
          </View>

          <View style={[styles.section, styles.dangerSection]}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={18} color={colors.danger} />
              <Text style={[styles.sectionTitle, { color: colors.danger }]}>Hesabı Sil</Text>
            </View>
            <Text style={styles.sectionText}>
              Talebin onaylanırsa hesabın 7 gün sonra kalıcı olarak silinir.
            </Text>

            {statusLoading ? (
              <ActivityIndicator size="small" color={colors.danger} style={styles.loader} />
            ) : isPendingDeletion(status) ? (
              <>
                <View style={styles.dangerInfo}>
                  <Text style={styles.infoText}>Durum: <Text style={{ color: colors.text, fontFamily: font.sansMedium }}>beklemede</Text></Text>
                  <Text style={styles.infoText}>Planlanan silme: <Text style={styles.infoValue}>{pendingDate}</Text></Text>
                  <Text style={styles.infoText}>Soğuma süresi: <Text style={styles.infoValue}>7 gün</Text></Text>
                  {status.reason ? <Text style={styles.infoText}>Sebep: <Text style={styles.infoValue}>{status.reason}</Text></Text> : null}
                </View>
                <Pressable
                  style={[styles.dangerButton, isCancelling && styles.disabled]}
                  onPress={onCancelDeletion}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <ActivityIndicator size="small" color={colors.bg} />
                  ) : (
                    <>
                      <Trash2 size={16} color={colors.bg} />
                      <Text style={styles.dangerButtonText}>Hesap Silme Talebini İptal Et</Text>
                      <ArrowRight size={16} color={colors.bg} />
                    </>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <TextInput
                  value={deletionReason}
                  onChangeText={setDeletionReason}
                  placeholder="Silme nedeni (opsiyonel)"
                  placeholderTextColor={colors.textMuted}
                  style={styles.reasonInput}
                  multiline
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text style={styles.charCount}>{deletionReason.length}/500</Text>
                <Pressable
                  style={[styles.dangerButton, isRequesting && styles.disabled]}
                  onPress={onRequestDeletion}
                  disabled={isRequesting}
                >
                  {isRequesting ? (
                    <ActivityIndicator size="small" color={colors.bg} />
                  ) : (
                    <>
                      <AlertTriangle size={16} color={colors.bg} />
                      <Text style={styles.dangerButtonText}>Hesap Silme Talebi Oluştur</Text>
                      <ArrowRight size={16} color={colors.bg} />
                    </>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  backText: {
    color: colors.text,
    fontFamily: font.sansMedium,
    fontSize: 13,
  },
  title: {
    fontFamily: font.displayMedium,
    color: colors.text,
    fontSize: 24,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: font.sans,
    marginBottom: spacing['2xl'],
  },

  section: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.xl,
  },
  dangerSection: {
    borderColor: 'rgba(229, 91, 77, 0.35)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: font.sansMedium,
    color: colors.text,
    fontSize: 17,
  },
  sectionSubTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.textMuted,
    fontFamily: font.sansMedium,
    fontSize: 13,
  },
  sectionText: {
    color: colors.textMuted,
    fontFamily: font.sans,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  primaryButton: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.bg,
    fontFamily: font.sansMedium,
    fontSize: 14,
  },
  dangerButton: {
    marginTop: spacing.md,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.danger,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },
  dangerButtonText: {
    color: colors.bg,
    flex: 1,
    marginHorizontal: 10,
    fontFamily: font.sansMedium,
  },
  disabled: {
    opacity: 0.6,
  },
  loader: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  dangerInfo: {
    gap: 6,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(229, 91, 77, 0.20)',
    padding: spacing.md,
  },
  infoText: {
    color: colors.textMuted,
    fontFamily: font.sans,
    marginBottom: 6,
  },
  infoValue: {
    color: colors.text,
    fontFamily: font.sansMedium,
  },
  reasonInput: {
    minHeight: 110,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    padding: spacing.md,
    color: colors.text,
    fontFamily: font.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  charCount: {
    marginTop: spacing.xs,
    fontFamily: font.sans,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'right',
  },
  previewCard: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  previewWrapper: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    padding: spacing.md,
    maxHeight: 220,
  },
  previewText: {
    color: colors.textMuted,
    fontFamily: font.mono,
    fontSize: 11,
    lineHeight: 18,
  },
});

