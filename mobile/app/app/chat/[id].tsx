import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  Pressable, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Send, Phone, Info } from 'lucide-react-native';

import { colors, spacing, font, radius } from '@/theme/tokens';
import { chatApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // threadId
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (id) loadMessages();
  }, [id]);

  const loadMessages = async () => {
    try {
      const res = await chatApi.listMessages(id!);
      setMessages(res.items);
    } catch (err) {
      console.error('Chat load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !id) return;
    setSending(true);
    const text = inputText.trim();
    setInputText('');
    try {
      const res = await chatApi.postMessage(id, text);
      const newMessage = {
        id: res.id,
        message: text,
        sender_id: user?.id,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMessage]);
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Danışman Sohbet</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Aktif Seans</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn}><Phone size={20} color={colors.gold} /></Pressable>
          </View>
        </View>

        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            renderItem={({ item }) => {
              const isMe = item.sender_id === user?.id;
              return (
                <View style={[styles.msgRow, isMe ? styles.myRow : styles.theirRow]}>
                  <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.msgText, isMe ? styles.myText : styles.theirText]}>{item.message}</Text>
                    <Text style={[styles.timeText, isMe ? styles.myTime : styles.theirTime]}>
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          <View style={styles.inputArea}>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="Mesajınızı yazın..."
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <Pressable 
                style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]} 
                onPress={handleSend}
                disabled={!inputText.trim() || sending}
              >
                {sending ? <ActivityIndicator color={colors.bgDeep} size="small" /> : <Send size={18} color={colors.bgDeep} />}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.bgDeep,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: font.display, fontSize: 16, color: colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  statusText: { fontFamily: font.sans, fontSize: 10, color: colors.textMuted },
  headerRight: { width: 40, alignItems: 'center' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  list: { padding: spacing.lg },
  msgRow: { flexDirection: 'row', marginBottom: 16 },
  myRow: { justifyContent: 'flex-end' },
  theirRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '85%', padding: 14, borderRadius: radius.lg },
  myBubble: { backgroundColor: colors.gold, borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.line },
  msgText: { fontFamily: font.sans, fontSize: 15, lineHeight: 22 },
  myText: { color: colors.bgDeep },
  theirText: { color: colors.text },
  timeText: { fontFamily: font.mono, fontSize: 9, marginTop: 6, alignSelf: 'flex-end' },
  myTime: { color: 'rgba(0,0,0,0.4)' },
  theirTime: { color: colors.textMuted },
  inputArea: { padding: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 30 : 16, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bgDeep },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, paddingLeft: 20, paddingRight: 6, paddingVertical: 6, borderWidth: 1, borderColor: colors.line },
  input: { flex: 1, fontFamily: font.sans, fontSize: 14, color: colors.text, maxHeight: 100, paddingVertical: 8 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
});
