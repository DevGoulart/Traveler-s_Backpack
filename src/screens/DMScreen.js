import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../components/Avatar';
import { useSocial } from '../context/SocialContext';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

function formatPreview(message) {
  if (!message) return 'Inicie uma conversa';
  if (message.messageType === 'post_share') return '📸 Post compartilhado';
  return message.text;
}

export default function DMScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { conversations, loadConversations, allUsers, getAvatarUri, startConversation } = useSocial();
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    loadConversations().finally(() => setLoading(false));
  }, [loadConversations]);

  const openChat = (conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      otherUser: conversation.otherUser,
    });
  };

  const handleStartChat = async (user) => {
    setShowNewChat(false);
    const conversationId = await startConversation(user.id);
    navigation.navigate('Chat', {
      conversationId,
      otherUser: user,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Mensagens</Text>
        <Pressable onPress={() => setShowNewChat(!showNewChat)} hitSlop={12}>
          <Ionicons name="create-outline" size={26} color={colors.text} />
        </Pressable>
      </View>

      {showNewChat && (
        <View style={styles.newChatPanel}>
          <Text style={styles.newChatTitle}>Nova conversa</Text>
          {allUsers.length === 0 ? (
            <Text style={styles.emptyText}>Cadastre outra conta para conversar.</Text>
          ) : (
            allUsers.map((user) => (
              <Pressable key={user.id} style={styles.newChatRow} onPress={() => handleStartChat(user)}>
                <Avatar
                  name={user.displayName}
                  uri={getAvatarUri(user.displayName, user.id)}
                  size={40}
                />
                <Text style={styles.newChatName}>{user.displayName}</Text>
              </Pressable>
            ))
          )}
        </View>
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={conversations.length === 0 && styles.emptyList}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Nenhuma mensagem</Text>
              <Text style={styles.emptyText}>
                Toque no ícone acima para iniciar uma conversa ou compartilhe um post por DM.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.conversationRow} onPress={() => openChat(item)}>
              <Avatar
                name={item.otherUser.displayName}
                uri={getAvatarUri(item.otherUser.displayName, item.otherUser.id)}
                size={52}
              />
              <View style={styles.conversationBody}>
                <Text style={styles.conversationName}>{item.otherUser.displayName}</Text>
                <Text style={styles.conversationPreview} numberOfLines={1}>
                  {formatPreview(item.lastMessage)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  newChatPanel: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  newChatTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  newChatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  newChatName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl * 2,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  conversationBody: {
    flex: 1,
  },
  conversationName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  conversationPreview: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
