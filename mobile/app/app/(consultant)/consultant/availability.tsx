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
import { CalendarOff, Clock3, Save, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme, type AppTheme } from '@/theme';
import { consultantSelfApi } from '@/lib/api';
import type { ConsultantTimeBlock, ConsultantWorkingHour } from '@/types';

import { logger } from '@/lib/logger';
const DOWS = [1, 2, 3, 4, 5, 6, 7];
const DEFAULT_HOUR = {
  start_time: '10:00',
  end_time: '18:00',
  slot_minutes: 30,
  capacity: 1,
  is_active: 0,
};

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    safe: { flex: 1 },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    kicker: { fontFamily: font.sansBold, fontSize: 11, letterSpacing: 2, color: colors.gold },
    title: { fontFamily: font.display, fontSize: 26, color: colors.text, marginTop: 4 },
    scroll: { padding: spacing.lg, paddingBottom: 48, gap: 14 },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 12 },
    sectionTitle: { fontFamily: font.sansBold, fontSize: 15, color: colors.text },
    help: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted, lineHeight: 20 },
    dayRow: { gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
    dayTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    dayName: { fontFamily: font.sansBold, fontSize: 14, color: colors.text },
    switch: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bgDeep },
    switchActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    switchText: { fontFamily: font.sansBold, fontSize: 11, color: colors.textMuted },
    switchTextActive: { color: colors.ink },
    inputs: { flexDirection: 'row', gap: 8 },
    inputWrap: { flex: 1, gap: 5 },
    label: { fontFamily: font.sansBold, fontSize: 10, color: colors.textMuted, letterSpacing: 1 },
    input: { height: 42, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bgDeep, paddingHorizontal: 10, color: colors.text, fontFamily: font.sansBold, fontSize: 13 },
    btn: { height: 44, borderRadius: radius.pill, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    btnText: { fontFamily: font.sansBold, fontSize: 13, color: colors.ink },
    outlineBtn: { height: 42, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    outlineText: { fontFamily: font.sansBold, fontSize: 12, color: colors.gold },
    dangerBtn: { borderColor: colors.danger },
    dangerText: { color: colors.danger },
    blockRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.lineSoft, gap: 5 },
    blockTitle: { fontFamily: font.sansBold, fontSize: 13, color: colors.text },
    blockMeta: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted },
    empty: { paddingVertical: 20, alignItems: 'center', gap: 8 },
    emptyText: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  });
}

export default function ConsultantAvailabilityScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const [hours, setHours] = useState<ConsultantWorkingHour[]>([]);
  const [blocks, setBlocks] = useState<ConsultantTimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(todayYmd());
  const [blockStart, setBlockStart] = useState('13:00');
  const [blockEnd, setBlockEnd] = useState('14:00');
  const [blockReason, setBlockReason] = useState('');

  const ensureSevenDays = useCallback((incoming: ConsultantWorkingHour[]) => {
    return DOWS.map((dow) => {
      const found = incoming.find((item) => Number(item.dow) === dow);
      return {
        ...DEFAULT_HOUR,
        ...found,
        dow,
        start_time: String(found?.start_time ?? DEFAULT_HOUR.start_time).slice(0, 5),
        end_time: String(found?.end_time ?? DEFAULT_HOUR.end_time).slice(0, 5),
        slot_minutes: Number(found?.slot_minutes ?? DEFAULT_HOUR.slot_minutes),
        capacity: 1,
        is_active: Number(found?.is_active ?? DEFAULT_HOUR.is_active),
      };
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const [availability, blockList] = await Promise.all([
        consultantSelfApi.availability(),
        consultantSelfApi.timeBlocks(date),
      ]);
      setHours(ensureSevenDays(availability.working_hours ?? []));
      setBlocks(blockList);
    } catch (err) {
      logger.error('Consultant availability load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date, ensureSevenDays]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const setHour = (dow: number, patch: Partial<ConsultantWorkingHour>) => {
    setHours((prev) => prev.map((item) => (item.dow === dow ? { ...item, ...patch } : item)));
  };

  const saveHours = async () => {
    setSaving(true);
    try {
      await consultantSelfApi.updateAvailability(hours);
      Alert.alert(t('common.success', 'Başarılı'), t('consultantPanel.availability.saved', 'Müsaitlik saatleri kaydedildi.'));
      load();
    } catch (err) {
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.availability.saveError', 'Müsaitlik kaydedilemedi. Saat aralıklarını kontrol edin.'));
    } finally {
      setSaving(false);
    }
  };

  const overrideDay = async (isActive: 0 | 1) => {
    setSaving(true);
    try {
      await consultantSelfApi.overrideAvailabilityDay({ date, is_active: isActive });
      Alert.alert(
        t('common.success', 'Başarılı'),
        isActive
          ? t('consultantPanel.availability.dayOpened', 'Seçili gün tekrar açıldı.')
          : t('consultantPanel.availability.dayClosed', 'Seçili gün kapatıldı.'),
      );
    } catch (err) {
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.availability.dayError', 'Gün durumu değiştirilemedi. Rezervasyon olabilir.'));
    } finally {
      setSaving(false);
    }
  };

  const createBlock = async () => {
    setSaving(true);
    try {
      await consultantSelfApi.createTimeBlock({
        block_date: date,
        start_time: blockStart,
        end_time: blockEnd,
        reason: blockReason.trim() || null,
      });
      setBlockReason('');
      setBlocks(await consultantSelfApi.timeBlocks(date));
    } catch (err) {
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.availability.blockError', 'Mola eklenemedi. Saat aralığını kontrol edin.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteBlock = async (id: string) => {
    setSaving(true);
    try {
      await consultantSelfApi.deleteTimeBlock(id);
      setBlocks((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.availability.blockDeleteError', 'Mola silinemedi.'));
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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{t('consultantPanel.availability.kicker', 'ÇALIŞMA SAATLERİ')}</Text>
          <Text style={styles.title}>{t('consultantPanel.availability.title', 'Müsaitlik yönetimi')}</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('consultantPanel.availability.weeklyTitle', 'Haftalık saatler')}</Text>
            <Text style={styles.help}>{t('consultantPanel.availability.weeklyHelp', 'Aktif günlerde başlangıç, bitiş ve slot süresini HH:mm formatında girin.')}</Text>
            {hours.map((item) => {
              const active = item.is_active === 1;
              return (
                <View key={item.dow} style={styles.dayRow}>
                  <View style={styles.dayTop}>
                    <Text style={styles.dayName}>{t(`consultantPanel.availability.days.${item.dow}`, `Gün ${item.dow}`)}</Text>
                    <Pressable
                      style={[styles.switch, active && styles.switchActive]}
                      onPress={() => setHour(item.dow, { is_active: active ? 0 : 1 })}
                    >
                      <Text style={[styles.switchText, active && styles.switchTextActive]}>
                        {active ? t('common.active', 'Aktif') : t('common.passive', 'Pasif')}
                      </Text>
                    </Pressable>
                  </View>
                  <View style={styles.inputs}>
                    <View style={styles.inputWrap}>
                      <Text style={styles.label}>{t('consultantPanel.availability.start', 'BAŞLANGIÇ')}</Text>
                      <TextInput style={styles.input} value={item.start_time} onChangeText={(v) => setHour(item.dow, { start_time: v })} />
                    </View>
                    <View style={styles.inputWrap}>
                      <Text style={styles.label}>{t('consultantPanel.availability.end', 'BİTİŞ')}</Text>
                      <TextInput style={styles.input} value={item.end_time} onChangeText={(v) => setHour(item.dow, { end_time: v })} />
                    </View>
                    <View style={styles.inputWrap}>
                      <Text style={styles.label}>{t('consultantPanel.availability.slot', 'SLOT')}</Text>
                      <TextInput
                        style={styles.input}
                        value={String(item.slot_minutes)}
                        keyboardType="number-pad"
                        onChangeText={(v) => setHour(item.dow, { slot_minutes: Number(v || 0) })}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
            <Pressable style={styles.btn} onPress={saveHours} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.ink} /> : <Save size={16} color={colors.ink} />}
              <Text style={styles.btnText}>{t('consultantPanel.availability.save', 'Saatleri Kaydet')}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('consultantPanel.availability.dayTitle', 'Tek gün işlemleri')}</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>{t('consultantPanel.availability.date', 'TARİH')}</Text>
              <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.inputs}>
              <Pressable style={[styles.outlineBtn, styles.dangerBtn, { flex: 1 }]} onPress={() => overrideDay(0)} disabled={saving}>
                <CalendarOff size={15} color={colors.danger} />
                <Text style={[styles.outlineText, styles.dangerText]}>{t('consultantPanel.availability.closeDay', 'Günü Kapat')}</Text>
              </Pressable>
              <Pressable style={[styles.outlineBtn, { flex: 1 }]} onPress={() => overrideDay(1)} disabled={saving}>
                <Clock3 size={15} color={colors.gold} />
                <Text style={styles.outlineText}>{t('consultantPanel.availability.openDay', 'Günü Aç')}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('consultantPanel.availability.blocksTitle', 'Molalar')}</Text>
            <View style={styles.inputs}>
              <View style={styles.inputWrap}>
                <Text style={styles.label}>{t('consultantPanel.availability.start', 'BAŞLANGIÇ')}</Text>
                <TextInput style={styles.input} value={blockStart} onChangeText={setBlockStart} />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.label}>{t('consultantPanel.availability.end', 'BİTİŞ')}</Text>
                <TextInput style={styles.input} value={blockEnd} onChangeText={setBlockEnd} />
              </View>
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>{t('consultantPanel.availability.reason', 'NOT')}</Text>
              <TextInput style={styles.input} value={blockReason} onChangeText={setBlockReason} />
            </View>
            <Pressable style={styles.btn} onPress={createBlock} disabled={saving}>
              <Text style={styles.btnText}>{t('consultantPanel.availability.addBlock', 'Mola Ekle')}</Text>
            </Pressable>
            <FlatList
              data={blocks}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>{t('consultantPanel.availability.noBlocks', 'Bu tarih için mola/blok yok.')}</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.blockRow}>
                  <Text style={styles.blockTitle}>{item.start_time} - {item.end_time}</Text>
                  <Text style={styles.blockMeta}>{item.reason || t('consultantPanel.availability.blockFallback', 'Mola')}</Text>
                  <Pressable style={[styles.outlineBtn, styles.dangerBtn]} onPress={() => deleteBlock(item.id)} disabled={saving}>
                    <Trash2 size={14} color={colors.danger} />
                    <Text style={[styles.outlineText, styles.dangerText]}>{t('common.delete', 'Sil')}</Text>
                  </Pressable>
                </View>
              )}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
