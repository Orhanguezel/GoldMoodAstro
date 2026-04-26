import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius, shadows } from '@/theme/tokens';
import { authApi, setAuthToken } from '@/lib/api';
import { storage } from '@/lib/storage';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });

      // Kaydet
      await storage.setUserSession({
        token: res.access_token,
        userId: res.user.id,
        role: res.user.role
      });

      // API istemcisini güncelle
      setAuthToken(res.access_token);
      
      // Yönlendir
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('auth.loginError', 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.'));
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
            <Text style={styles.title}>{t('auth.loginTitle')}</Text>
            <Text style={styles.subtitle}>Yıldızların rehberliğine kaldığınız yerden devam edin.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('auth.password')}</Text>
                <Link href="/auth/forgot" asChild>
                  <Pressable>
                    <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
                  </Pressable>
                </Link>
              </View>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Pressable 
              style={[styles.btn, loading && styles.btnDisabled]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.stardust} />
              ) : (
                <Text style={styles.btnText}>{t('auth.loginBtn')}</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
            <Link href="/auth/register" asChild>
              <Pressable>
                <Text style={styles.registerLink}>{t('auth.registerTitle')}</Text>
              </Pressable>
            </Link>
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
  title: { fontSize: 32, fontFamily: font.display, color: colors.stardust, marginBottom: spacing.xs },
  subtitle: { fontSize: 16, color: colors.stardustDim, fontFamily: font.sans, lineHeight: 22 },
  form: { gap: spacing.lg },
  inputGroup: { gap: spacing.sm },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, color: colors.stardust, fontFamily: font.sansMedium },
  forgotText: { fontSize: 12, color: colors.amethystLight, fontFamily: font.sans },
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
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: colors.stardust, fontFamily: font.sansBold, fontSize: 16 },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: spacing.xxl,
    gap: spacing.xs,
  },
  footerText: { color: colors.muted, fontSize: 14, fontFamily: font.sans },
  registerLink: { color: colors.gold, fontSize: 14, fontFamily: font.sansBold },
});
