export const SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  image_uri TEXT NOT NULL,
  description TEXT,
  location TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id TEXT NOT NULL,
  username TEXT NOT NULL,
  PRIMARY KEY (post_id, username),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY NOT NULL,
  post_id TEXT NOT NULL,
  username TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS story_items (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  uri TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS story_views (
  user_id TEXT NOT NULL,
  viewer_username TEXT NOT NULL,
  viewed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, viewer_username)
);

CREATE TABLE IF NOT EXISTS camera_photos (
  id TEXT PRIMARY KEY NOT NULL,
  uri TEXT NOT NULL,
  description TEXT,
  location_short TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY NOT NULL,
  text TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
`;

export const STORY_TTL_MS = 24 * 60 * 60 * 1000;

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
