import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEMO_POSTS,
  DEMO_STORIES,
  loadCurrentUser,
  loadPosts,
  loadStories,
  saveCurrentUser,
  savePosts,
  saveStories,
} from '../storage/socialStorage';

const SocialContext = createContext(null);

export function SocialProvider({ children }) {
  const [currentUser, setCurrentUserState] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    const [storedPosts, storedStories, storedUser] = await Promise.all([
      loadPosts(),
      loadStories(),
      loadCurrentUser(),
    ]);

    setPosts(storedPosts.length > 0 ? storedPosts : DEMO_POSTS);
    setStories(storedStories.length > 0 ? storedStories : DEMO_STORIES);
    setCurrentUserState(storedUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refreshFeed = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const setCurrentUser = useCallback(async (username) => {
    setCurrentUserState(username);
    await saveCurrentUser(username);
  }, []);

  const addPost = useCallback(async (postData) => {
    const newPost = {
      id: Date.now().toString(),
      likes: 0,
      liked: false,
      comments: [],
      createdAt: new Date().toISOString(),
      ...postData,
    };

    setPosts((prev) => {
      const updated = [newPost, ...prev.filter((p) => !p.id.startsWith('demo-'))];
      savePosts(updated);
      return updated;
    });

    return newPost;
  }, []);

  const addStory = useCallback(async (storyData) => {
    const { userId, username, uri } = storyData;
    const newItem = {
      id: Date.now().toString(),
      uri,
      createdAt: new Date().toISOString(),
    };

    setStories((prev) => {
      const withoutDemo = prev.filter((s) => !['maria', 'pedro', 'ana'].includes(s.userId) || s.userId === userId);
      const existing = withoutDemo.find((s) => s.userId === userId);

      let updated;
      if (existing) {
        updated = withoutDemo.map((s) =>
          s.userId === userId
            ? { ...s, items: [newItem, ...s.items], viewed: false }
            : s
        );
      } else {
        updated = [{ userId, username, items: [newItem], viewed: false }, ...withoutDemo];
      }

      saveStories(updated);
      return updated;
    });
  }, []);

  const toggleLike = useCallback((postId) => {
    setPosts((prev) => {
      const updated = prev.map((post) => {
        if (post.id !== postId) return post;
        const liked = !post.liked;
        return {
          ...post,
          liked,
          likes: liked ? post.likes + 1 : Math.max(0, post.likes - 1),
        };
      });
      savePosts(updated.filter((p) => !p.id.startsWith('demo-')));
      return updated;
    });
  }, []);

  const addComment = useCallback((postId, text) => {
    if (!text.trim() || !currentUser) return;

    setPosts((prev) => {
      const updated = prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: [
            ...post.comments,
            {
              id: Date.now().toString(),
              username: currentUser,
              text: text.trim(),
              createdAt: new Date().toISOString(),
            },
          ],
        };
      });
      savePosts(updated.filter((p) => !p.id.startsWith('demo-')));
      return updated;
    });
  }, [currentUser]);

  const markStoryViewed = useCallback((userId) => {
    setStories((prev) => {
      const updated = prev.map((s) =>
        s.userId === userId ? { ...s, viewed: true } : s
      );
      const toPersist = updated.filter((s) => !['maria', 'pedro', 'ana'].includes(s.userId));
      if (toPersist.length > 0) saveStories(toPersist);
      return updated;
    });
  }, []);

  const userPosts = useMemo(
    () => posts.filter((p) => p.username === currentUser || p.userId === currentUser?.toLowerCase()),
    [posts, currentUser]
  );

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      posts,
      stories,
      userPosts,
      loading,
      refreshing,
      refreshFeed,
      addPost,
      addStory,
      toggleLike,
      addComment,
      markStoryViewed,
    }),
    [
      currentUser,
      setCurrentUser,
      posts,
      stories,
      userPosts,
      loading,
      refreshing,
      refreshFeed,
      addPost,
      addStory,
      toggleLike,
      addComment,
      markStoryViewed,
    ]
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within SocialProvider');
  }
  return context;
}
