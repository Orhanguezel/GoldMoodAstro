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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  checkboxText: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  registerBtn: {
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
  registerBtnText: {
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
  loginLink: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.gold,
  },
  });
}

import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { safeRouterBack } from '@/lib/navigation';
import { User, Mail, Lock, ChevronLeft, CheckCircle2, Circle } from 'lucide-react-native';


import { authApi, setAuthToken } from '@/lib/api';
import { storage } from '@/lib/storage';

export default function RegisterScreen() {
  const theme = useAppTheme();
  const { colors } = theme;  const styles = useMemo(() => buildScreenStyles(theme), [theme]);
  const { t } = useTranslation();
  const { next } = useLocalSearchParams<{ next?: string }>();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert(t('common.error'), t('common.fillAllFields'));
      return;
    }

    if (!rulesAccepted) {
      Alert.alert(t('common.error'), t('auth.acceptTermsError'));
      return;
    }
    
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
      
      const dest = typeof next === 'string' && next.startsWith('/') ? next : '/onboarding';
      router.replace(dest as any);
    } catch (err: any) {
      Alert.alert(t('auth.registerFailed'), err.message || t('common.genericError'));
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
              <Text style={styles.welcomeKicker}>{t('auth.registerKicker')}</Text>
              <Text style={styles.title}>{t('auth.registerHeadline')}</Text>
            </View>

            <View style={styles.form}>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.fullNameLabel')}</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color={colors.goldDim} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.fullNamePlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

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
                <Text style={styles.label}>{t('auth.passwordLabel')}</Text>
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

              <Pressable 
                style={styles.checkboxRow}
                onPress={() => setRulesAccepted(!rulesAccepted)}
              >
                {rulesAccepted ? (
                  <CheckCircle2 size={20} color={colors.gold} />
                ) : (
                  <Circle size={20} color={colors.line} />
                )}
                <Text style={styles.checkboxText}>
                  {t('auth.acceptTermsLabel')}
                </Text>
              </Pressable>

              <Pressable 
                style={[styles.registerBtn, (loading || !rulesAccepted) && styles.btnDisabled]} 
                onPress={handleRegister}
                disabled={loading || !rulesAccepted}
              >
                {loading ? (
                  <ActivityIndicator color={colors.ink} />
                ) : (
                  <Text style={styles.registerBtnText}>{t('auth.registerTitle')}</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.hasAccount')}</Text>
              <Link href="/auth/login" asChild>
                <Pressable>
                  <Text style={styles.loginLink}>{t('auth.loginBtn')}</Text>
                </Pressable>
              </Link>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

