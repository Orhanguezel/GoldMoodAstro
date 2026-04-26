import { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  TextInput, Pressable, KeyboardAvoidingView, 
  Platform, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '@/theme/tokens';
import { chatApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // threadId
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (id) {
      chatApi.listMessages(id)
        .then(res => setMessages(res.items))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSend = async () => {
    if (!inputText.trim() || !id) return;
    
    setSending(true);
    try {
      const res = await chatApi.postMessage(id, inputText.trim());
      // Local append for smoothness
      const newMessage = {
        id: res.id,
        message: inputText.trim(),
        sender_id: user?.id,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.amethyst} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
              <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.theirMessageRow]}>
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                  <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                    {item.message}
                  </Text>
                  <Text style={styles.timeText}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('chat.placeholder', 'Mesajınızı yazın...')}
            placeholderTextColor={colors.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <Pressable 
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={sending || !inputText.trim()}
          >
            {sending ? (
              <ActivityIndicator color={colors.stardust} size="small" />
            ) : (
              <Text style={styles.sendBtnText}>➤</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.midnight },
  center: { justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.md },
  messageRow: { marginBottom: spacing.sm, flexDirection: 'row' },
  myMessageRow: { justifyContent: 'flex-end' },
  theirMessageRow: { justifyContent: 'flex-start' },
  bubble: { 
    maxWidth: '80%', 
    padding: spacing.sm, 
    borderRadius: radius.md, 
    paddingHorizontal: 12 
  },
  myBubble: { 
    backgroundColor: colors.amethyst, 
    borderBottomRightRadius: 2 
  },
  theirBubble: { 
    backgroundColor: colors.surface, 
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.line
  },
  messageText: { fontSize: 15, fontFamily: font.sans, lineHeight: 20 },
  myMessageText: { color: colors.stardust },
  theirMessageText: { color: colors.stardustDim },
  timeText: { fontSize: 10, color: colors.muted, alignSelf: 'flex-end', marginTop: 4 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    padding: spacing.md, 
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.line,
    gap: spacing.sm
  },
  input: { 
    flex: 1, 
    backgroundColor: colors.deep, 
    borderRadius: radius.md, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    color: colors.stardust,
    fontFamily: font.sans,
    maxHeight: 100
  },
  sendBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: colors.amethyst, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: colors.stardust, fontSize: 20 },
});
