import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../components/Avatar';
import { useSocial } from '../context/SocialContext';
import { useTheme } from '../context/ThemeContext';
import spacing from '../theme/spacing';

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function ActivityItem({ activity, getAvatarUri, colors }) {
  const isLike = activity.type === 'like';
  const iconName = isLike ? 'heart' : 'chatbubble';
  const iconColor = isLike ? colors.danger : colors.primary;

  const message = isLike
    ? 'curtiu sua publicação.'
    : `comentou: ${activity.text || ''}`;

  return (
    <View style={[styles.activityRow, !activity.isRead && { backgroundColor: colors.borderLight }]}>
      <Avatar name={activity.actorUsername} uri={getAvatarUri(activity.actorUsername)} size={44} />
      <View style={styles.activityBody}>
        <Text style={[styles.activityText, { color: colors.text }]}>
          <Text style={styles.activityUser}>{activity.actorUsername} </Text>
          {message}
        </Text>
        <View style={styles.activityMeta}>
          <Ionicons name={iconName} size={14} color={iconColor} />
          <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
            {timeAgo(activity.createdAt)}
          </Text>
        </View>
      </View>
      {activity.postImageUri ? (
        <Image source={{ uri: activity.postImageUri }} style={styles.thumbnail} />
      ) : null}
    </View>
  );
}

export default function ActivitiesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { activities, loadActivities, markActivitiesRead, getAvatarUri } = useSocial();
  const [loading, setLoading] = useState(true);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const refresh = useCallback(async () => {
    await loadActivities();
    setLoading(false);
  }, [loadActivities]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (activities.some((a) => !a.isRead)) {
      markActivitiesRead();
    }
  }, [activities, markActivitiesRead]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Atividades</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={activities.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Nenhuma atividade</Text>
              <Text style={styles.emptyText}>
                Quando alguém curtir ou comentar suas publicações, aparecerá aqui.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ActivityItem activity={item} getAvatarUri={getAvatarUri} colors={colors} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  activityBody: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    lineHeight: 20,
  },
  activityUser: {
    fontWeight: '700',
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  activityTime: {
    fontSize: 12,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
});

function createStyles(colors) {
  return StyleSheet.create({
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
      lineHeight: 20,
    },
  });
}
