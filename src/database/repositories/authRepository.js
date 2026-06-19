import * as Crypto from 'expo-crypto';
import * as settingsRepo from './settingsRepository';

const SALT = 'travelers_backpack_v1';

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    login: row.login,
    displayName: row.display_name,
    bio: row.bio || '',
    avatarUri: row.avatar_uri || null,
  };
}

export async function hashPassword(password) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${SALT}:${password}`
  );
}

export async function getUserById(db, userId) {
  const row = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [userId]);
  return mapUser(row);
}

export async function getUserByLogin(db, login) {
  const row = await db.getFirstAsync('SELECT * FROM users WHERE login = ?', [login.trim().toLowerCase()]);
  return mapUser(row);
}

export async function getSessionUserId(db) {
  return settingsRepo.getSetting(db, 'session_user_id');
}

export async function getSessionUser(db) {
  const userId = await getSessionUserId(db);
  if (!userId) return null;
  return getUserById(db, userId);
}

export async function setSessionUserId(db, userId) {
  await settingsRepo.setSetting(db, 'session_user_id', userId);
  const user = await getUserById(db, userId);
  if (user) {
    await settingsRepo.setSetting(db, 'current_user', user.displayName);
    if (user.bio) {
      await settingsRepo.setSetting(db, 'user_bio', user.bio);
    }
    if (user.avatarUri) {
      await settingsRepo.setSetting(db, 'profile_photo_uri', user.avatarUri);
    }
  }
}

export async function clearSession(db) {
  await settingsRepo.removeSetting(db, 'session_user_id');
  await settingsRepo.removeSetting(db, 'current_user');
}

export async function registerUser(db, { login, displayName, password }) {
  const normalizedLogin = login.trim().toLowerCase();

  if (normalizedLogin.length < 3) {
    throw new Error('LOGIN_TOO_SHORT');
  }

  if (password.length < 4) {
    throw new Error('PASSWORD_TOO_SHORT');
  }

  const existing = await getUserByLogin(db, normalizedLogin);
  if (existing) {
    throw new Error('USER_EXISTS');
  }

  const id = Date.now().toString();
  const passwordHash = await hashPassword(password);
  const name = displayName.trim() || login.trim();

  await db.runAsync(
    `INSERT INTO users (id, login, display_name, password_hash, bio, avatar_uri, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, normalizedLogin, name, passwordHash, 'Explorador 🌍 | Compartilhando aventuras pelo mundo', null, new Date().toISOString()]
  );

  await setSessionUserId(db, id);
  await enableBiometricForUser(db, id);
  return getUserById(db, id);
}

export async function loginUser(db, { login, password }) {
  const normalizedLogin = login.trim().toLowerCase();
  const row = await db.getFirstAsync('SELECT * FROM users WHERE login = ?', [normalizedLogin]);

  if (!row) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const passwordHash = await hashPassword(password);
  if (row.password_hash !== passwordHash) {
    throw new Error('INVALID_CREDENTIALS');
  }

  await setSessionUserId(db, row.id);
  await enableBiometricForUser(db, row.id);
  return mapUser(row);
}

export async function seedDefaultUsers(db) {
  const row = await db.getFirstAsync('SELECT COUNT(*) as count FROM users');
  if ((row?.count ?? 0) > 0) return;

  const passwordHash = await hashPassword('123');
  await db.runAsync(
    `INSERT INTO users (id, login, display_name, password_hash, bio, avatar_uri, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'user-admin',
      'admin',
      'Admin',
      passwordHash,
      'Explorador 🌍 | Compartilhando aventuras pelo mundo',
      null,
      new Date().toISOString(),
    ]
  );
}

export async function updateUserRecord(db, { userId, displayName, bio, avatarUri }) {
  await db.runAsync(
    'UPDATE users SET display_name = ?, bio = ?, avatar_uri = ? WHERE id = ?',
    [displayName, bio || '', avatarUri || null, userId]
  );
}

export async function enableBiometricForUser(db, userId) {
  await settingsRepo.setSetting(db, 'biometric_user_id', userId);
}

export async function restoreBiometricSession(db) {
  const userId = await settingsRepo.getSetting(db, 'biometric_user_id');
  if (!userId) {
    throw new Error('NO_BIOMETRIC_USER');
  }

  const user = await getUserById(db, userId);
  if (!user) {
    throw new Error('NO_BIOMETRIC_USER');
  }

  await setSessionUserId(db, userId);
  return user;
}
