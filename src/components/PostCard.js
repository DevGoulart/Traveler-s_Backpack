import { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { useTheme } from '../context/ThemeContext';
import spacing from '../theme/spacing';

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'agora';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function PostCard({ post, onLike, onComment, onShare, onSave, getAvatarUri }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [saved, setSaved] = useState(post.saved ?? false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    setLiked(post.liked);
    setLikes(post.likes);
    setSaved(post.saved ?? false);
  }, [post.liked, post.likes, post.saved]);

  useEffect(() => {
    if (!showComments) return undefined;

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
  }, [showComments]);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
    onLike(post.id);
  };

  const handleSave = () => {
    setSaved(!saved);
    onSave?.(post.id);
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    onComment(post.id, commentText);
    setCommentText('');
  };

  const imageSource = post.imageUri
    ? { uri: post.imageUri }
    : post.uri
      ? { uri: post.uri }
      : null;

  const authorAvatarUri = getAvatarUri(post.username, post.userId);
  const keyboardOffset = Platform.OS === 'android'
    ? keyboardHeight
    : Math.max(0, keyboardHeight - insets.bottom);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar name={post.username} uri={authorAvatarUri} size={36} />
        <View style={styles.headerText}>
          <Text style={styles.username}>{post.username}</Text>
          {post.location ? (
            <Text style={styles.location}>{post.location}</Text>
          ) : null}
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
      </View>

      {imageSource ? (
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={48} color={colors.textMuted} />
        </View>
      )}

      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <Pressable onPress={handleLike} hitSlop={8}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={26}
              color={liked ? colors.danger : colors.text}
            />
          </Pressable>
          <Pressable onPress={() => setShowComments(true)} hitSlop={8} style={styles.actionIcon}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => onShare?.(post)} hitSlop={8} style={styles.actionIcon}>
            <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
          </Pressable>
        </View>
        <Pressable onPress={handleSave} hitSlop={8}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={saved ? colors.text : colors.text}
          />
        </Pressable>
      </View>

      <Text style={styles.likes}>{likes} curtidas</Text>

      <View style={styles.caption}>
        <Text style={styles.captionText}>
          <Text style={styles.captionUser}>{post.username} </Text>
          {post.description}
        </Text>
      </View>

      {post.comments.length > 0 && (
        <Pressable onPress={() => setShowComments(true)}>
          <Text style={styles.viewComments}>
            Ver todos os {post.comments.length} comentário{post.comments.length > 1 ? 's' : ''}
          </Text>
        </Pressable>
      )}

      <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>

      <Modal visible={showComments} animationType="slide" transparent>
        <View style={styles.modalFlex}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowComments(false)}>
            <Pressable
              style={[styles.modalContent, { marginBottom: keyboardOffset }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Comentários</Text>
                <Pressable onPress={() => setShowComments(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              <FlatList
                data={post.comments}
                keyExtractor={(item) => item.id}
                style={styles.commentsList}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={styles.emptyComments}>Nenhum comentário ainda. Seja o primeiro!</Text>
                }
                renderItem={({ item }) => (
                  <View style={styles.commentRow}>
                    <Avatar
                      name={item.username}
                      uri={getAvatarUri(item.username)}
                      size={32}
                    />
                    <View style={styles.commentBody}>
                      <Text style={styles.commentText}>
                        <Text style={styles.captionUser}>{item.username} </Text>
                        {item.text}
                      </Text>
                    </View>
                  </View>
                )}
              />

              <View style={[styles.commentInputRow, { paddingBottom: insets.bottom + spacing.sm }]}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Adicionar comentário..."
                  placeholderTextColor={colors.textSecondary}
                  value={commentText}
                  onChangeText={setCommentText}
                  onSubmitEditing={handleComment}
                  returnKeyType="send"
                />
                <Pressable onPress={handleComment}>
                  <Text style={[styles.postButton, !commentText.trim() && styles.postButtonDisabled]}>
                    Publicar
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      marginBottom: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.sm,
    },
    headerText: {
      flex: 1,
    },
    username: {
      fontWeight: '700',
      fontSize: 14,
      color: colors.text,
    },
    location: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    image: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: colors.borderLight,
    },
    imagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
    actionsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionIcon: {
      marginHorizontal: spacing.md,
    },
    likes: {
      fontWeight: '700',
      fontSize: 14,
      color: colors.text,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
    caption: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
    },
    captionText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    captionUser: {
      fontWeight: '700',
    },
    viewComments: {
      color: colors.textSecondary,
      fontSize: 14,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
    },
    time: {
      color: colors.textSecondary,
      fontSize: 11,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.md,
      textTransform: 'uppercase',
    },
    modalFlex: {
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    commentsList: {
      maxHeight: 300,
      padding: spacing.lg,
    },
    emptyComments: {
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.xl,
    },
    commentRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    commentBody: {
      flex: 1,
    },
    commentText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    commentInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: spacing.md,
    },
    commentInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      paddingVertical: spacing.sm,
    },
    postButton: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 14,
    },
    postButtonDisabled: {
      opacity: 0.4,
    },
  });
}
