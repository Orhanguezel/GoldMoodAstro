import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAppTheme, type AppTheme } from '@/theme';

type Props = {
  html: string;
  loading?: boolean;
};

function buildStyles(t: AppTheme) {
  return StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.colors.bg },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });
}

export function CmsHtmlView({ html, loading }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { colors, font } = theme;

  const source = useMemo(() => {
    const body = html || '<p>İçerik henüz hazırlanmadı.</p>';
    const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>
      body { margin:0; padding:16px; font-family: system-ui, sans-serif; font-size:16px; line-height:1.7;
        color:${colors.textDim}; background:${colors.bg}; }
      h1,h2,h3 { color:${colors.text}; font-family: Georgia, serif; }
      a { color:${colors.gold}; }
      img { max-width:100%; height:auto; border-radius:8px; }
    </style></head><body>${body}</body></html>`;
    return { html: doc };
  }, [html, colors]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <WebView
        originWhitelist={['*']}
        source={source}
        style={{ flex: 1, backgroundColor: colors.bg }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
