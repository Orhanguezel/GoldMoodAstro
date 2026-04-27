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
import { ChevronLeft, Download, Trash2, AlertTriangle, ShieldCheck, History } from 'lucide-react-native';

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

export default function PrivacyScreen() {
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
      
      await Share.share({
        message: `GoldMoodAstro Veri İndirme (${new Date().toLocaleString('tr-TR')})\n\n${jsonText}`,
      });
      
      Alert.alert('Başarılı', 'Veri paketiniz dışa aktarıldı.');
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Veri indirilemedi.');
    } finally {
      setIsExporting(false);
    }
  };

  const onRequestDeletion = async () => {
    if (status?.status === 'pending') {
      Alert.alert('Talep aktif', 'Zaten beklemede bir hesap silme talebiniz var.');
      return;
    }
    
    Alert.alert(
      'Hesabı Sil',
      'Hesabınızı 7 gün sonra kalıcı silmek üzere işleme alalım mı? Bu süre içinde vazgeçebilirsiniz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Talebi Başlat',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsRequesting(true);
              const { data } = await kvkkApi.requestDeletion(deletionReason);
              setStatus(data);
              setDeletionReason('');
              Alert.alert('Talep Alındı', 'Hesabınız 7 gün içinde kalıcı olarak silinecek.');
            } catch (err: any) {
              Alert.alert('Hata', err.message || 'Talep oluşturulamadı.');
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
      'Talebi İptal Et',
      'Hesap silme talebini iptal etmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Vazgeç ve İptal Et',
          style: 'default',
          onPress: async () => {
            try {
              setIsCancelling(true);
              await kvkkApi.cancelDeletion();
              await loadDeletionStatus();
              Alert.alert('İptal Edildi', 'Hesap silme talebiniz durduruldu.');
            } catch (err: any) {
              Alert.alert('Hata', err.message || 'Talep iptal edilemedi.');
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
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Gizlilik & Veri</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        >
          
          <View style={styles.introArea}>
            <ShieldCheck size={40} color={colors.gold} />
            <Text style={styles.introTitle}>Veri Haklarınız</Text>
            <Text style={styles.introSubtitle}>
              KVKK kapsamında verilerinizi yönetebilir, indirebilir veya hesabınızın silinmesini talep edebilirsiniz.
            </Text>
          </View>

          {/* Export Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Download size={20} color={colors.gold} />
              <Text style={styles.sectionTitle}>Verilerimi İndir</Text>
            </View>
            <Text style={styles.sectionText}>
              Hesabınıza ait tüm verileri (profil, randevular, haritalar) JSON formatında dışa aktarabilirsiniz.
            </Text>
            <Pressable
              style={[styles.exportBtn, isExporting && styles.btnDisabled]}
              onPress={onExport}
              disabled={isExporting}
            >
              {isExporting ? <ActivityIndicator size="small" color={colors.bgDeep} /> : <Text style={styles.exportBtnText}>Veri Paketini Hazırla</Text>}
            </Pressable>
          </View>

          {/* Deletion Section */}
          <View style={[styles.section, styles.dangerBorder]}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color={colors.danger} />
              <Text style={[styles.sectionTitle, { color: colors.danger }]}>Hesabı Kalıcı Olarak Sil</Text>
            </View>
            
            {status?.status === 'pending' ? (
              <View style={styles.pendingArea}>
                <View style={styles.pendingHeader}>
                  <History size={16} color={colors.warning} />
                  <Text style={styles.pendingTitle}>Silme Talebi Beklemede</Text>
                </View>
                <Text style={styles.pendingText}>
                  Hesabınız <Text style={styles.bold}>{formatDate(status.scheduled_for)}</Text> tarihinde kalıcı olarak silinecektir.
                </Text>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={onCancelDeletion}
                  disabled={isCancelling}
                >
                  {isCancelling ? <ActivityIndicator size="small" color={colors.text} /> : <Text style={styles.cancelBtnText}>Talebi İptal Et</Text>}
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.sectionText}>
                  Hesabınızı sildiğinizde tüm geçmişiniz, kredileriniz ve verileriniz kalıcı olarak yok edilir. Bu işlem geri alınamaz.
                </Text>
                <TextInput
                  value={deletionReason}
                  onChangeText={setDeletionReason}
                  placeholder="Silme nedeni (isteğe bağlı)"
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
                      <Text style={styles.deleteBtnText}>Hesabımı Silmeyi Talep Et</Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </View>

          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>
              Sorularınız için <Text style={styles.goldLink}>destek@goldmoodastro.com</Text> adresinden bize ulaşabilirsiniz.
            </Text>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: font.display,
    fontSize: 16,
    color: colors.text,
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
    color: colors.bgDeep,
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
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteBtnText: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.danger,
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
