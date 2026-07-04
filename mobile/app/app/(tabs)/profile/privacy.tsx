import React, { useMemo, useCallback, useState } from 'react';
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
  View
} from 'react-native';
import { useAppTheme, type AppTheme } from '@/theme';

import { logger } from '@/lib/logger';
function buildScreenStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  headerTitle: {
    fontFamily: font.display,
    fontSize: 18,
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  introArea: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: 12,
  },
  introTitle: {
    fontFamily: font.display,
    fontSize: 24,
    color: colors.text,
  },
  introSubtitle: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.xl,
  },
  dangerBorder: {
    borderColor: 'rgba(229, 91, 77, 0.3)',
  },
  sectionTitle: {
    fontFamily: font.display,
    fontSize: 16,
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dangerCard: {
    backgroundColor: 'rgba(229, 91, 77, 0.05)',
    borderRadius: radius.xl,
    padding: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  dangerText: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textDim,
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionText: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textDim,
    lineHeight: 20,
    marginBottom: 20,
  },
  exportBtn: {
    backgroundColor: colors.gold,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtnText: {
    fontFamily: font.sansBold,
    fontSize: 15,
    color: colors.ink,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  reasonInput: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 16,
    color: colors.text,
    fontFamily: font.sans,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 80,
    marginBottom: 16,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteBtnText: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: 'white',
    letterSpacing: 1,
  },
  pendingArea: {
    backgroundColor: 'rgba(240, 160, 48, 0.05)',
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(240, 160, 48, 0.2)',
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pendingTitle: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.warning,
  },
  pendingText: {
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.textDim,
    lineHeight: 18,
    marginBottom: 16,
  },
  bold: {
    fontFamily: font.sansBold,
    color: colors.text,
  },
  cancelBtn: {
    backgroundColor: colors.surface,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  cancelBtnText: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.text,
  },
  footerInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  goldLink: {
    color: colors.gold,
    fontFamily: font.sansBold,
  },
  });
}

import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation, Trans } from 'react-i18next';
import { useFocusEffect, router } from 'expo-router';
import { safeRouterBack } from '@/lib/navigation';
import { ChevronLeft, Download, Trash2, AlertTriangle, ShieldCheck, History } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import { kvkkApi } from '@/lib/api';

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

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { colors } = theme;  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  const { isAuthenticated, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<KvkkAccountDeletionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDeletionStatus = useCallback(async () => {
    try {
      setStatusLoading(true);
      const data = await kvkkApi.getDeletionStatus();
      setStatus(data);
    } catch (err) {
      logger.error('KVKK status fetch failed:', err);
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
      
      await Share.share({
        message: `${t('privacy.exportShareHeader', { defaultValue: 'GoldMoodAstro Veri İndirme ({{date}})', date: new Date().toLocaleString() })}\n\n${jsonText}`,
      });

      Alert.alert(t('common.success', 'Başarılı'), t('privacy.exportSuccessBody', 'Veri paketiniz dışa aktarıldı.'));
    } catch (err: any) {
      Alert.alert(t('common.error', 'Bir hata oluştu'), err.message || t('privacy.exportError', 'Veri indirilemedi.'));
    } finally {
      setIsExporting(false);
    }
  };

  const onRequestDeletion = async () => {
    if (status?.status === 'pending') {
      Alert.alert(t('privacy.requestActiveTitle', 'Talep aktif'), t('privacy.requestActiveBody', 'Zaten beklemede bir hesap silme talebiniz var.'));
      return;
    }

    Alert.alert(
      t('privacy.deleteAccount', 'Hesabı Sil'),
      t('privacy.deleteConfirmBody', 'Hesabınızı 7 gün sonra kalıcı silmek üzere işleme alalım mı? Bu süre içinde vazgeçebilirsiniz.'),
      [
        { text: t('common.giveUp', 'Vazgeç'), style: 'cancel' },
        {
          text: t('privacy.startRequest', 'Talebi Başlat'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsRequesting(true);
              const { data } = await kvkkApi.requestDeletion(deletionReason);
              setStatus(data);
              setDeletionReason('');
              Alert.alert(t('privacy.requestReceivedTitle', 'Talep Alındı'), t('privacy.requestReceivedBody', 'Hesabınız 7 gün içinde kalıcı olarak silinecek.'));
            } catch (err: any) {
              Alert.alert(t('common.error', 'Bir hata oluştu'), err.message || t('privacy.requestError', 'Talep oluşturulamadı.'));
            } finally {
              setIsRequesting(false);
            }
          },
        },
      ],
    );
  };

  const onCancelDeletion = async () => {
    Alert.alert(
      t('privacy.cancelRequestTitle', 'Talebi İptal Et'),
      t('privacy.cancelRequestBody', 'Hesap silme talebini iptal etmek istediğinize emin misiniz?'),
      [
        { text: t('common.giveUp', 'Vazgeç'), style: 'cancel' },
        {
          text: t('privacy.cancelRequestConfirm', 'Vazgeç ve İptal Et'),
          style: 'default',
          onPress: async () => {
            try {
              setIsCancelling(true);
              await kvkkApi.cancelDeletion();
              await loadDeletionStatus();
              Alert.alert(t('privacy.cancelledTitle', 'İptal Edildi'), t('privacy.cancelledBody', 'Hesap silme talebiniz durduruldu.'));
            } catch (err: any) {
              Alert.alert(t('common.error', 'Bir hata oluştu'), err.message || t('privacy.cancelError', 'Talep iptal edilemedi.'));
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ],
    );
  };

  if (authLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => safeRouterBack('/(tabs)/profile')} style={styles.headerBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('privacy.title', 'Gizlilik & Veri')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        >
          
          <View style={styles.introArea}>
            <ShieldCheck size={40} color={colors.gold} />
            <Text style={styles.introTitle}>{t('privacy.introTitle', 'Veri Haklarınız')}</Text>
            <Text style={styles.introSubtitle}>
              {t('privacy.introSubtitle', 'KVKK kapsamında verilerinizi yönetebilir, indirebilir veya hesabınızın silinmesini talep edebilirsiniz.')}
            </Text>
          </View>

          {/* Export Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Download size={20} color={colors.gold} />
              <Text style={styles.sectionTitle}>{t('privacy.exportSectionTitle', 'Verilerimi İndir')}</Text>
            </View>
            <Text style={styles.sectionText}>
              {t('privacy.exportSectionText', 'Hesabınıza ait tüm verileri (profil, randevular, haritalar) JSON formatında dışa aktarabilirsiniz.')}
            </Text>
            <Pressable
              style={[styles.exportBtn, isExporting && styles.btnDisabled]}
              onPress={onExport}
              disabled={isExporting}
            >
              {isExporting ? <ActivityIndicator size="small" color={colors.ink} /> : <Text style={styles.exportBtnText}>{t('privacy.exportBtn', 'Veri Paketini Hazırla')}</Text>}
            </Pressable>
          </View>

          {/* Deletion Section */}
          <View style={[styles.section, styles.dangerBorder]}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color={colors.danger} />
              <Text style={[styles.sectionTitle, { color: colors.danger }]}>{t('privacy.deleteSectionTitle', 'Hesabı Kalıcı Olarak Sil')}</Text>
            </View>

            {status?.status === 'pending' ? (
              <View style={styles.pendingArea}>
                <View style={styles.pendingHeader}>
                  <History size={16} color={colors.warning} />
                  <Text style={styles.pendingTitle}>{t('privacy.pendingTitle', 'Silme Talebi Beklemede')}</Text>
                </View>
                <Text style={styles.pendingText}>
                  <Trans i18nKey="privacy.pendingBody" defaults="Hesabınız <b>{{date}}</b> tarihinde kalıcı olarak silinecektir." values={{ date: formatDate(status.scheduled_for) }} components={{ b: <Text style={styles.bold} /> }} />
                </Text>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={onCancelDeletion}
                  disabled={isCancelling}
                >
                  {isCancelling ? <ActivityIndicator size="small" color={colors.text} /> : <Text style={styles.cancelBtnText}>{t('privacy.cancelRequestTitle', 'Talebi İptal Et')}</Text>}
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.sectionText}>
                  {t('privacy.deleteWarning', 'Hesabınızı sildiğinizde tüm geçmişiniz, kredileriniz ve verileriniz kalıcı olarak yok edilir. Bu işlem geri alınamaz.')}
                </Text>
                <TextInput
                  value={deletionReason}
                  onChangeText={setDeletionReason}
                  placeholder={t('privacy.reasonPlaceholder', 'Silme nedeni (isteğe bağlı)')}
                  placeholderTextColor={colors.textMuted}
                  style={styles.reasonInput}
                  multiline
                  maxLength={200}
                />
                <Pressable
                  style={[styles.deleteBtn, isRequesting && styles.btnDisabled]}
                  onPress={onRequestDeletion}
                  disabled={isRequesting}
                >
                  {isRequesting ? <ActivityIndicator size="small" color={colors.text} /> : (
                    <>
                      <Trash2 size={18} color={colors.text} />
                      <Text style={styles.deleteBtnText}>{t('privacy.requestDeleteBtn', 'Hesabımı Silmeyi Talep Et')}</Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </View>

          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>
              <Trans i18nKey="privacy.footerContact" defaults="Sorularınız için <link>destek@goldmoodastro.com</link> adresinden bize ulaşabilirsiniz." components={{ link: <Text style={styles.goldLink} /> }} />
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

