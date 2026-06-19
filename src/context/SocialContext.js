import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { initDatabase } from '../database/init';
import {
  loadPosts,
  loadStories,
  loadProfile,
  createPost,
  createStoryItem,
  togglePostLike,
  addPostComment,
  togglePostSave,
  loadSavedPosts,
  markStoryAsViewed,
  updateUserProfile,
  loginUser as loginUserDb,
  registerUser as registerUserDb,
  logoutUser as logoutUserDb,
  restoreBiometricSession,
  getSessionUser,
  loadAllUserAvatars,
  loadAllUsersExcept,
  loadConversations as loadConversationsDb,
  loadChatMessages as loadChatMessagesDb,
  sendChatMessage,
  sharePostInChat,
  startConversation as startConversationDb,
  loadActivities as loadActivitiesDb,
  loadUnreadActivityCount as loadUnreadActivityCountDb,
  markActivitiesAsRead as markActivitiesAsReadDb,
} from '../storage/socialStorage';

const SocialContext = createContext(null);

export function SocialProvider({ children }) {
  const [currentUser, setCurrentUserState] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userBio, setUserBioState] = useState('');
  const [profilePhotoUri, setProfilePhotoUri] = useState(null);
  const [userAvatars, setUserAvatars] = useState({ byUsername: {}, byUserId: {} });
  const [allUsers, setAllUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(async () => {
        const session = await getSessionUser();
        setIsAuthenticated(!!session);
        setAuthReady(true);
      })
      .catch(() => setAuthReady(true));
  }, []);

  const getAvatarUri = useCallback((username, userId) => {
    if (userId && userAvatars.byUserId[userId]) {
      return userAvatars.byUserId[userId];
    }
    if (username && userAvatars.byUsername[username]) {
      return userAvatars.byUsername[username];
    }
    return null;
  }, [userAvatars]);

  const loadAll = useCallback(async () => {
    if (!authReady) return;

    const profile = await loadProfile();
    const storedUser = profile.username;

    if (!storedUser) {
      setIsAuthenticated(false);
      setCurrentUserState(null);
      setCurrentUserId(null);
      setLoading(false);
      return;
    }

    const [storedPosts, storedStories, avatarsData, usersList, convos, saved, acts, unreadCount] = await Promise.all([
      loadPosts(storedUser),
      loadStories(storedUser),
      loadAllUserAvatars(),
      loadAllUsersExcept(profile.userId),
      profile.userId ? loadConversationsDb(profile.userId) : Promise.resolve([]),
      loadSavedPosts(storedUser),
      profile.userId ? loadActivitiesDb(profile.userId) : Promise.resolve([]),
      profile.userId ? loadUnreadActivityCountDb(profile.userId) : Promise.resolve(0),
    ]);

    setPosts(storedPosts);
    setStories(storedStories);
    setCurrentUserState(storedUser);
    setCurrentUserId(profile.userId);
    setUserBioState(profile.bio || '');
    setProfilePhotoUri(profile.avatarUri || null);
    setUserAvatars({ byUsername: avatarsData.byUsername, byUserId: avatarsData.byUserId });
    setAllUsers(usersList);
    setConversations(convos);
    setSavedPosts(saved);
    setActivities(acts);
    setUnreadActivityCount(unreadCount);
    setIsAuthenticated(true);
    setLoading(false);
  }, [authReady]);

  useEffect(() => {
    if (authReady && isAuthenticated) {
      loadAll();
    } else if (authReady && !isAuthenticated) {
      setLoading(false);
    }
  }, [authReady, isAuthenticated, loadAll]);

  const refreshFeed = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const loadConversations = useCallback(async () => {
    if (!currentUserId) return [];
    const convos = await loadConversationsDb(currentUserId);
    setConversations(convos);
    return convos;
  }, [currentUserId]);

  const loadChatMessages = useCallback(async (conversationId) => {
    return loadChatMessagesDb(conversationId);
  }, []);

  const sendMessage = useCallback(async (conversationId, text) => {
    if (!currentUserId) return null;
    const message = await sendChatMessage(conversationId, currentUserId, text);
    await loadConversations();
    return message;
  }, [currentUserId, loadConversations]);

  const startConversation = useCallback(async (otherUserId) => {
    if (!currentUserId) return null;
    const conversationId = await startConversationDb(currentUserId, otherUserId);
    await loadConversations();
    return conversationId;
  }, [currentUserId, loadConversations]);

  const sharePostToUser = useCallback(async (recipientUser, post) => {
    if (!currentUserId) return null;
    const conversationId = await startConversationDb(currentUserId, recipientUser.id);
    await sharePostInChat(conversationId, currentUserId, post);
    await loadConversations();
    return conversationId;
  }, [currentUserId, loadConversations]);

  const login = useCallback(async (loginName, password) => {
    const user = await loginUserDb({ login: loginName, password });
    setCurrentUserState(user.displayName);
    setCurrentUserId(user.id);
    setUserBioState(user.bio || '');
    setProfilePhotoUri(user.avatarUri || null);
    setIsAuthenticated(true);
    await loadAll();
    return user;
  }, [loadAll]);

  const register = useCallback(async (loginName, displayName, password) => {
    const user = await registerUserDb({ login: loginName, displayName, password });
    setCurrentUserState(user.displayName);
    setCurrentUserId(user.id);
    setUserBioState(user.bio || '');
    setProfilePhotoUri(user.avatarUri || null);
    setIsAuthenticated(true);
    await loadAll();
    return user;
  }, [loadAll]);

  const restoreBiometric = useCallback(async () => {
    const user = await restoreBiometricSession();
    setCurrentUserState(user.displayName);
    setCurrentUserId(user.id);
    setUserBioState(user.bio || '');
    setProfilePhotoUri(user.avatarUri || null);
    setIsAuthenticated(true);
    await loadAll();
    return user;
  }, [loadAll]);

  const logout = useCallback(async () => {
    await logoutUserDb();
    setCurrentUserState(null);
    setCurrentUserId(null);
    setUserBioState('');
    setProfilePhotoUri(null);
    setUserAvatars({ byUsername: {}, byUserId: {} });
    setAllUsers([]);
    setConversations([]);
    setSavedPosts([]);
    setActivities([]);
    setUnreadActivityCount(0);
    setPosts([]);
    setStories([]);
    setIsAuthenticated(false);
  }, []);

  const updateProfile = useCallback(async (username, bio, avatarUri) => {
    const trimmedName = username.trim();
    const trimmedBio = bio.trim();

    await updateUserProfile({
      userId: currentUserId,
      oldUsername: currentUser,
      newUsername: trimmedName,
      bio: trimmedBio,
      avatarUri,
    });

    setCurrentUserState(trimmedName);
    setUserBioState(trimmedBio);
    setProfilePhotoUri(avatarUri || null);

    await loadAll();
  }, [currentUser, currentUserId, loadAll]);

  const addPost = useCallback(async (postData) => {
    const newPost = await createPost({
      ...postData,
      userId: currentUserId || postData.userId,
      username: currentUser || postData.username,
    });
    await loadAll();
    return newPost;
  }, [currentUser, currentUserId, loadAll]);

  const addStory = useCallback(async (storyData) => {
    await createStoryItem({
      ...storyData,
      userId: currentUserId || storyData.userId,
      username: currentUser || storyData.username,
    });
    await loadAll();
  }, [currentUser, currentUserId, loadAll]);

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

    if (currentUserId) {
      const unreadCount = await loadUnreadActivityCountDb(currentUserId);
      setUnreadActivityCount(unreadCount);
      const acts = await loadActivitiesDb(currentUserId);
      setActivities(acts);
    }
  }, [currentUser, currentUserId]);

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

    if (currentUserId) {
      const [acts, unreadCount] = await Promise.all([
        loadActivitiesDb(currentUserId),
        loadUnreadActivityCountDb(currentUserId),
      ]);
      setActivities(acts);
      setUnreadActivityCount(unreadCount);
    }
  }, [currentUser, currentUserId]);

  const toggleSave = useCallback(async (postId) => {
    if (!currentUser) return;

    const saved = await togglePostSave(postId, currentUser);
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, saved } : post
      )
    );

    const updatedSaved = await loadSavedPosts(currentUser);
    setSavedPosts(updatedSaved);
  }, [currentUser]);

  const loadActivities = useCallback(async () => {
    if (!currentUserId) return [];
    const [acts, unreadCount] = await Promise.all([
      loadActivitiesDb(currentUserId),
      loadUnreadActivityCountDb(currentUserId),
    ]);
    setActivities(acts);
    setUnreadActivityCount(unreadCount);
    return acts;
  }, [currentUserId]);

  const markActivitiesRead = useCallback(async () => {
    if (!currentUserId) return;
    await markActivitiesAsReadDb(currentUserId);
    setUnreadActivityCount(0);
    setActivities((prev) => prev.map((a) => ({ ...a, isRead: true })));
  }, [currentUserId]);

  const markStoryViewed = useCallback(async (userId) => {
    if (!currentUser) return;

    await markStoryAsViewed(userId, currentUser);
    setStories((prev) =>
      prev.map((s) => (s.userId === userId ? { ...s, viewed: true } : s))
    );
  }, [currentUser]);

  const userPosts = useMemo(
    () => posts.filter(
      (p) => p.userId === currentUserId
        || p.username === currentUser
        || p.userId === currentUser?.toLowerCase()
    ),
    [posts, currentUser, currentUserId]
  );

  const value = useMemo(
    () => ({
      currentUser,
      currentUserId,
      userBio,
      profilePhotoUri,
      userAvatars,
      allUsers,
      conversations,
      savedPosts,
      activities,
      unreadActivityCount,
      getAvatarUri,
      isAuthenticated,
      authReady,
      login,
      register,
      restoreBiometric,
      logout,
      updateProfile,
      posts,
      stories,
      userPosts,
      loading,
      refreshing,
      refreshFeed,
      loadConversations,
      loadChatMessages,
      sendMessage,
      startConversation,
      sharePostToUser,
      addPost,
      addStory,
      toggleLike,
      toggleSave,
      addComment,
      loadActivities,
      markActivitiesRead,
      markStoryViewed,
    }),
    [
      currentUser,
      currentUserId,
      userBio,
      profilePhotoUri,
      userAvatars,
      allUsers,
      conversations,
      savedPosts,
      activities,
      unreadActivityCount,
      getAvatarUri,
      isAuthenticated,
      authReady,
      login,
      register,
      restoreBiometric,
      logout,
      updateProfile,
      posts,
      stories,
      userPosts,
      loading,
      refreshing,
      refreshFeed,
      loadConversations,
      loadChatMessages,
      sendMessage,
      startConversation,
      sharePostToUser,
      addPost,
      addStory,
      toggleLike,
      toggleSave,
      addComment,
      loadActivities,
      markActivitiesRead,
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
