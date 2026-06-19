import { isStoryExpired } from '../schema';

export async function insertStoryItem(db, item) {
  await db.runAsync(
    'INSERT OR REPLACE INTO story_items (id, user_id, username, uri, created_at) VALUES (?, ?, ?, ?, ?)',
    [item.id, item.userId, item.username, item.uri, item.createdAt || new Date().toISOString()]
  );
}

export async function getAllStories(db, viewerUsername) {
  const rows = await db.getAllAsync(
    'SELECT * FROM story_items ORDER BY datetime(created_at) DESC'
  );

  const activeRows = rows.filter((row) => !isStoryExpired(row.created_at));
  const groupsMap = new Map();

  for (const row of activeRows) {
    if (!groupsMap.has(row.user_id)) {
      groupsMap.set(row.user_id, {
        userId: row.user_id,
        username: row.username,
        items: [],
        viewed: false,
      });
    }

    groupsMap.get(row.user_id).items.push({
      id: row.id,
      uri: row.uri,
      createdAt: row.created_at,
    });
  }

  const groups = Array.from(groupsMap.values());

  if (viewerUsername) {
    for (const group of groups) {
      const view = await db.getFirstAsync(
        'SELECT 1 FROM story_views WHERE user_id = ? AND viewer_username = ?',
        [group.userId, viewerUsername]
      );
      group.viewed = !!view;
    }
  }

  return groups;
}

export async function addStoryItem(db, { userId, username, uri }) {
  const item = {
    id: Date.now().toString(),
    userId,
    username,
    uri,
    createdAt: new Date().toISOString(),
  };

  await insertStoryItem(db, item);
  await db.runAsync(
    'DELETE FROM story_views WHERE user_id = ?',
    [userId]
  );

  return item;
}

export async function markStoryViewed(db, userId, viewerUsername) {
  await db.runAsync(
    'INSERT OR REPLACE INTO story_views (user_id, viewer_username, viewed_at) VALUES (?, ?, ?)',
    [userId, viewerUsername, new Date().toISOString()]
  );
}

export async function cleanupExpiredStories(db) {
  const rows = await db.getAllAsync('SELECT id, created_at FROM story_items');
  for (const row of rows) {
    if (isStoryExpired(row.created_at)) {
      await db.runAsync('DELETE FROM story_items WHERE id = ?', [row.id]);
    }
  }
}
