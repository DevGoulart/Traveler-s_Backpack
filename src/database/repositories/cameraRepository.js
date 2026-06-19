const MAX_HISTORY_ITEMS = 10;

export async function getCameraHistory(db) {
  const rows = await db.getAllAsync(
    'SELECT id, uri, description, location_short as locationShort, created_at as createdAt FROM camera_photos ORDER BY datetime(created_at) DESC LIMIT ?',
    [MAX_HISTORY_ITEMS]
  );
  return rows;
}

export async function insertPhoto(db, photo) {
  await db.runAsync(
    'INSERT OR REPLACE INTO camera_photos (id, uri, description, location_short, created_at) VALUES (?, ?, ?, ?, ?)',
    [
      photo.id,
      photo.uri,
      photo.description || null,
      photo.locationShort || null,
      photo.createdAt || new Date().toISOString(),
    ]
  );

  await trimHistory(db);
}

export async function trimHistory(db) {
  const rows = await db.getAllAsync(
    'SELECT id FROM camera_photos ORDER BY datetime(created_at) DESC'
  );

  if (rows.length <= MAX_HISTORY_ITEMS) return;

  const toDelete = rows.slice(MAX_HISTORY_ITEMS);
  for (const row of toDelete) {
    await db.runAsync('DELETE FROM camera_photos WHERE id = ?', [row.id]);
  }
}

export async function clearCameraHistory(db) {
  await db.runAsync('DELETE FROM camera_photos');
}

export async function saveCameraHistory(db, items) {
  await db.runAsync('DELETE FROM camera_photos');
  for (const item of items.slice(0, MAX_HISTORY_ITEMS)) {
    await insertPhoto(db, item);
  }
}
