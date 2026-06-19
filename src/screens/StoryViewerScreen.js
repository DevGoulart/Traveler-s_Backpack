import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '../components/Avatar';
import { useSocial } from '../context/SocialContext';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000;

export default function StoryViewerScreen({ route, navigation }) {
  const { storyGroup, allStories } = route.params;
  const { markStoryViewed, currentUser, profilePhotoUri } = useSocial();
  const insets = useSafeAreaInsets();

  const [groupIndex, setGroupIndex] = useState(
    allStories.findIndex((s) => s.userId === storyGroup.userId)
  );
  const [itemIndex, setItemIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef(null);

  const currentGroup = allStories[groupIndex] || storyGroup;
  const currentItem = currentGroup?.items[itemIndex];

  useEffect(() => {
    if (currentGroup) {
      markStoryViewed(currentGroup.userId);
    }
  }, [groupIndex]);

  useEffect(() => {
    if (paused || !currentItem) return;

    progressRef.current = setTimeout(() => {
      goNext();
    }, STORY_DURATION);

    return () => {
      if (progressRef.current) clearTimeout(progressRef.current);
    };
  }, [groupIndex, itemIndex, paused, currentItem]);

  const goNext = () => {
    if (itemIndex < currentGroup.items.length - 1) {
      setItemIndex(itemIndex + 1);
      return;
    }

    if (groupIndex < allStories.length - 1) {
      setGroupIndex(groupIndex + 1);
      setItemIndex(0);
      return;
    }

    navigation.goBack();
  };

  const goPrev = () => {
    if (itemIndex > 0) {
      setItemIndex(itemIndex - 1);
      return;
    }

    if (groupIndex > 0) {
      const prevGroup = allStories[groupIndex - 1];
      setGroupIndex(groupIndex - 1);
      setItemIndex(prevGroup.items.length - 1);
    }
  };

  if (!currentItem) {
    navigation.goBack();
    return null;
  }

  const progress = (itemIndex + 1) / currentGroup.items.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Image source={{ uri: currentItem.uri }} style={styles.image} resizeMode="cover" />

      <View style={[styles.overlay, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.progressRow}>
          {currentGroup.items.map((_, i) => (
            <View key={i} style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      i < itemIndex ? '100%' : i === itemIndex ? `${progress * 100}%` : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.header}>
          <Avatar
            name={currentGroup.username}
            uri={currentGroup.username === currentUser ? profilePhotoUri : null}
            size={36}
          />
          <Text style={styles.username}>{currentGroup.username}</Text>
          <Text style={styles.time}>
            {new Date(currentItem.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          <Pressable style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.touchAreas}>
        <Pressable
          style={styles.touchLeft}
          onPress={goPrev}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
        />
        <Pressable
          style={styles.touchRight}
          onPress={goNext}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
        />
      </View>

      <View style={[styles.replyBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.replyInput}>
          <Text style={styles.replyPlaceholder}>Enviar mensagem...</Text>
        </View>
        <Ionicons name="heart-outline" size={26} color="#fff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    width,
    height,
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  username: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  time: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    flex: 1,
  },
  closeBtn: {
    marginLeft: 'auto',
  },
  touchAreas: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 5,
  },
  touchLeft: {
    flex: 1,
  },
  touchRight: {
    flex: 2,
  },
  replyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    zIndex: 10,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  replyPlaceholder: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
});
