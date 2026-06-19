import { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  Pressable,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { useSocial } from '../context/SocialContext';
import { useTheme } from '../context/ThemeContext';
import spacing from '../theme/spacing';

export default function SharePostModal({ visible, post, onClose, onSendDM }) {
  const { allUsers, getAvatarUri } = useSocial();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mode, setMode] = useState(null);

  const handleExternalShare = async () => {
    if (!post) return;

    try {
      await Share.share({
        message: `📸 ${post.username} no Traveler's Backpack:\n\n${post.description || ''}\n\n${post.location ? `📍 ${post.location}` : ''}`.trim(),
      });
      onClose();
    } catch {
      Alert.alert('Erro', 'Não foi possível compartilhar.');
    }
  };

  const resetAndClose = () => {
    setMode(null);
    onClose();
  };

  if (!post) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={resetAndClose}>
      <Pressable style={styles.overlay} onPress={resetAndClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {!mode ? (
            <>
              <Text style={styles.title}>Compartilhar post</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {post.username}: {post.description}
              </Text>

              <Pressable style={styles.option} onPress={handleExternalShare}>
                <View style={styles.optionIcon}>
                  <Ionicons name="share-social-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Compartilhar externamente</Text>
                  <Text style={styles.optionDesc}>WhatsApp, SMS e outros apps</Text>
                </View>
              </Pressable>

              <Pressable style={styles.option} onPress={() => setMode('dm')}>
                <View style={styles.optionIcon}>
                  <Ionicons name="paper-plane-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Enviar por DM</Text>
                  <Text style={styles.optionDesc}>Enviar para um usuário do app</Text>
                </View>
              </Pressable>

              <Pressable style={styles.cancelButton} onPress={resetAndClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.dmHeader}>
                <Pressable onPress={() => setMode(null)} hitSlop={8}>
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </Pressable>
                <Text style={styles.title}>Enviar para</Text>
                <View style={{ width: 24 }} />
              </View>

              <FlatList
                data={allUsers}
                keyExtractor={(item) => item.id}
                style={styles.userList}
                ListEmptyComponent={
                  <Text style={styles.emptyUsers}>Nenhum outro usuário cadastrado ainda.</Text>
                }
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.userRow}
                    onPress={() => {
                      onSendDM(item, post);
                      resetAndClose();
                    }}
                  >
                    <Avatar
                      name={item.displayName}
                      uri={getAvatarUri(item.displayName, item.id)}
                      size={44}
                    />
                    <Text style={styles.userName}>{item.displayName}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </Pressable>
                )}
              />
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '70%',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  optionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  userList: {
    maxHeight: 320,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  userName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  emptyUsers: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: spacing.xl,
  },
  });
}
