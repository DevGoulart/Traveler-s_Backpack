import { initDatabase, getDatabase } from '../database/init';
import * as postsRepo from '../database/repositories/postsRepository';
import * as storiesRepo from '../database/repositories/storiesRepository';
import * as settingsRepo from '../database/repositories/settingsRepository';
import { DEMO_POSTS, DEMO_STORIES, isStoryExpired, filterActiveStories } from '../database/schema';

export { DEMO_POSTS, DEMO_STORIES, isStoryExpired, filterActiveStories };

export async function loadPosts(currentUsername) {
  await initDatabase();
  const db = await getDatabase();
  return postsRepo.getAllPosts(db, currentUsername);
}

export async function createPost(postData) {
  await initDatabase();
  const db = await getDatabase();
  await postsRepo.deleteDemoPosts(db);
  return postsRepo.createPost(db, postData);
}

export async function togglePostLike(postId, username) {
  if (!username) return null;
  await initDatabase();
  const db = await getDatabase();
  return postsRepo.togglePostLike(db, postId, username);
}

export async function addPostComment(postId, username, text) {
  if (!username || !text.trim()) return null;
  await initDatabase();
  const db = await getDatabase();
  return postsRepo.addComment(db, postId, username, text);
}

export async function loadStories(viewerUsername) {
  await initDatabase();
  const db = await getDatabase();
  await storiesRepo.cleanupExpiredStories(db);
  return storiesRepo.getAllStories(db, viewerUsername);
}

export async function createStoryItem(storyData) {
  await initDatabase();
  const db = await getDatabase();
  return storiesRepo.addStoryItem(db, storyData);
}

export async function markStoryAsViewed(userId, viewerUsername) {
  if (!viewerUsername) return;
  await initDatabase();
  const db = await getDatabase();
  await storiesRepo.markStoryViewed(db, userId, viewerUsername);
}

export async function loadCurrentUser() {
  await initDatabase();
  const db = await getDatabase();
  return settingsRepo.getSetting(db, 'current_user');
}

export async function saveCurrentUser(username) {
  await initDatabase();
  const db = await getDatabase();
  if (username) {
    await settingsRepo.setSetting(db, 'current_user', username);
  } else {
    await settingsRepo.removeSetting(db, 'current_user');
  }
}

export async function loadUserBio() {
  await initDatabase();
  const db = await getDatabase();
  return settingsRepo.getSetting(db, 'user_bio');
}

export async function saveUserBio(bio) {
  await initDatabase();
  const db = await getDatabase();
  if (bio) {
    await settingsRepo.setSetting(db, 'user_bio', bio);
  } else {
    await settingsRepo.removeSetting(db, 'user_bio');
  }
}

export async function loadCameraHistory() {
  await initDatabase();
  const db = await getDatabase();
  const { getCameraHistory } = await import('../database/repositories/cameraRepository');
  return getCameraHistory(db);
}

export async function saveCameraPhoto(photo) {
  await initDatabase();
  const db = await getDatabase();
  const { insertPhoto } = await import('../database/repositories/cameraRepository');
  await insertPhoto(db, photo);
}

export async function clearCameraHistory() {
  await initDatabase();
  const db = await getDatabase();
  const { clearCameraHistory: clear } = await import('../database/repositories/cameraRepository');
  await clear(db);
}

export async function loadTodos() {
  await initDatabase();
  const db = await getDatabase();
  const { getAllTodos } = await import('../database/repositories/todosRepository');
  return getAllTodos(db);
}

export async function createTodo(text) {
  await initDatabase();
  const db = await getDatabase();
  const { createTodo: create } = await import('../database/repositories/todosRepository');
  return create(db, text);
}

export async function toggleTodo(id) {
  await initDatabase();
  const db = await getDatabase();
  const { toggleTodo: toggle } = await import('../database/repositories/todosRepository');
  await toggle(db, id);
}

export async function deleteTodo(id) {
  await initDatabase();
  const db = await getDatabase();
  const { deleteTodo: remove } = await import('../database/repositories/todosRepository');
  await remove(db, id);
}
