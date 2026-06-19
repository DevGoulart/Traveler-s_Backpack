import AsyncStorage from '@react-native-async-storage/async-storage';

export const POSTS_KEY = '@traveler_backpack_posts';
export const STORIES_KEY = '@traveler_backpack_stories';
export const USER_KEY = '@traveler_backpack_current_user';

const STORY_TTL_MS = 24 * 60 * 60 * 1000;

export function isStoryExpired(createdAt) {
  if (!createdAt) return true;
  return Date.now() - new Date(createdAt).getTime() > STORY_TTL_MS;
}

export function filterActiveStories(stories) {
  if (!Array.isArray(stories)) return [];
  return stories
    .map((group) => ({
      ...group,
      items: (group.items || []).filter((item) => !isStoryExpired(item.createdAt)),
    }))
    .filter((group) => group.items.length > 0);
}

export async function loadPosts() {
  try {
    const raw = await AsyncStorage.getItem(POSTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function savePosts(posts) {
  await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

export async function loadStories() {
  try {
    const raw = await AsyncStorage.getItem(STORIES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return filterActiveStories(parsed);
  } catch {
    return [];
  }
}

export async function saveStories(stories) {
  const active = filterActiveStories(stories);
  await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(active));
}

export async function loadCurrentUser() {
  try {
    return await AsyncStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

export async function saveCurrentUser(username) {
  if (username) {
    await AsyncStorage.setItem(USER_KEY, username);
  } else {
    await AsyncStorage.removeItem(USER_KEY);
  }
}

export const DEMO_POSTS = [
  {
    id: 'demo-1',
    userId: 'joao',
    username: 'João',
    imageUri: 'https://picsum.photos/seed/maranhenses/800/800',
    description: 'Curtindo o dia nos Lençóis Maranhenses 😎',
    location: 'Maranhão, Brasil',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    likes: 42,
    liked: false,
    comments: [{ id: 'c1', username: 'Maria', text: 'Que lugar incrível!', createdAt: new Date().toISOString() }],
  },
  {
    id: 'demo-2',
    userId: 'maria',
    username: 'Maria',
    imageUri: 'https://picsum.photos/seed/rio/800/800',
    description: 'Olha essa paisagem! 🌅',
    location: 'Rio de Janeiro, Brasil',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    likes: 128,
    liked: false,
    comments: [],
  },
  {
    id: 'demo-3',
    userId: 'pedro',
    username: 'Pedro',
    imageUri: 'https://picsum.photos/seed/mountain/800/800',
    description: 'Aventura nas montanhas 🏔️',
    location: 'Chapada Diamantina',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    likes: 67,
    liked: false,
    comments: [{ id: 'c2', username: 'Ana', text: 'Quero ir também!', createdAt: new Date().toISOString() }],
  },
];

export const DEMO_STORIES = [
  {
    userId: 'maria',
    username: 'Maria',
    items: [
      {
        id: 's-maria-1',
        uri: 'https://picsum.photos/seed/story-maria/1080/1920',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
    viewed: false,
  },
  {
    userId: 'pedro',
    username: 'Pedro',
    items: [
      {
        id: 's-pedro-1',
        uri: 'https://picsum.photos/seed/story-pedro/1080/1920',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
    viewed: false,
  },
  {
    userId: 'ana',
    username: 'Ana',
    items: [
      {
        id: 's-ana-1',
        uri: 'https://picsum.photos/seed/story-ana/1080/1920',
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
    ],
    viewed: false,
  },
];
