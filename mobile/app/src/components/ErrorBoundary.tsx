import React, { Component, type ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

type Props = { children: ReactNode; onReset?: () => void };
type State = { hasError: boolean };

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0D0B1E',
  },
  title: { fontSize: 20, color: '#F0E6FF', marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 14, color: '#7A6DA0', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#D4AF37',
  },
  btnText: { color: '#1A1630', fontWeight: '700' },
});

/** T42-7 — Beklenmeyen render hatalarında kullanıcı dostu ekran */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary:', error);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Bir şeyler ters gitti</Text>
          <Text style={styles.body}>
            Uygulama beklenmedik bir hatayla karşılaştı. Lütfen tekrar deneyin veya uygulamayı yeniden
            başlatın.
          </Text>
          <Pressable style={styles.btn} onPress={this.handleReset}>
            <Text style={styles.btnText}>Tekrar Dene</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
