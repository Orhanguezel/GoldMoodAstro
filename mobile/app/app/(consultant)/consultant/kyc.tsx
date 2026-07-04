import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { FileUp, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme, type AppTheme } from '@/theme';
import { consultantSelfApi } from '@/lib/api';
import type { ConsultantKycDocument, ConsultantSelfProfile } from '@/types';

import { logger } from '@/lib/logger';
const DOC_TYPES: Array<{ type: ConsultantKycDocument['type']; key: string }> = [
  { type: 'id_front', key: 'idFront' },
  { type: 'id_back', key: 'idBack' },
  { type: 'tax_certificate', key: 'taxCertificate' },
  { type: 'other', key: 'other' },
];

function buildStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    safe: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    kicker: { fontFamily: font.sansBold, fontSize: 11, letterSpacing: 2, color: colors.gold },
    title: { fontFamily: font.display, fontSize: 26, color: colors.text, marginTop: 4 },
    scroll: { padding: spacing.lg, paddingBottom: 48, gap: 14 },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 12 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    status: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: 'rgba(201,169,97,0.12)' },
    statusText: { fontFamily: font.sansBold, fontSize: 11, color: colors.gold },
    sectionTitle: { fontFamily: font.sansBold, fontSize: 15, color: colors.text },
    help: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted, lineHeight: 20 },
    label: { fontFamily: font.sansBold, fontSize: 10, color: colors.textMuted, letterSpacing: 1 },
    input: { height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bgDeep, paddingHorizontal: 12, color: colors.text, fontFamily: font.sansBold, fontSize: 14 },
    fields: { gap: 10 },
    typeRow: { flexDirection: 'row', gap: 8 },
    chip: { flex: 1, height: 38, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
    chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    chipText: { fontFamily: font.sansBold, fontSize: 12, color: colors.textMuted },
    chipTextActive: { color: colors.ink },
    uploadBtn: { height: 44, borderRadius: radius.pill, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    uploadText: { fontFamily: font.sansBold, fontSize: 13, color: colors.ink },
    outlineBtn: { height: 44, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
    outlineText: { fontFamily: font.sansBold, fontSize: 13, color: colors.gold },
    docRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.lineSoft, gap: 3 },
    docTitle: { fontFamily: font.sansBold, fontSize: 13, color: colors.text },
    docMeta: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted },
    errorText: { fontFamily: font.sansBold, fontSize: 13, color: colors.danger, lineHeight: 20 },
  });
}

function asAccountType(value: unknown): 'individual' | 'company' {
  return value === 'company' ? 'company' : 'individual';
}

function errorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const body = (err as { body?: any }).body;
  return String(body?.error?.message ?? (err as Error).message ?? '');
}

export default function ConsultantKycScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const [profile, setProfile] = useState<ConsultantSelfProfile | null>(null);
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
  const [identityNumber, setIdentityNumber] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [taxOffice, setTaxOffice] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [bankName, setBankName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const hydrate = (p: ConsultantSelfProfile) => {
    setProfile(p);
    setAccountType(asAccountType(p.account_type));
    setIdentityNumber(p.identity_number ?? '');
    setTaxNumber(p.tax_number ?? '');
    setTaxOffice(p.tax_office ?? '');
    setCompanyName(p.company_name ?? '');
    setBankHolder(p.bank_account_holder ?? '');
    setBankIban(p.bank_iban ?? '');
    setBankName(p.bank_name ?? '');
  };

  const load = useCallback(async () => {
    try {
      hydrate(await consultantSelfApi.profile());
    } catch (err) {
      logger.error('KYC profile load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const saveProfileFields = async () => {
    await consultantSelfApi.updateProfile({
      account_type: accountType,
      identity_number: accountType === 'individual' ? identityNumber.trim() : null,
      tax_number: accountType === 'company' ? taxNumber.trim() : null,
      tax_office: accountType === 'company' ? taxOffice.trim() : null,
      company_name: accountType === 'company' ? companyName.trim() : null,
      bank_account_holder: bankHolder.trim(),
      bank_iban: bankIban.trim() || null,
      bank_name: bankName.trim() || null,
    });
  };

  const uploadDoc = async (type: ConsultantKycDocument['type']) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('avatar.permissionTitle', 'İzin gerekli'), t('avatar.permissionBody', 'Fotoğraf seçmek için izin vermelisiniz.'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setSaving(true);
    try {
      const asset = result.assets[0];
      await consultantSelfApi.uploadKycDocument({
        type,
        uri: asset.uri,
        name: asset.fileName ?? `${type}-${Date.now()}.jpg`,
        mime: asset.mimeType ?? 'image/jpeg',
      });
      await load();
      Alert.alert(t('common.success', 'Başarılı'), t('consultantPanel.kyc.uploaded', 'Belge yüklendi.'));
    } catch (err) {
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.kyc.uploadError', 'Belge yüklenemedi.'));
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      await saveProfileFields();
      await consultantSelfApi.submitKyc();
      await load();
      Alert.alert(t('consultantPanel.kyc.submittedTitle', 'KYC gönderildi'), t('consultantPanel.kyc.submittedBody', 'Başvurunuz admin onayına gönderildi.'));
    } catch (err) {
      const msg = errorMessage(err);
      const mapped =
        msg === 'invalid_identity_number'
          ? t('consultantPanel.kyc.invalidIdentity', 'Geçerli bir T.C. kimlik numarası girin.')
          : msg === 'bank_account_holder_required'
            ? t('consultantPanel.kyc.bankHolderRequired', 'Banka hesap sahibi zorunlu.')
            : msg === 'account_type_required'
              ? t('consultantPanel.kyc.accountTypeRequired', 'Hesap tipi seçin.')
              : msg === 'invalid_tax_number'
                ? t('consultantPanel.kyc.invalidTax', 'Geçerli bir vergi numarası girin.')
                : msg === 'tax_office_required'
                  ? t('consultantPanel.kyc.taxOfficeRequired', 'Vergi dairesi zorunlu.')
                  : msg === 'company_name_required'
                    ? t('consultantPanel.kyc.companyNameRequired', 'Şirket adı zorunlu.')
                    : t('consultantPanel.kyc.submitError', 'KYC başvurusu gönderilemedi. Eksik alanları kontrol edin.');
      Alert.alert(t('common.error', 'Hata'), mapped);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  const documents = profile?.kyc_documents ?? [];
  const locked = profile?.kyc_status === 'pending' || profile?.kyc_status === 'approved';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{t('consultantPanel.kyc.kicker', 'KİMLİK DOĞRULAMA')}</Text>
          <Text style={styles.title}>{t('consultantPanel.kyc.title', 'KYC')}</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
        >
          <View style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.sectionTitle}>{t('consultantPanel.kyc.statusTitle', 'Başvuru durumu')}</Text>
                <Text style={styles.help}>{t('consultantPanel.kyc.statusHelp', 'Onay tamamlanmadan para çekme talebi oluşturamazsınız.')}</Text>
              </View>
              <View style={styles.status}>
                <Text style={styles.statusText}>{t(`consultantPanel.kyc.status.${profile?.kyc_status ?? 'none'}`, profile?.kyc_status ?? 'none')}</Text>
              </View>
            </View>
            {!!profile?.kyc_rejection_reason && <Text style={styles.errorText}>{profile.kyc_rejection_reason}</Text>}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('consultantPanel.kyc.infoTitle', 'Kimlik ve banka bilgileri')}</Text>
            <View style={styles.typeRow}>
              {(['individual', 'company'] as const).map((type) => {
                const active = accountType === type;
                return (
                  <Pressable key={type} style={[styles.chip, active && styles.chipActive]} onPress={() => setAccountType(type)} disabled={locked}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(`consultantPanel.kyc.account.${type}`, type)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.fields}>
              {accountType === 'individual' ? (
                <>
                  <Text style={styles.label}>{t('consultantPanel.kyc.identityNumber', 'T.C. KİMLİK NO')}</Text>
                  <TextInput style={styles.input} value={identityNumber} onChangeText={setIdentityNumber} keyboardType="number-pad" editable={!locked} />
                </>
              ) : (
                <>
                  <Text style={styles.label}>{t('consultantPanel.kyc.taxNumber', 'VERGİ NO')}</Text>
                  <TextInput style={styles.input} value={taxNumber} onChangeText={setTaxNumber} keyboardType="number-pad" editable={!locked} />
                  <Text style={styles.label}>{t('consultantPanel.kyc.taxOffice', 'VERGİ DAİRESİ')}</Text>
                  <TextInput style={styles.input} value={taxOffice} onChangeText={setTaxOffice} editable={!locked} />
                  <Text style={styles.label}>{t('consultantPanel.kyc.companyName', 'ŞİRKET ADI')}</Text>
                  <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName} editable={!locked} />
                </>
              )}
              <Text style={styles.label}>{t('consultantPanel.kyc.bankHolder', 'BANKA HESAP SAHİBİ')}</Text>
              <TextInput style={styles.input} value={bankHolder} onChangeText={setBankHolder} editable={!locked} />
              <Text style={styles.label}>{t('consultantPanel.kyc.bankIban', 'IBAN')}</Text>
              <TextInput style={styles.input} value={bankIban} onChangeText={setBankIban} autoCapitalize="characters" editable={!locked} />
              <Text style={styles.label}>{t('consultantPanel.kyc.bankName', 'BANKA')}</Text>
              <TextInput style={styles.input} value={bankName} onChangeText={setBankName} editable={!locked} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('consultantPanel.kyc.documentsTitle', 'Belgeler')}</Text>
            <Text style={styles.help}>{t('consultantPanel.kyc.documentsHelp', 'Kimlik ön/arka yüzünü, şirket hesabı için vergi levhasını yükleyin.')}</Text>
            {DOC_TYPES.filter((doc) => accountType === 'company' || doc.type !== 'tax_certificate').map((doc) => {
              const uploaded = documents.some((item) => item.type === doc.type);
              return (
                <Pressable key={doc.type} style={styles.outlineBtn} onPress={() => uploadDoc(doc.type)} disabled={saving || locked}>
                  <Text style={styles.outlineText}>
                    {uploaded ? '✓ ' : ''}
                    {t(`consultantPanel.kyc.docs.${doc.key}`, doc.type)}
                  </Text>
                </Pressable>
              );
            })}
            {documents.map((doc) => (
              <View key={`${doc.type}-${doc.uploaded_at ?? doc.url}`} style={styles.docRow}>
                <Text style={styles.docTitle}>{doc.type}</Text>
                <Text style={styles.docMeta}>{doc.name ?? doc.mime ?? doc.url}</Text>
              </View>
            ))}
          </View>

          {!locked ? (
            <Pressable style={styles.uploadBtn} onPress={submit} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.ink} /> : <ShieldCheck size={16} color={colors.ink} />}
              <Text style={styles.uploadText}>{t('consultantPanel.kyc.submit', 'KYC Başvurusunu Gönder')}</Text>
            </Pressable>
          ) : (
            <View style={styles.card}>
              <View style={styles.row}>
                <FileUp size={20} color={colors.gold} />
                <Text style={[styles.help, { flex: 1 }]}>{t('consultantPanel.kyc.locked', 'Başvuru gönderildi veya onaylandı; değişiklik için destek ekibiyle iletişime geçin.')}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
