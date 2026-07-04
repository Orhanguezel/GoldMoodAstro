import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, KeyRound, Lock, Mail } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme, type AppTheme } from '@/theme';
import { authApi } from '@/lib/api';
import { safeRouterBack } from '@/lib/navigation';

function buildScreenStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    safe: { flex: 1 },
    header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
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
    scroll: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing['2xl'],
    },
    titleArea: { marginBottom: spacing['2xl'] },
    kicker: {
      fontFamily: font.sansBold,
      fontSize: 12,
      color: colors.goldDeep,
      letterSpacing: 3,
      marginBottom: 8,
    },
    title: {
      fontFamily: font.display,
      fontSize: 32,
      color: colors.text,
      lineHeight: 40,
      marginBottom: 12,
    },
    subtitle: {
      fontFamily: font.sans,
      fontSize: 15,
      color: colors.textDim,
      lineHeight: 22,
    },
    form: { gap: spacing.xl },
    inputGroup: { gap: 8 },
    label: {
      fontFamily: font.sansBold,
      fontSize: 10,
      color: colors.gold,
      letterSpacing: 2,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      height: 56,
      borderWidth: 1,
      borderColor: colors.line,
      gap: 12,
    },
    input: {
      flex: 1,
      fontFamily: font.sans,
      fontSize: 16,
      color: colors.text,
    },
    submitBtn: {
      backgroundColor: colors.gold,
      height: 56,
      borderRadius: radius.pill,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginTop: spacing.md,
      shadowColor: colors.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    btnDisabled: { opacity: 0.6 },
    submitBtnText: {
      fontFamily: font.sansBold,
      fontSize: 16,
      color: colors.ink,
    },
  });
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ResetPasswordScreen() {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string; token?: string; code?: string }>();

  const [email, setEmail] = useState(firstParam(params.email) ?? '');
  const [code, setCode] = useState(firstParam(params.code) ?? '');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const token = firstParam(params.token);

  const canSubmit = password.length >= 6 && password === passwordConfirm && Boolean(token || (email.trim() && code.trim().length === 6));

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert(t('common.error'), t('auth.resetValidationError'));
      return;
    }
    setLoading(true);
    try {
      await authApi.confirmPasswordReset({
        token,
        email: token ? undefined : email.trim().toLowerCase(),
        code: token ? undefined : code.trim(),
        password,
      });
      Alert.alert(t('auth.resetSuccessTitle'), t('auth.resetSuccessBody'), [
        { text: t('auth.login'), onPress: () => router.replace('/auth/login') },
      ]);
    } catch {
      Alert.alert(t('common.error'), t('auth.resetFailedBody'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => safeRouterBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.titleArea}>
              <Text style={styles.kicker}>{t('auth.resetKicker')}</Text>
              <Text style={styles.title}>{t('auth.resetHeadline')}</Text>
              <Text style={styles.subtitle}>{token ? t('auth.resetTokenSubtitle') : t('auth.resetCodeSubtitle')}</Text>
            </View>

            <View style={styles.form}>
              {!token && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('auth.emailLabel')}</Text>
                    <View style={styles.inputContainer}>
                      <Mail size={20} color={colors.goldDim} />
                      <TextInput
                        style={styles.input}
                        placeholder="email@ornek.com"
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('auth.resetCodeLabel')}</Text>
                    <View style={styles.inputContainer}>
                      <KeyRound size={20} color={colors.goldDim} />
                      <TextInput
                        style={styles.input}
                        placeholder="123456"
                        placeholderTextColor={colors.textMuted}
                        value={code}
                        onChangeText={setCode}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.newPasswordLabel')}</Text>
                <View style={styles.inputContainer}>
                  <Lock size={20} color={colors.goldDim} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.confirmPasswordLabel')}</Text>
                <View style={styles.inputContainer}>
                  <Lock size={20} color={colors.goldDim} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    value={passwordConfirm}
                    onChangeText={setPasswordConfirm}
                    secureTextEntry
                  />
                </View>
              </View>

              <Pressable
                style={[styles.submitBtn, (loading || !canSubmit) && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={loading || !canSubmit}
              >
                {loading ? (
                  <ActivityIndicator color={colors.ink} />
                ) : (
                  <Text style={styles.submitBtnText}>{t('auth.resetPasswordBtn')}</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
