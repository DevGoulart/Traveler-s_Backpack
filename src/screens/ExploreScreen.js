import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  Pressable,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSocial } from '../context/SocialContext';
import Avatar from '../components/Avatar';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: 'compass-outline' },
  { id: 'nature', label: 'Natureza', icon: 'leaf-outline' },
  { id: 'city', label: 'Cidades', icon: 'business-outline' },
  { id: 'beach', label: 'Praias', icon: 'sunny-outline' },
];

const CATEGORY_KEYWORDS = {
  nature: ['natureza', 'montanha', 'trilha', 'floresta', 'parque', 'cachoeira'],
  city: ['cidade', 'urbano', 'rua', 'centro', 'metrópole'],
  beach: ['praia', 'mar', 'oceano', 'costa', 'areia'],
};

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { posts } = useSocial();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return posts.filter((post) => {
      const text = [
        post.username,
        post.description,
        post.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesQuery = !normalizedQuery || text.includes(normalizedQuery);

      if (category === 'all') return matchesQuery;

      const keywords = CATEGORY_KEYWORDS[category] || [];
      const matchesCategory = keywords.some((kw) => text.includes(kw));
      return matchesQuery && matchesCategory;
    });
  }, [posts, query, category]);

  const renderItem = ({ item }) => {
    const uri = item.imageUri || item.uri;
    return (
      <Pressable style={styles.gridItem} onPress={() => setSelectedPost(item)}>
        {uri ? (
          <Image source={{ uri }} style={styles.gridImage} />
        ) : (
          <View style={[styles.gridImage, styles.gridPlaceholder]}>
            <Ionicons name="image-outline" size={28} color={colors.textMuted} />
          </View>
        )}
        {item.location ? (
          <View style={styles.locationBadge}>
            <Ionicons name="location-outline" size={10} color="#fff" />
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Explorar</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar lugares, usuários..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.categoryChip, category === item.id && styles.categoryChipActive]}
              onPress={() => setCategory(item.id)}
            >
              <Ionicons
                name={item.icon}
                size={14}
                color={category === item.id ? '#fff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.categoryText,
                  category === item.id && styles.categoryTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="compass-outline" size={56} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Nada encontrado</Text>
            <Text style={styles.emptyText}>
              Tente outro termo ou publique uma nova aventura pela câmera.
            </Text>
          </View>
        }
        renderItem={renderItem}
      />

      <Modal
        visible={!!selectedPost}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedPost(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedPost(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {selectedPost ? (
              <>
                <Image
                  source={{ uri: selectedPost.imageUri || selectedPost.uri }}
                  style={styles.modalImage}
                />
                <View style={styles.modalBody}>
                  <View style={styles.modalUser}>
                    <Avatar name={selectedPost.username} size={36} />
                    <Text style={styles.modalUsername}>{selectedPost.username}</Text>
                  </View>
                  {selectedPost.description ? (
                    <Text style={styles.modalDescription}>{selectedPost.description}</Text>
                  ) : null}
                  {selectedPost.location ? (
                    <View style={styles.modalLocation}>
                      <Ionicons name="location-outline" size={14} color={colors.primary} />
                      <Text style={styles.modalLocationText}>{selectedPost.location}</Text>
                    </View>
                  ) : null}
                </View>
                <Pressable style={styles.modalClose} onPress={() => setSelectedPost(null)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  categories: {
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: '#fff',
  },
  grid: {
    paddingBottom: spacing.xxl,
  },
  gridItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 1,
    position: 'relative',
  },
  gridImage: {
    flex: 1,
    backgroundColor: colors.borderLight,
  },
  gridPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 3,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xxl,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.borderLight,
  },
  modalBody: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalUsername: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  modalLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalLocationText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  modalClose: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: spacing.xs,
  },
});
