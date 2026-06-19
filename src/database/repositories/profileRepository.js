import * as settingsRepo from './settingsRepository';

export async function getProfile(db) {
  const [username, bio, avatarUri] = await Promise.all([
    settingsRepo.getSetting(db, 'current_user'),
    settingsRepo.getSetting(db, 'user_bio'),
    settingsRepo.getSetting(db, 'profile_photo_uri'),
  ]);

  return {
    username: username || null,
    bio: bio || '',
    avatarUri: avatarUri || null,
  };
}

export async function updateUserProfile(db, { oldUsername, newUsername, bio, avatarUri }) {
  const trimmedName = newUsername.trim();
  const oldUserId = oldUsername?.toLowerCase();
  const newUserId = trimmedName.toLowerCase();

  await db.withTransactionAsync(async () => {
    if (oldUsername && oldUsername !== trimmedName) {
      await db.runAsync(
        'UPDATE posts SET username = ?, user_id = ? WHERE username = ? OR user_id = ?',
        [trimmedName, newUserId, oldUsername, oldUserId]
      );

      await db.runAsync(
        'UPDATE comments SET username = ? WHERE username = ?',
        [trimmedName, oldUsername]
      );

      await db.runAsync(
        'UPDATE post_likes SET username = ? WHERE username = ?',
        [trimmedName, oldUsername]
      );

      await db.runAsync(
        'UPDATE story_items SET username = ?, user_id = ? WHERE username = ? OR user_id = ?',
        [trimmedName, newUserId, oldUsername, oldUserId]
      );

      await db.runAsync(
        'UPDATE story_views SET viewer_username = ? WHERE viewer_username = ?',
        [trimmedName, oldUsername]
      );

      if (oldUserId !== newUserId) {
        await db.runAsync(
          'UPDATE story_views SET user_id = ? WHERE user_id = ?',
          [newUserId, oldUserId]
        );
      }
    }

    await settingsRepo.setSetting(db, 'current_user', trimmedName);

    if (bio !== undefined) {
      if (bio) {
        await settingsRepo.setSetting(db, 'user_bio', bio);
      } else {
        await settingsRepo.removeSetting(db, 'user_bio');
      }
    }

    if (avatarUri !== undefined) {
      if (avatarUri) {
        await settingsRepo.setSetting(db, 'profile_photo_uri', avatarUri);
      } else {
        await settingsRepo.removeSetting(db, 'profile_photo_uri');
      }
    }
  });
}
