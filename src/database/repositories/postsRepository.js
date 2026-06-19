export async function countPosts(db) {
  const row = await db.getFirstAsync('SELECT COUNT(*) as count FROM posts');
  return row?.count ?? 0;
}

export async function getAllPosts(db, currentUsername) {
  const rows = await db.getAllAsync(
    'SELECT * FROM posts ORDER BY datetime(created_at) DESC'
  );

  const posts = [];
  for (const row of rows) {
    const comments = await db.getAllAsync(
      'SELECT id, username, text, created_at as createdAt FROM comments WHERE post_id = ? ORDER BY datetime(created_at) ASC',
      [row.id]
    );

    let liked = false;
    let saved = false;
    if (currentUsername) {
      const likeRow = await db.getFirstAsync(
        'SELECT 1 FROM post_likes WHERE post_id = ? AND username = ?',
        [row.id, currentUsername]
      );
      liked = !!likeRow;

      const saveRow = await db.getFirstAsync(
        'SELECT 1 FROM saved_posts WHERE post_id = ? AND username = ?',
        [row.id, currentUsername]
      );
      saved = !!saveRow;
    }

    posts.push({
      id: row.id,
      userId: row.user_id,
      username: row.username,
      imageUri: row.image_uri,
      uri: row.image_uri,
      description: row.description,
      location: row.location,
      likes: row.likes_count,
      liked,
      saved,
      createdAt: row.created_at,
      isDemo: row.is_demo === 1,
      comments,
    });
  }

  return posts;
}

export async function insertPost(db, post) {
  await db.runAsync(
    `INSERT OR REPLACE INTO posts
      (id, user_id, username, image_uri, description, location, likes_count, created_at, is_demo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      post.id,
      post.userId,
      post.username,
      post.imageUri,
      post.description || '',
      post.location || null,
      post.likes || 0,
      post.createdAt || new Date().toISOString(),
      post.isDemo || 0,
    ]
  );

  for (const comment of post.comments || []) {
    await db.runAsync(
      'INSERT OR IGNORE INTO comments (id, post_id, username, text, created_at) VALUES (?, ?, ?, ?, ?)',
      [comment.id, post.id, comment.username, comment.text, comment.createdAt || new Date().toISOString()]
    );
  }

  for (const username of post.likedBy || []) {
    await db.runAsync(
      'INSERT OR IGNORE INTO post_likes (post_id, username) VALUES (?, ?)',
      [post.id, username]
    );
  }
}

export async function createPost(db, postData) {
  const id = Date.now().toString();
  const post = {
    id,
    userId: postData.userId,
    username: postData.username,
    imageUri: postData.imageUri || postData.uri,
    description: postData.description || '',
    location: postData.location || null,
    likes: 0,
    createdAt: new Date().toISOString(),
    isDemo: 0,
    comments: [],
  };

  await insertPost(db, post);
  return { ...post, liked: false, saved: false, uri: post.imageUri };
}

export async function togglePostSave(db, postId, username) {
  const existing = await db.getFirstAsync(
    'SELECT 1 FROM saved_posts WHERE post_id = ? AND username = ?',
    [postId, username]
  );

  if (existing) {
    await db.runAsync(
      'DELETE FROM saved_posts WHERE post_id = ? AND username = ?',
      [postId, username]
    );
    return false;
  }

  await db.runAsync(
    'INSERT INTO saved_posts (post_id, username, saved_at) VALUES (?, ?, ?)',
    [postId, username, new Date().toISOString()]
  );
  return true;
}

export async function getSavedPosts(db, currentUsername) {
  if (!currentUsername) return [];

  const rows = await db.getAllAsync(
    `SELECT p.* FROM posts p
     INNER JOIN saved_posts sp ON sp.post_id = p.id AND sp.username = ?
     ORDER BY datetime(sp.saved_at) DESC`,
    [currentUsername]
  );

  const posts = [];
  for (const row of rows) {
    const comments = await db.getAllAsync(
      'SELECT id, username, text, created_at as createdAt FROM comments WHERE post_id = ? ORDER BY datetime(created_at) ASC',
      [row.id]
    );

    const likeRow = await db.getFirstAsync(
      'SELECT 1 FROM post_likes WHERE post_id = ? AND username = ?',
      [row.id, currentUsername]
    );

    posts.push({
      id: row.id,
      userId: row.user_id,
      username: row.username,
      imageUri: row.image_uri,
      uri: row.image_uri,
      description: row.description,
      location: row.location,
      likes: row.likes_count,
      liked: !!likeRow,
      saved: true,
      createdAt: row.created_at,
      isDemo: row.is_demo === 1,
      comments,
    });
  }

  return posts;
}

export async function getPostOwner(db, postId) {
  return db.getFirstAsync(
    'SELECT user_id as userId, username, image_uri as imageUri FROM posts WHERE id = ?',
    [postId]
  );
}

export async function togglePostLike(db, postId, username) {
  const existing = await db.getFirstAsync(
    'SELECT 1 FROM post_likes WHERE post_id = ? AND username = ?',
    [postId, username]
  );

  if (existing) {
    await db.runAsync(
      'DELETE FROM post_likes WHERE post_id = ? AND username = ?',
      [postId, username]
    );
    await db.runAsync(
      'UPDATE posts SET likes_count = CASE WHEN likes_count - 1 < 0 THEN 0 ELSE likes_count - 1 END WHERE id = ?',
      [postId]
    );
    return false;
  }

  await db.runAsync(
    'INSERT INTO post_likes (post_id, username) VALUES (?, ?)',
    [postId, username]
  );
  await db.runAsync(
    'UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?',
    [postId]
  );
  return true;
}

export async function addComment(db, postId, username, text) {
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    'INSERT INTO comments (id, post_id, username, text, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, postId, username, text.trim(), createdAt]
  );

  return { id, username, text: text.trim(), createdAt };
}

export async function deleteDemoPosts(db) {
  await db.runAsync('DELETE FROM posts WHERE is_demo = 1');
}
