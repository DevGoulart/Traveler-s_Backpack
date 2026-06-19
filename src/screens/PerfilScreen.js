import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '../components/Avatar';
import { useSocial } from '../context/SocialContext';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

export default function PerfilScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { currentUser, userPosts } = useSocial();

  const username = currentUser || 'Viajante';
  const postCount = userPosts.length;
  const followers = 128;
  const following = 96;

  const botoes = [
    { nome: 'Biometria', rota: 'Biometria', icon: 'finger-print-outline' },
    { nome: 'Juros', rota: 'Juros', icon: 'calculator-outline' },
    { nome: 'Mapa', rota: 'Mapa', icon: 'map-outline' },
    { nome: 'Todo', rota: 'Todo', icon: 'checkbox-outline' },
  ];

  const renderGridItem = ({ item }) => {
    const uri = item.imageUri || item.uri;
    return (
      <Pressable style={styles.gridItem}>
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.profileRow}>
          <Avatar name={username} size={86} showRing />
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
        <Text style={styles.bio}>Explorador 🌍 | Compartilhando aventuras pelo mundo</Text>

        <View style={styles.actionRow}>
          <Pressable style={styles.editButton}>
            <Text style={styles.editButtonText}>Editar perfil</Text>
          </Pressable>
          <Pressable style={styles.shareButton}>
            <Ionicons name="share-outline" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.tabs}>
        <View style={styles.tabActive}>
          <Ionicons name="grid" size={22} color={colors.text} />
        </View>
        <View style={styles.tab}>
          <Ionicons name="bookmark-outline" size={22} color={colors.textSecondary} />
        </View>
      </View>

      {userPosts.length > 0 ? (
        <FlatList
          data={userPosts}
          keyExtractor={(item) => item.id}
          numColumns={3}
          scrollEnabled={false}
          renderItem={renderGridItem}
        />
      ) : (
        <View style={styles.emptyGrid}>
          <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Nenhum post ainda</Text>
          <Text style={styles.emptyText}>
            Use a câmera para capturar e compartilhar suas aventuras!
          </Text>
        </View>
      )}

      <View style={styles.utilitiesSection}>
        <Text style={styles.utilitiesTitle}>Ferramentas</Text>
        {botoes.map((botao) => (
          <TouchableOpacity
            key={botao.rota}
            style={styles.utilityButton}
            onPress={() => navigation.navigate(botao.rota)}
          >
            <Ionicons name={botao.icon} size={22} color={colors.primary} />
            <Text style={styles.utilityText}>{botao.nome}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const GRID_SIZE = '33.33%';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
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
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
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
  utilitiesSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  utilitiesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  utilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  utilityText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
});
