import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
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
  },
  titleArea: {
    marginBottom: spacing['2xl'],
  },
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
  resetBtn: {
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
  btnDisabled: {
    opacity: 0.6,
  },
  resetBtnText: {
    fontFamily: font.sansBold,
    fontSize: 16,
    color: colors.ink,
  },
  });
}

import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { safeRouterBack } from '@/lib/navigation';
import { Mail, ChevronLeft, Send } from 'lucide-react-native';



export default function ForgotPasswordScreen() {
  const theme = useAppTheme();
  const { colors } = theme;  const styles = useMemo(() => buildScreenStyles(theme), [theme]);
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    try {
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert(
        t('auth.resetTitle'),
        t('auth.resetSentBody'),
        [{ text: t('common.ok'), onPress: () => safeRouterBack() }]
      );
    } catch (err) {
      Alert.alert(t('common.error'), t('common.genericError'));
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
            
            <View style={styles.titleArea}>
              <Text style={styles.kicker}>{t('auth.forgotKicker')}</Text>
              <Text style={styles.title}>{t('auth.forgotHeadline')}</Text>
              <Text style={styles.subtitle}>
                {t('auth.forgotSubtitle')}
              </Text>
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

              <Pressable 
                style={[styles.resetBtn, (loading || !email) && styles.btnDisabled]}
                onPress={handleReset}
                disabled={loading || !email}
              >
                {loading ? (
                  <ActivityIndicator color={colors.ink} />
                ) : (
                  <>
                    <Text style={styles.resetBtnText}>{t('auth.resetSendBtn')}</Text>
                    <Send size={18} color={colors.ink} />
                  </>
                )}
              </Pressable>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

