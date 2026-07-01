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
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Send } from 'lucide-react-native';
import { useAppTheme, type AppTheme } from '@/theme';
import { safeRouterBack } from '@/lib/navigation';
import { contactApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

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
    message: { minHeight: 120, textAlignVertical: 'top' },
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
    submitText: { fontFamily: font.sansBold, fontSize: 14, color: colors.ink },
  });
}

export default function ContactScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { colors } = theme;
  const { t } = useTranslation();
  const { user } = useAuth();

  const [name, setName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || phone.trim().length < 5 || !subject.trim() || message.trim().length < 10) {
      Alert.alert(t('common.missingInfo'), t('contact.errorFields'));
      return;
    }
    setLoading(true);
    try {
      await contactApi.submit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      Alert.alert(t('contact.successTitle'), t('contact.successBody'), [
        { text: t('common.ok'), onPress: () => safeRouterBack() },
      ]);
    } catch (err: unknown) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('contact.submitError'));
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
          <Text style={styles.title}>{t('contact.title')}</Text>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>{t('contact.nameLabel')}</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textMuted} />
            <Text style={styles.label}>{t('contact.emailLabel')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.label}>{t('contact.phoneLabel')}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+90..."
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.label}>{t('contact.subjectLabel')}</Text>
            <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholderTextColor={colors.textMuted} />
            <Text style={styles.label}>{t('contact.messageLabel')}</Text>
            <TextInput
              style={[styles.input, styles.message]}
              value={message}
              onChangeText={setMessage}
              multiline
              placeholderTextColor={colors.textMuted}
            />
            <Pressable style={styles.submit} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <>
                  <Send size={18} color={colors.ink} />
                  <Text style={styles.submitText}>{t('contact.submit')}</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
