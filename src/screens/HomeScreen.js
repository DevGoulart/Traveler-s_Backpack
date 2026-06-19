import { FlatList, RefreshControl, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FeedHeader from '../components/FeedHeader';
import StoriesRow from '../components/StoriesRow';
import PostCard from '../components/PostCard';
import { useSocial } from '../context/SocialContext';
import colors from '../theme/colors';

export default function HomeScreen() {
  const navigation = useNavigation();
  const {
    posts,
    stories,
    currentUser,
    loading,
    refreshing,
    refreshFeed,
    toggleLike,
    addComment,
  } = useSocial();

  const handleStoryPress = (story) => {
    navigation.navigate('StoryViewer', { storyGroup: story, allStories: stories });
  };

  const handleAddStory = () => {
    navigation.navigate('CameraTab');
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshFeed}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <>
            <FeedHeader />
            <StoriesRow
              stories={stories}
              currentUser={currentUser}
              onStoryPress={handleStoryPress}
              onAddStory={handleAddStory}
            />
          </>
        }
        renderItem={({ item }) => (
          <PostCard post={item} onLike={toggleLike} onComment={addComment} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
