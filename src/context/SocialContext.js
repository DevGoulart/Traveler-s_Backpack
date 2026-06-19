import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { initDatabase } from '../database/init';
import {
  loadPosts,
  loadStories,
  loadCurrentUser,
  saveCurrentUser,
  loadUserBio,
  saveUserBio,
  createPost,
  createStoryItem,
  togglePostLike,
  addPostComment,
  markStoryAsViewed,
} from '../storage/socialStorage';

const SocialContext = createContext(null);

export function SocialProvider({ children }) {
  const [currentUser, setCurrentUserState] = useState(null);
  const [userBio, setUserBioState] = useState('');
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch(() => setDbReady(true));
  }, []);

  const loadAll = useCallback(async () => {
    if (!dbReady) return;

    const storedUser = await loadCurrentUser();
    const [storedPosts, storedStories, storedBio] = await Promise.all([
      loadPosts(storedUser),
      loadStories(storedUser),
      loadUserBio(),
    ]);

    setPosts(storedPosts);
    setStories(storedStories);
    setCurrentUserState(storedUser);
    setUserBioState(storedBio || '');
    setLoading(false);
  }, [dbReady]);

  useEffect(() => {
    if (dbReady) {
      loadAll();
    }
  }, [dbReady, loadAll]);

  const refreshFeed = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const setCurrentUser = useCallback(async (username) => {
    setCurrentUserState(username);
    await saveCurrentUser(username);
    await loadAll();
  }, [loadAll]);

  const updateProfile = useCallback(async (username, bio) => {
    setCurrentUserState(username);
    setUserBioState(bio);
    await Promise.all([saveCurrentUser(username), saveUserBio(bio)]);
    await loadAll();
  }, [loadAll]);

  const addPost = useCallback(async (postData) => {
    const newPost = await createPost(postData);
    await loadAll();
    return newPost;
  }, [loadAll]);

  const addStory = useCallback(async (storyData) => {
    await createStoryItem(storyData);
    await loadAll();
  }, [loadAll]);

  const toggleLike = useCallback(async (postId) => {
    if (!currentUser) return;

    await togglePostLike(postId, currentUser);
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const liked = !post.liked;
        return {
          ...post,
          liked,
          likes: liked ? post.likes + 1 : Math.max(0, post.likes - 1),
        };
      })
    );
  }, [currentUser]);

  const addComment = useCallback(async (postId, text) => {
    if (!text.trim() || !currentUser) return;

    const comment = await addPostComment(postId, currentUser, text);
    if (!comment) return;

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, comment] }
          : post
      )
    );
  }, [currentUser]);

  const markStoryViewed = useCallback(async (userId) => {
    if (!currentUser) return;

    await markStoryAsViewed(userId, currentUser);
    setStories((prev) =>
      prev.map((s) => (s.userId === userId ? { ...s, viewed: true } : s))
    );
  }, [currentUser]);

  const userPosts = useMemo(
    () => posts.filter((p) => p.username === currentUser || p.userId === currentUser?.toLowerCase()),
    [posts, currentUser]
  );

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      userBio,
      updateProfile,
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
      userBio,
      updateProfile,
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
