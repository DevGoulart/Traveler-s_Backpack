export async function countActivities(db) {
  const row = await db.getFirstAsync('SELECT COUNT(*) as count FROM activities');
  return row?.count ?? 0;
}

export async function createActivity(db, activity) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await db.runAsync(
    `INSERT INTO activities
      (id, user_id, actor_username, actor_user_id, activity_type, post_id, post_image_uri, text, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      id,
      activity.userId,
      activity.actorUsername,
      activity.actorUserId || null,
      activity.type,
      activity.postId || null,
      activity.postImageUri || null,
      activity.text || null,
      new Date().toISOString(),
    ]
  );
  return id;
}

export async function getActivitiesForUser(db, userId) {
  const rows = await db.getAllAsync(
    `SELECT id, user_id as userId, actor_username as actorUsername,
            actor_user_id as actorUserId, activity_type as type,
            post_id as postId, post_image_uri as postImageUri,
            text, is_read as isRead, created_at as createdAt
     FROM activities
     WHERE user_id = ?
     ORDER BY datetime(created_at) DESC`,
    [userId]
  );

  return rows.map((row) => ({
    ...row,
    isRead: row.isRead === 1,
  }));
}

export async function getUnreadCount(db, userId) {
  const row = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM activities WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return row?.count ?? 0;
}

export async function markAllAsRead(db, userId) {
  await db.runAsync(
    'UPDATE activities SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [userId]
  );
}

export async function seedDemoActivities(db) {
  const count = await countActivities(db);
  if (count > 0) return;

  const admin = await db.getFirstAsync('SELECT id FROM users WHERE id = ?', ['user-admin']);
  if (!admin) return;

  const demoPost = await db.getFirstAsync(
    'SELECT id, image_uri FROM posts ORDER BY datetime(created_at) DESC LIMIT 1'
  );

  const now = Date.now();
  const seeds = [
    {
      userId: admin.id,
      actorUsername: 'Maria',
      type: 'like',
      postId: demoPost?.id || null,
      postImageUri: demoPost?.image_uri || null,
      createdAt: new Date(now - 3600000 * 2).toISOString(),
    },
    {
      userId: admin.id,
      actorUsername: 'Pedro',
      type: 'comment',
      postId: demoPost?.id || null,
      postImageUri: demoPost?.image_uri || null,
      text: 'Que viagem incrível! Quero ir também!',
      createdAt: new Date(now - 3600000 * 5).toISOString(),
    },
    {
      userId: admin.id,
      actorUsername: 'Ana',
      type: 'like',
      postId: demoPost?.id || null,
      postImageUri: demoPost?.image_uri || null,
      createdAt: new Date(now - 3600000 * 24).toISOString(),
    },
  ];

  for (const seed of seeds) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await db.runAsync(
      `INSERT INTO activities
        (id, user_id, actor_username, actor_user_id, activity_type, post_id, post_image_uri, text, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        id,
        seed.userId,
        seed.actorUsername,
        null,
        seed.type,
        seed.postId,
        seed.postImageUri,
        seed.text || null,
        seed.createdAt,
      ]
    );
  }
}
