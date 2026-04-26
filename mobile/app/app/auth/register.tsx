import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius, shadows } from '@/theme/tokens';
import { authApi, setAuthToken } from '@/lib/api';
import { storage } from '@/lib/storage';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) return;
    
    setLoading(true);
    try {
      const res = await authApi.register({
        full_name: fullName,
        email,
        password,
        rules_accepted: true,
      });
      
      await storage.setUserSession({
        token: res.access_token,
        userId: res.user.id,
        role: res.user.role
      });

      setAuthToken(res.access_token);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('auth.registerError', 'Kayıt başarısız. Lütfen tekrar deneyin.'));
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
            <Text style={styles.title}>{t('auth.registerTitle')}</Text>
            <Text style={styles.subtitle}>Ruhsal yolculuğunuza bugün başlayın.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.fullName')}</Text>
              <TextInput
                style={styles.input}
                placeholder="Adınız Soyadınız"
                placeholderTextColor={colors.muted}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

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
              <Text style={styles.label}>{t('auth.password')}</Text>
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
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.stardust} />
              ) : (
                <Text style={styles.btnText}>{t('auth.registerBtn')}</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.hasAccount')}</Text>
            <Link href="/auth/login" asChild>
              <Pressable>
                <Text style={styles.loginLink}>{t('auth.loginTitle')}</Text>
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
  loginLink: { color: colors.gold, fontSize: 14, fontFamily: font.sansBold },
});
