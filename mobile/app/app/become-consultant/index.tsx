import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Send, Sparkles } from 'lucide-react-native';
import { useAppTheme, type AppTheme } from '@/theme';
import { safeRouterBack } from '@/lib/navigation';
import { consultantApplicationsApi } from '@/lib/api';
import { CONSULTANT_EXPERTISE_OPTIONS } from '@/lib/cms';

function buildStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.line,
    },
    title: { flex: 1, fontFamily: font.display, fontSize: 20, color: colors.text },
    scroll: { padding: spacing.lg, paddingBottom: 40 },
    hint: {
      fontFamily: font.sans,
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    label: {
      fontFamily: font.sansBold,
      fontSize: 11,
      color: colors.goldDeep,
      letterSpacing: 1,
      marginBottom: 8,
      marginTop: 12,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: font.sans,
      fontSize: 15,
      color: colors.text,
    },
    bio: { minHeight: 120, textAlignVertical: 'top' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
    },
    chipActive: { borderColor: colors.gold, backgroundColor: colors.inkDeep },
    chipText: { fontFamily: font.sansMedium, fontSize: 12, color: colors.textDim },
    chipTextActive: { color: colors.gold },
    submit: {
      marginTop: spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.gold,
      paddingVertical: 16,
      borderRadius: radius.pill,
    },
    submitDisabled: { opacity: 0.6 },
    submitText: { fontFamily: font.sansBold, fontSize: 14, color: colors.ink },
  });
}

const LANG_OPTIONS = [
  { id: 'tr', label: 'Türkçe' },
  { id: 'en', label: 'İngilizce' },
] as const;

export default function BecomeConsultantScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { colors } = theme;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['tr']);
  const [loading, setLoading] = useState(false);

  const toggle = (list: string[], id: string, setter: (v: string[]) => void) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || bio.trim().length < 50) {
      Alert.alert('Eksik bilgi', 'Ad, e-posta ve en az 50 karakter biyografi gerekli.');
      return;
    }
    if (expertise.length === 0 || languages.length === 0) {
      Alert.alert('Eksik bilgi', 'En az bir uzmanlık ve dil seçin.');
      return;
    }
    setLoading(true);
    try {
      await consultantApplicationsApi.apply({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim(),
        expertise,
        languages,
        experience_years: 1,
      });
      Alert.alert(
        'Başvuru alındı',
        'Profil fotoğrafınızı onay sonrası danışman panelinden ekleyebilirsiniz. Ekibimiz başvurunuzu inceleyecek.',
        [{ text: 'Tamam', onPress: () => router.replace('/(tabs)/profile' as any) }],
      );
    } catch (err: unknown) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Başvuru gönderilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => safeRouterBack()}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Danışman Ol</Text>
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.hint}>
              Kendinizi, yaklaşımınızı ve danışana ne sunduğunuzu anlatın (en az 150 karakter önerilir).
              İletişim bilgisi veya dış link yazmayın. Profil fotoğrafını onay sonrası panelden
              yükleyeceksiniz.
            </Text>

            <Text style={styles.label}>AD SOYAD</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Adınız" placeholderTextColor={colors.textMuted} />

            <Text style={styles.label}>E-POSTA</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="ornek@email.com" placeholderTextColor={colors.textMuted} />

            <Text style={styles.label}>TELEFON (OPSİYONEL)</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+90..." placeholderTextColor={colors.textMuted} />

            <Text style={styles.label}>HAKKIMDA</Text>
            <TextInput style={[styles.input, styles.bio]} value={bio} onChangeText={setBio} multiline placeholder="Danışmanlık yaklaşımınız..." placeholderTextColor={colors.textMuted} />

            <Text style={styles.label}>UZMANLIK</Text>
            <View style={styles.chips}>
              {CONSULTANT_EXPERTISE_OPTIONS.map((opt) => {
                const active = expertise.includes(opt.id);
                return (
                  <Pressable
                    key={opt.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggle(expertise, opt.id, setExpertise)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>DİLLER</Text>
            <View style={styles.chips}>
              {LANG_OPTIONS.map((opt) => {
                const active = languages.includes(opt.id);
                return (
                  <Pressable
                    key={opt.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggle(languages, opt.id, setLanguages)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={[styles.submit, loading && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <>
                  <Sparkles size={18} color={colors.ink} />
                  <Text style={styles.submitText}>Başvuruyu Gönder</Text>
                  <Send size={16} color={colors.ink} />
                </>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
