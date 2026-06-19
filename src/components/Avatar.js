import { View, Text, StyleSheet, Image } from 'react-native';
import colors from '../theme/colors';

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export default function Avatar({ name = '?', size = 40, showRing = false, viewed = false }) {
  const initial = name.charAt(0).toUpperCase();
  const bgColor = colors.avatarColors[hashString(name) % colors.avatarColors.length];

  return (
    <View style={[styles.wrapper, showRing && (viewed ? styles.ringViewed : styles.ringActive)]}>
      <View
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
        ]}
      >
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
      </View>
    </View>
  );
}

export function AvatarImage({ uri, size = 40, showRing = false, viewed = false }) {
  if (!uri) {
    return <Avatar name="?" size={size} showRing={showRing} viewed={viewed} />;
  }

  return (
    <View style={[styles.wrapper, showRing && (viewed ? styles.ringViewed : styles.ringActive)]}>
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.borderLight }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
