import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  FlatList,
  Pressable,
  Share,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import { useSocial } from '../context/SocialContext';
import { useTheme } from '../context/ThemeContext';
import { useAppInsets } from '../hooks/useAppInsets';
import spacing from '../theme/spacing';

export default function PerfilScreen({ navigation }) {
  const { top, bottomPadding } = useAppInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    currentUser,
    userBio,
    profilePhotoUri,
    userPosts,
    savedPosts,
    posts,
    getAvatarUri,
    currentUserId,
    toggleLike,
    toggleSave,
    addComment,
  } = useSocial();
  const [activeTab, setActiveTab] = useState('posts');
  const [selectedPostId, setSelectedPostId] = useState(null);

  const username = currentUser || 'Viajante';
  const bio = userBio || 'Explorador 🌍 | Compartilhando aventuras pelo mundo';
  const postCount = userPosts.length;
  const followers = 128;
  const following = 96;

  const gridData = activeTab === 'posts' ? userPosts : savedPosts;
  const selectedPost = selectedPostId
    ? posts.find((p) => p.id === selectedPostId) || gridData.find((p) => p.id === selectedPostId)
    : null;

  const renderGridItem = ({ item }) => {
    const uri = item.imageUri || item.uri;
    return (
      <Pressable style={styles.gridItem} onPress={() => setSelectedPostId(item.id)}>
        {uri ? (
          <Image source={{ uri }} style={styles.gridImage} />
        ) : (
          <View style={[styles.gridImage, styles.gridPlaceholder]}>
            <Ionicons name="image-outline" size={24} color={colors.textMuted} />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.topBar, { paddingTop: top + spacing.sm }]}>
        <Pressable
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={26} color={colors.text} />
          <Text style={styles.settingsLabel}>Configurações</Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Avatar name={username} uri={getAvatarUri(username, currentUserId) || profilePhotoUri} size={86} showRing />
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{postCount}</Text>
              <Text style={styles.statLabel}>posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followers}</Text>
              <Text style={styles.statLabel}>seguidores</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{following}</Text>
              <Text style={styles.statLabel}>seguindo</Text>
            </View>
          </View>
        </View>

        <Text style={styles.displayName}>{username}</Text>
        <Text style={styles.bio}>{bio}</Text>

        <View style={styles.actionRow}>
          <Pressable
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>Editar perfil</Text>
          </Pressable>
          <Pressable
            style={styles.shareButton}
            onPress={async () => {
              try {
                await Share.share({
                  message: `Confira o perfil de ${username} no Traveler's Backpack! 🌍`,
                });
              } catch {
                Alert.alert('Erro', 'Não foi possível compartilhar o perfil.');
              }
            }}
          >
            <Ionicons name="share-outline" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons
            name="grid"
            size={22}
            color={activeTab === 'posts' ? colors.text : colors.textSecondary}
          />
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Ionicons
            name={activeTab === 'saved' ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={activeTab === 'saved' ? colors.text : colors.textSecondary}
          />
        </Pressable>
      </View>

      {gridData.length > 0 ? (
        <FlatList
          data={gridData}
          keyExtractor={(item) => item.id}
          numColumns={3}
          scrollEnabled={false}
          renderItem={renderGridItem}
        />
      ) : (
        <View style={styles.emptyGrid}>
          <Ionicons
            name={activeTab === 'saved' ? 'bookmark-outline' : 'camera-outline'}
            size={48}
            color={colors.textMuted}
          />
          <Text style={styles.emptyTitle}>
            {activeTab === 'saved' ? 'Nenhum post salvo' : 'Nenhum post ainda'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'saved'
              ? 'Toque no ícone de salvar nos posts para vê-los aqui.'
              : 'Use a câmera para capturar e compartilhar suas aventuras!'}
          </Text>
        </View>
      )}

    </ScrollView>

    <Modal
      visible={!!selectedPost}
      animationType="slide"
      onRequestClose={() => setSelectedPostId(null)}
    >
      <View style={[styles.postModal, { paddingTop: top, backgroundColor: colors.background }]}>
        <View style={styles.postModalHeader}>
          <Pressable onPress={() => setSelectedPostId(null)} hitSlop={12}>
            <Ionicons name="arrow-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={styles.postModalTitle}>Publicação</Text>
          <View style={{ width: 26 }} />
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
        >
          {selectedPost ? (
            <PostCard
              post={selectedPost}
              onLike={toggleLike}
              onSave={toggleSave}
              onComment={addComment}
              getAvatarUri={getAvatarUri}
            />
          ) : null}
        </ScrollView>
      </View>
    </Modal>
    </>
  );
}

const GRID_SIZE = '33.33%';

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      backgroundColor: colors.surface,
    },
    settingsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    settingsLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      backgroundColor: colors.surface,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xl,
    },
    stats: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    statLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    displayName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.md,
    },
    bio: {
      fontSize: 14,
      color: colors.text,
      marginTop: spacing.xs,
      lineHeight: 20,
    },
    actionRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    editButton: {
      flex: 1,
      backgroundColor: colors.borderLight,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      alignItems: 'center',
    },
    editButtonText: {
      fontWeight: '600',
      color: colors.text,
      fontSize: 14,
    },
    shareButton: {
      backgroundColor: colors.borderLight,
      paddingHorizontal: spacing.md,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabs: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    tabActive: {
      borderBottomWidth: 1,
      borderBottomColor: colors.text,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    gridItem: {
      width: GRID_SIZE,
      aspectRatio: 1,
      padding: 1,
    },
    gridImage: {
      flex: 1,
      backgroundColor: colors.borderLight,
    },
    gridPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyGrid: {
      alignItems: 'center',
      paddingVertical: spacing.xxl * 2,
      backgroundColor: colors.surface,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.md,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
      paddingHorizontal: spacing.xxl,
    },
    postModal: {
      flex: 1,
    },
    postModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    postModalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
  });
}
