import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

export default function StoriesRow({ stories, currentUser, profilePhotoUri, onStoryPress, onAddStory }) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Pressable style={styles.storyItem} onPress={onAddStory}>
          <View style={styles.addStoryRing}>
            <View style={styles.addStoryInner}>
              <Ionicons name="add" size={28} color={colors.primary} />
            </View>
          </View>
          <Text style={styles.username} numberOfLines={1}>
            Seu story
          </Text>
        </Pressable>

        {stories.map((story) => (
          <Pressable
            key={story.userId}
            style={styles.storyItem}
            onPress={() => onStoryPress(story)}
          >
            <Avatar
              name={story.username}
              uri={story.username === currentUser ? profilePhotoUri : null}
              size={62}
              showRing
              viewed={story.viewed}
            />
            <Text style={styles.username} numberOfLines={1}>
              {story.username === currentUser ? 'Seu story' : story.username}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  storyItem: {
    alignItems: 'center',
    width: 76,
  },
  addStoryRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  addStoryInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    marginTop: spacing.xs,
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
  },
});
