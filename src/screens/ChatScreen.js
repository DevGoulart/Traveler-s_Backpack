import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../components/Avatar';
import { useSocial } from '../context/SocialContext';
import { useTheme } from '../context/ThemeContext';
import spacing from '../theme/spacing';

function MessageBubble({ message, isOwn, avatarUri, senderName, colors, styles }) {
  if (message.messageType === 'post_share') {
    return (
      <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
        {!isOwn && <Avatar name={senderName} uri={avatarUri} size={28} />}
        <View style={[styles.postShareBubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          <Text style={[styles.shareLabel, isOwn && styles.textOwn]}>
            {isOwn ? 'Você compartilhou um post' : 'Post compartilhado'}
          </Text>
          {message.postImageUri ? (
            <Image source={{ uri: message.postImageUri }} style={styles.shareImage} />
          ) : null}
          <Text style={[styles.shareUser, isOwn && styles.textOwn]}>
            @{message.postUsername}
          </Text>
          {message.postDescription ? (
            <Text style={[styles.shareDesc, isOwn && styles.textOwn]} numberOfLines={3}>
              {message.postDescription}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
      {!isOwn && <Avatar name={senderName} uri={avatarUri} size={28} />}
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isOwn && styles.textOwn]}>{message.text}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen({ route, navigation }) {
  const { conversationId, otherUser } = route.params;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { currentUserId, getAvatarUri, loadChatMessages, sendMessage } = useSocial();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const listRef = useRef(null);

  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerHeight = insets.top + 56;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event) => setKeyboardHeight(event.endCoordinates.height);
    const onHide = () => setKeyboardHeight(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const refreshMessages = useCallback(async () => {
    const items = await loadChatMessages(conversationId);
    setMessages(items);
  }, [conversationId, loadChatMessages]);

  useEffect(() => {
    refreshMessages();
  }, [refreshMessages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(conversationId, text.trim());
      setText('');
      await refreshMessages();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setSending(false);
    }
  };

  const inputPaddingBottom = keyboardHeight > 0
    ? spacing.sm
    : insets.bottom + spacing.sm;

  const listPaddingBottom = keyboardHeight > 0
    ? keyboardHeight - insets.bottom + spacing.sm
    : spacing.sm;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
              <Ionicons name="arrow-back" size={26} color={colors.text} />
            </Pressable>
            <Avatar
              name={otherUser.displayName}
              uri={getAvatarUri(otherUser.displayName, otherUser.id)}
              size={36}
            />
            <Text style={styles.headerName}>{otherUser.displayName}</Text>
            <View style={{ width: 26 }} />
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.messagesList, { paddingBottom: listPaddingBottom }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isOwn={item.senderId === currentUserId}
                senderName={otherUser.displayName}
                avatarUri={getAvatarUri(otherUser.displayName, otherUser.id)}
                colors={colors}
                styles={styles}
              />
            )}
          />

          <View style={[styles.inputBar, { paddingBottom: inputPaddingBottom }]}>
            <TextInput
              style={styles.input}
              placeholder="Mensagem..."
              placeholderTextColor={colors.textMuted}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
              onFocus={() => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)}
            />
            <Pressable
              style={[styles.sendButton, !text.trim() && styles.sendDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerName: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    messagesList: {
      padding: spacing.lg,
      gap: spacing.sm,
    },
    bubbleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    bubbleRowOwn: {
      justifyContent: 'flex-end',
    },
    bubble: {
      maxWidth: '75%',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: 18,
    },
    bubbleOwn: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    bubbleOther: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomLeftRadius: 4,
    },
    bubbleText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 20,
    },
    textOwn: {
      color: '#fff',
    },
    postShareBubble: {
      maxWidth: '78%',
      borderRadius: 16,
      overflow: 'hidden',
      padding: spacing.sm,
    },
    shareLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    shareImage: {
      width: 200,
      height: 200,
      borderRadius: 10,
      backgroundColor: colors.borderLight,
      marginBottom: spacing.xs,
    },
    shareUser: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    shareDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    input: {
      flex: 1,
      maxHeight: 100,
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendDisabled: {
      opacity: 0.4,
    },
  });
}
