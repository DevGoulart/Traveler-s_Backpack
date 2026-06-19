import AsyncStorage from '@react-native-async-storage/async-storage';
import { openDatabaseAsync } from 'expo-sqlite';
import { DEMO_POSTS, DEMO_STORIES, SCHEMA } from './schema';
import * as postsRepo from './repositories/postsRepository';
import * as storiesRepo from './repositories/storiesRepository';
import * as cameraRepo from './repositories/cameraRepository';
import * as settingsRepo from './repositories/settingsRepository';

const DB_NAME = 'travelers_backpack.db';

let dbInstance = null;
let initPromise = null;

export async function getDatabase() {
  if (dbInstance) return dbInstance;
  if (!initPromise) {
    initPromise = openDatabaseAsync(DB_NAME);
  }
  dbInstance = await initPromise;
  return dbInstance;
}

async function migrateFromAsyncStorage(db) {
  const migrated = await settingsRepo.getSetting(db, 'migrated_from_async_v1');
  if (migrated === 'true') return;

  const [postsRaw, storiesRaw, userRaw, cameraRaw] = await Promise.all([
    AsyncStorage.getItem('@traveler_backpack_posts'),
    AsyncStorage.getItem('@traveler_backpack_stories'),
    AsyncStorage.getItem('@traveler_backpack_current_user'),
    AsyncStorage.getItem('@traveler_backpack_camera_history'),
  ]);

  if (userRaw) {
    await settingsRepo.setSetting(db, 'current_user', userRaw);
  }

  if (postsRaw) {
    try {
      const posts = JSON.parse(postsRaw);
      for (const post of posts) {
        await postsRepo.insertPost(db, {
          id: post.id,
          userId: post.userId,
          username: post.username,
          imageUri: post.imageUri || post.uri,
          description: post.description,
          location: post.location,
          likes: post.likes || 0,
          createdAt: post.createdAt,
          isDemo: post.id?.startsWith('demo-') ? 1 : 0,
          likedBy: post.liked ? [post.username] : [],
          comments: post.comments || [],
        });
      }
    } catch {
      // Ignore invalid legacy data.
    }
  }

  if (storiesRaw) {
    try {
      const stories = JSON.parse(storiesRaw);
      for (const group of stories) {
        for (const item of group.items || []) {
          await storiesRepo.insertStoryItem(db, {
            id: item.id,
            userId: group.userId,
            username: group.username,
            uri: item.uri,
            createdAt: item.createdAt,
          });
        }
        if (group.viewed) {
          await storiesRepo.markStoryViewed(db, group.userId, 'legacy');
        }
      }
    } catch {
      // Ignore invalid legacy data.
    }
  }

  if (cameraRaw) {
    try {
      const items = JSON.parse(cameraRaw);
      const normalized = Array.isArray(items) ? items : [];
      for (const entry of normalized) {
        const photo = typeof entry === 'string'
          ? { id: `${Date.now()}-${entry}`, uri: entry, description: null, locationShort: null, createdAt: new Date().toISOString() }
          : entry;
        if (photo?.uri) {
          await cameraRepo.insertPhoto(db, photo);
        }
      }
    } catch {
      // Ignore invalid legacy data.
    }
  }

  await settingsRepo.setSetting(db, 'migrated_from_async_v1', 'true');
}

async function seedDemoData(db) {
  const count = await postsRepo.countPosts(db);
  if (count > 0) return;

  for (const post of DEMO_POSTS) {
    await postsRepo.insertPost(db, {
      id: post.id,
      userId: post.userId,
      username: post.username,
      imageUri: post.imageUri,
      description: post.description,
      location: post.location,
      likes: post.likes,
      createdAt: post.createdAt,
      isDemo: 1,
      comments: post.comments,
    });
  }

  for (const group of DEMO_STORIES) {
    for (const item of group.items) {
      await storiesRepo.insertStoryItem(db, {
        id: item.id,
        userId: group.userId,
        username: group.username,
        uri: item.uri,
        createdAt: item.createdAt,
      });
    }
  }
}

export async function initDatabase() {
  const db = await getDatabase();
  await db.execAsync(SCHEMA);
  await migrateFromAsyncStorage(db);
  await seedDemoData(db);
  return db;
}
