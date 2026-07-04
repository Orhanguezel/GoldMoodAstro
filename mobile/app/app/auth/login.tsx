import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useAppTheme, type AppTheme } from '@/theme';

function buildScreenStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  welcomeArea: {
    marginBottom: spacing['2xl'],
  },
  welcomeKicker: {
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
  },
  form: {
    gap: spacing.xl,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 2,
  },
  forgotText: {
    fontFamily: font.sansMedium,
    fontSize: 11,
    color: colors.goldDim,
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
  loginBtn: {
    backgroundColor: colors.gold,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    fontFamily: font.sansBold,
    fontSize: 16,
    color: colors.ink,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing['3xl'],
    gap: 8,
  },
  footerText: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textMuted,
  },
  registerLink: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.gold,
  },
  dividerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: spacing.sm,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  dividerText: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  appleBtn: {
    height: 56,
    width: '100%',
  },
  });
}

import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { safeRouterBack } from '@/lib/navigation';
import { Mail, Lock, ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';


import { authApi, setAuthToken } from '@/lib/api';
import { storage } from '@/lib/storage';

export default function LoginScreen() {
  const theme = useAppTheme();
  const { colors, radius } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);
  const { t } = useTranslation();
  const { next } = useLocalSearchParams<{ next?: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);

  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAuthAvailable);
    }
  }, []);

  const resolvePostLoginRoute = async (role: string): Promise<string> => {
    if (typeof next === 'string' && next.startsWith('/')) return next;
    if (role === 'consultant') return '/consultant';
    const onboarded = await storage.isOnboarded();
    return onboarded ? '/(tabs)/today' : '/onboarding/birthdata';
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('common.fillAllFields'));
      return;
    }
    
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });

      await storage.setUserSession({
        token: res.access_token,
        refreshToken: res.refresh_token,
        userId: res.user.id,
        role: res.user.role
      });

      setAuthToken(res.access_token);
      router.replace((await resolvePostLoginRoute(res.user.role)) as any);
    } catch (err: any) {
      Alert.alert(t('auth.loginFailed'), err.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const fullName = credential.fullName
        ? `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim()
        : undefined;

      const res = await authApi.socialLogin({
        type: 'apple',
        identity_token: credential.identityToken ?? '',
        authorization_code: credential.authorizationCode ?? '',
        apple_user_name: fullName,
        email: credential.email ?? '',
      });

      await storage.setUserSession({
        token: res.access_token,
        refreshToken: res.refresh_token,
        userId: res.user.id,
        role: res.user.role
      });

      setAuthToken(res.access_token);
      router.replace((await resolvePostLoginRoute(res.user.role)) as any);
    } catch (err: any) {
      if (err.code === 'ERR_CANCELED') return;
      Alert.alert(t('common.error'), t('auth.appleLoginFailed'));
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

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll}>
            
            <View style={styles.welcomeArea}>
              <Text style={styles.welcomeKicker}>{t('auth.loginKicker')}</Text>
              <Text style={styles.title}>{t('auth.loginHeadline')}</Text>
            </View>

            <View style={styles.form}>
              
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
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{t('auth.passwordLabel')}</Text>
                  <Link href="/auth/forgot" asChild>
                    <Pressable>
                      <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
                    </Pressable>
                  </Link>
                </View>
                <View style={styles.inputContainer}>
                  <Lock size={20} color={colors.goldDim} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} color={colors.textMuted} /> : <Eye size={20} color={colors.textMuted} />}
                  </Pressable>
                </View>
              </View>

              <Pressable 
                style={[styles.loginBtn, loading && styles.btnDisabled]} 
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.ink} />
                ) : (
                  <Text style={styles.loginBtnText}>{t('auth.loginBtn')}</Text>
                )}
              </Pressable>

              {appleAuthAvailable && (
                <View style={styles.dividerArea}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>{t('auth.or')}</Text>
                  <View style={styles.divider} />
                </View>
              )}

              {appleAuthAvailable && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={radius.pill}
                  style={styles.appleBtn}
                  onPress={handleAppleLogin}
                />
              )}
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
              <Link
                href={
                  next
                    ? ({ pathname: '/auth/register', params: { next: String(next) } } as const)
                    : '/auth/register'
                }
                asChild
              >
                <Pressable>
                  <Text style={styles.registerLink}>{t('auth.registerNow')}</Text>
                </Pressable>
              </Link>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
