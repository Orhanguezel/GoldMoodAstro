import { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, 
  Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius, shadows } from '@/theme/tokens';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert(
        t('auth.forgotTitle', 'Şifre Sıfırlama'),
        t('auth.forgotSuccess', 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.'),
        [{ text: 'Tamam', onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert(t('common.error'), 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.forgotTitle', 'Şifremi Unuttum')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.forgotSubtitle', 'E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.')}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <TextInput
                style={styles.input}
                placeholder="example@mail.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <Pressable 
              style={[styles.btn, (loading || !email) && styles.btnDisabled]}
              onPress={handleReset}
              disabled={loading || !email}
            >
              {loading ? (
                <ActivityIndicator color={colors.stardust} />
              ) : (
                <Text style={styles.btnText}>{t('auth.sendResetLink', 'Bağlantı Gönder')}</Text>
              )}
            </Pressable>

            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>{t('auth.backToLogin', 'Giriş Ekranına Dön')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.midnight },
  scroll: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  header: { marginBottom: spacing.xl },
  title: { fontSize: 28, fontFamily: font.display, color: colors.stardust, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, color: colors.stardustDim, fontFamily: font.sans, lineHeight: 20 },
  form: { gap: spacing.lg },
  inputGroup: { gap: spacing.sm },
  label: { fontSize: 14, color: colors.stardust, fontFamily: font.sansMedium },
  input: {
    backgroundColor: colors.surface,
    color: colors.stardust,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: font.sans,
    borderWidth: 1,
    borderColor: colors.line,
  },
  btn: {
    backgroundColor: colors.amethyst,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    ...shadows.soft,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: colors.stardust, fontFamily: font.sansBold, fontSize: 16 },
  backBtn: { alignItems: 'center', marginTop: spacing.sm },
  backText: { color: colors.muted, fontSize: 14, fontFamily: font.sans },
});
