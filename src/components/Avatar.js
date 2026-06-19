import { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export default function Avatar({
  name = '?',
  uri = null,
  size = 40,
  showRing = false,
  viewed = false,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const initial = name.charAt(0).toUpperCase();
  const bgColor = colors.avatarColors[hashString(name) % colors.avatarColors.length];

  return (
    <View style={[styles.wrapper, showRing && (viewed ? styles.ringViewed : styles.ringActive)]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.borderLight,
          }}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
          ]}
        >
          <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
        </View>
      )}
    </View>
  );
}

export function AvatarImage({ uri, name = '?', size = 40, showRing = false, viewed = false }) {
  return <Avatar name={name} uri={uri} size={size} showRing={showRing} viewed={viewed} />;
}

function createStyles(colors) {
  return StyleSheet.create({
    wrapper: {
      padding: 2,
      borderRadius: 999,
    },
    ringActive: {
      borderWidth: 2,
      borderColor: colors.accent,
    },
    ringViewed: {
      borderWidth: 2,
      borderColor: colors.textMuted,
    },
    avatar: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    initial: {
      color: '#fff',
      fontWeight: '700',
    },
  });
}
