import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSocial } from '../context/SocialContext';
import { useTheme } from '../context/ThemeContext';
import spacing from '../theme/spacing';

export default function FeedHeader() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { conversations, unreadActivityCount } = useSocial();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <View style={styles.logoRow}>
          <Ionicons name="airplane" size={22} color={colors.primary} />
          <Text style={styles.logo}>Traveler's Backpack</Text>
        </View>
        <View style={styles.icons}>
          <Pressable onPress={() => navigation.navigate('Activities')} hitSlop={8} style={styles.iconButton}>
            <View>
              <Ionicons name="heart-outline" size={26} color={colors.text} />
              {unreadActivityCount > 0 && <View style={styles.badge} />}
            </View>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('DM')} hitSlop={8}>
            <View>
              <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
              {conversations.length > 0 && <View style={styles.badge} />}
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    logo: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    icons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      marginRight: spacing.lg,
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.danger,
    },
  });
}
