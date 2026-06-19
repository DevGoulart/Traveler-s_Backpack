import * as settingsRepo from './settingsRepository';
import * as authRepo from './authRepository';

export async function getProfile(db) {
  const sessionUser = await authRepo.getSessionUser(db);

  if (sessionUser) {
    return {
      userId: sessionUser.id,
      username: sessionUser.displayName,
      bio: sessionUser.bio || '',
      avatarUri: sessionUser.avatarUri || null,
    };
  }

  const [username, bio, avatarUri] = await Promise.all([
    settingsRepo.getSetting(db, 'current_user'),
    settingsRepo.getSetting(db, 'user_bio'),
    settingsRepo.getSetting(db, 'profile_photo_uri'),
  ]);

  return {
    userId: null,
    username: username || null,
    bio: bio || '',
    avatarUri: avatarUri || null,
  };
}

export async function updateUserProfile(db, { userId, oldUsername, newUsername, bio, avatarUri }) {
  const trimmedName = newUsername.trim();
  const oldUserId = userId || oldUsername?.toLowerCase();
  const newUserId = userId || trimmedName.toLowerCase();

  await db.withTransactionAsync(async () => {
    if (oldUsername && oldUsername !== trimmedName) {
      await db.runAsync(
        'UPDATE posts SET username = ?, user_id = ? WHERE user_id = ? OR username = ?',
        [trimmedName, newUserId, oldUserId, oldUsername]
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
        'UPDATE story_items SET username = ?, user_id = ? WHERE user_id = ? OR username = ?',
        [trimmedName, newUserId, oldUserId, oldUsername]
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

    if (userId) {
      await authRepo.updateUserRecord(db, {
        userId,
        displayName: trimmedName,
        bio: bio ?? '',
        avatarUri: avatarUri ?? null,
      });
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
