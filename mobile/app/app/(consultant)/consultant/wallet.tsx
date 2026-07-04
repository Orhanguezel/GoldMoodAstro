import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme, type AppTheme } from '@/theme';
import { consultantSelfApi } from '@/lib/api';
import type { ConsultantWalletResponse, ConsultantWithdrawalRequest } from '@/types';

import { logger } from '@/lib/logger';
function buildStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    safe: { flex: 1 },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    kicker: { fontFamily: font.sansBold, fontSize: 11, letterSpacing: 2, color: colors.gold },
    title: { fontFamily: font.display, fontSize: 26, color: colors.text, marginTop: 4 },
    scroll: { padding: spacing.lg, paddingBottom: 48, gap: 14 },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 12 },
    balanceLabel: { fontFamily: font.sansBold, fontSize: 11, letterSpacing: 1.6, color: colors.gold },
    balance: { fontFamily: font.display, fontSize: 34, color: colors.text },
    muted: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted, lineHeight: 20 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    stat: { flex: 1, backgroundColor: colors.bgDeep, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.lineSoft },
    statLabel: { fontFamily: font.sansBold, fontSize: 10, color: colors.textMuted, letterSpacing: 1 },
    statValue: { fontFamily: font.display, fontSize: 20, color: colors.text, marginTop: 4 },
    input: { height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bgDeep, paddingHorizontal: 12, color: colors.text, fontFamily: font.sansBold, fontSize: 15 },
    btn: { height: 44, borderRadius: radius.pill, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontFamily: font.sansBold, fontSize: 13, color: colors.ink },
    sectionTitle: { fontFamily: font.sansBold, fontSize: 15, color: colors.text },
    txRow: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
    txIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgDeep },
    txBody: { flex: 1, gap: 3 },
    txTitle: { fontFamily: font.sansBold, fontSize: 13, color: colors.text },
    txMeta: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted },
    empty: { paddingVertical: 20, textAlign: 'center', fontFamily: font.sans, fontSize: 13, color: colors.textMuted },
  });
}

function money(value: string | number | undefined, currency = 'TRY') {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);
}

function errorBody(err: unknown): any {
  return err && typeof err === 'object' ? (err as { body?: unknown }).body : null;
}

export default function ConsultantWalletScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const [wallet, setWallet] = useState<ConsultantWalletResponse | null>(null);
  const [withdrawals, setWithdrawals] = useState<ConsultantWithdrawalRequest[]>([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [walletData, withdrawalData] = await Promise.all([
        consultantSelfApi.wallet(),
        consultantSelfApi.withdrawals(),
      ]);
      setWallet(walletData);
      setWithdrawals(withdrawalData);
    } catch (err) {
      logger.error('Consultant wallet load error:', err);
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

  const requestWithdraw = async () => {
    const parsed = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.wallet.invalidAmount', 'Geçerli bir tutar girin.'));
      return;
    }
    setSaving(true);
    try {
      await consultantSelfApi.requestWithdrawal({ amount: parsed });
      setAmount('');
      Alert.alert(t('consultantPanel.wallet.withdrawSentTitle', 'Talep alındı'), t('consultantPanel.wallet.withdrawSentBody', 'Para çekme talebiniz admin onayına gönderildi.'));
      load();
    } catch (err) {
      const body = errorBody(err);
      const message = body?.error?.message ?? (err instanceof Error ? err.message : '');
      const next = body?.error?.next_request_at ?? body?.next_request_at;
      let text = t('consultantPanel.wallet.withdrawError', 'Para çekme talebi oluşturulamadı.');
      if (message === 'kyc_required_for_withdrawal') {
        text = t('consultantPanel.wallet.kycRequired', 'Para çekebilmek için KYC onayınız tamamlanmış olmalı.');
      } else if (message === 'withdrawal_too_soon') {
        text = t('consultantPanel.wallet.tooSoon', 'Yeni talep için beklemeniz gerekiyor. Sonraki tarih: {{date}}', {
          date: next ? new Date(next).toLocaleString() : '-',
        });
      } else if (message === 'below_min_withdrawal_amount') {
        text = t('consultantPanel.wallet.belowMin', 'Talep tutarı minimum eşiğin altında.');
      } else if (message === 'bank_iban_required' || message === 'bank_account_holder_required') {
        text = t('consultantPanel.wallet.bankRequired', 'Banka IBAN ve hesap sahibi bilgileri tamamlanmalı.');
      } else if (message === 'insufficient_balance') {
        text = t('consultantPanel.wallet.insufficient', 'Bakiyeniz bu tutar için yeterli değil.');
      }
      Alert.alert(t('common.error', 'Hata'), text);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  const currency = wallet?.wallet.currency ?? 'TRY';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{t('consultantPanel.wallet.kicker', 'KAZANÇ & ÖDEME')}</Text>
          <Text style={styles.title}>{t('consultantPanel.wallet.title', 'Cüzdan')}</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
        >
          <View style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.balanceLabel}>{t('consultantPanel.wallet.balance', 'KULLANILABİLİR BAKİYE')}</Text>
                <Text style={styles.balance}>{money(wallet?.wallet.balance, currency)}</Text>
              </View>
              <Wallet size={30} color={colors.gold} />
            </View>
            <View style={styles.row}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>{t('consultantPanel.wallet.pending', 'BEKLEYEN')}</Text>
                <Text style={styles.statValue}>{money(wallet?.wallet.pending_balance, currency)}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>{t('consultantPanel.wallet.monthNet', '30 GÜN NET')}</Text>
                <Text style={styles.statValue}>{money(wallet?.this_month.net, currency)}</Text>
              </View>
            </View>
            <Text style={styles.muted}>{t('consultantPanel.wallet.note', 'Çekim talepleri KYC onayı, minimum eşik ve aylık payout döngüsü kontrolünden geçer.')}</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="1000"
              placeholderTextColor={colors.textMuted}
            />
            <Pressable style={styles.btn} onPress={requestWithdraw} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.btnText}>{t('consultantPanel.wallet.withdraw', 'Para Çekme Talebi Oluştur')}</Text>}
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('consultantPanel.wallet.transactions', 'Son işlemler')}</Text>
            {wallet?.transactions.length ? wallet.transactions.slice(0, 8).map((tx) => (
              <View key={tx.id} style={styles.txRow}>
                <View style={styles.txIcon}>
                  {tx.type === 'credit' ? <ArrowDownLeft size={17} color={colors.success} /> : <ArrowUpRight size={17} color={colors.danger} />}
                </View>
                <View style={styles.txBody}>
                  <Text style={styles.txTitle}>{tx.purpose || tx.type}</Text>
                  <Text style={styles.txMeta}>{tx.payment_status} · {new Date(tx.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.txTitle}>{money(tx.amount, tx.currency ?? currency)}</Text>
              </View>
            )) : <Text style={styles.empty}>{t('consultantPanel.wallet.noTransactions', 'Henüz işlem yok.')}</Text>}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('consultantPanel.wallet.withdrawals', 'Çekim talepleri')}</Text>
            <FlatList
              data={withdrawals.slice(0, 6)}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.empty}>{t('consultantPanel.wallet.noWithdrawals', 'Henüz çekim talebi yok.')}</Text>}
              renderItem={({ item }) => (
                <View style={styles.txRow}>
                  <View style={styles.txBody}>
                    <Text style={styles.txTitle}>{money(item.amount, item.currency)}</Text>
                    <Text style={styles.txMeta}>{item.status} · {new Date(item.requested_at).toLocaleDateString()}</Text>
                    {!!item.rejection_reason && <Text style={styles.txMeta}>{item.rejection_reason}</Text>}
                  </View>
                </View>
              )}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
