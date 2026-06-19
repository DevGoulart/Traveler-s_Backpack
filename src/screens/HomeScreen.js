import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FeedHeader from '../components/FeedHeader';
import StoriesRow from '../components/StoriesRow';
import PostCard from '../components/PostCard';
import SharePostModal from '../components/SharePostModal';
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
    getAvatarUri,
    sharePostToUser,
  } = useSocial();

  const [sharePost, setSharePost] = useState(null);

  const handleStoryPress = (story) => {
    navigation.navigate('StoryViewer', { storyGroup: story, allStories: stories });
  };

  const handleAddStory = () => {
    navigation.navigate('CameraTab');
  };

  const handleSharePost = (post) => {
    setSharePost(post);
  };

  const handleSendDM = async (recipient, post) => {
    try {
      const conversationId = await sharePostToUser(recipient, post);
      setSharePost(null);
      navigation.navigate('Chat', {
        conversationId,
        otherUser: recipient,
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar o post.');
    }
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
              getAvatarUri={getAvatarUri}
              onStoryPress={handleStoryPress}
              onAddStory={handleAddStory}
            />
          </>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={toggleLike}
            onComment={addComment}
            onShare={handleSharePost}
            getAvatarUri={getAvatarUri}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      <SharePostModal
        visible={!!sharePost}
        post={sharePost}
        onClose={() => setSharePost(null)}
        onSendDM={handleSendDM}
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
