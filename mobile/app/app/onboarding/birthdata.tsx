import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Calendar, Clock } from 'lucide-react-native';
import { colors, spacing, font, radius } from '@/theme/tokens';
import { storage } from '@/lib/storage';
import { api } from '@/lib/api';

export default function BirthdataScreen() {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [city, setCity] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCalculate = async () => {
    if (!date || !time || !city) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Simulate API call to /api/v1/birth-charts
      // In a real app, we would use the api.post('/birth-charts')
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mark onboarded and go to today tab
      await storage.markOnboarded();
      router.replace('/(tabs)/today');
      
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft color={colors.textDim} size={24} />
            </Pressable>
            <Text style={styles.eyebrow}>DOĞUM HARİTASI</Text>
          </View>

          <Text style={styles.title}>
            Yıldızların konumunu{'\n'}hesaplayalım.
          </Text>
          <Text style={styles.subtitle}>
            Sıfırdan sizin için özel bir gökyüzü haritası oluşturmamız için doğum bilgilerinize ihtiyacımız var.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Form */}
          <View style={styles.form}>
            
            {/* Date Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Doğum Tarihi</Text>
              <View style={styles.inputContainer}>
                <Calendar color={colors.gold} size={20} />
                <TextInput
                  style={styles.input}
                  placeholder="GG / AA / YYYY"
                  placeholderTextColor={colors.textMuted}
                  value={date}
                  onChangeText={setDate}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Time Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Doğum Saati</Text>
              <View style={styles.inputContainer}>
                <Clock color={colors.gold} size={20} />
                <TextInput
                  style={styles.input}
                  placeholder="SS : DD (Örn: 14:30)"
                  placeholderTextColor={colors.textMuted}
                  value={time}
                  onChangeText={setTime}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <Text style={styles.hint}>Tam saati bilmiyorsanız yaklaşık bir saat girin.</Text>
            </View>

            {/* Location Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Doğum Yeri</Text>
              <View style={styles.inputContainer}>
                <MapPin color={colors.gold} size={20} />
                <TextInput
                  style={styles.input}
                  placeholder="Şehir adı yazın..."
                  placeholderTextColor={colors.textMuted}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>

          </View>

          {/* CTA */}
          <View style={styles.footer}>
            <Pressable 
              onPress={handleCalculate} 
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.buttonText}>Haritamı Hesapla</Text>
              )}
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.2xl,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  eyebrow: {
    fontFamily: font.display,
    fontSize: 12,
    color: colors.goldDeep,
    letterSpacing: 4,
    marginLeft: spacing.lg,
  },
  title: {
    fontFamily: font.serif,
    fontSize: 32,
    color: colors.text,
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: font.sans,
    fontSize: 16,
    color: colors.textDim,
    lineHeight: 24,
    marginBottom: spacing.2xl,
  },
  form: {
    gap: spacing.xl,
    marginBottom: spacing.3xl,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontFamily: font.display,
    fontSize: 11,
    color: colors.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 56,
    gap: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 16,
    color: colors.text,
    height: '100%',
  },
  hint: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  errorText: {
    color: colors.danger,
    fontFamily: font.sans,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  footer: {
    marginTop: 'auto',
  },
  button: {
    backgroundColor: colors.text,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: font.sansBold,
    fontSize: 16,
    color: colors.bg,
    letterSpacing: 1,
  },
});
