function sortParticipants(userIdA, userIdB) {
  return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}

function mapMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    messageType: row.message_type,
    text: row.text,
    postId: row.post_id,
    postImageUri: row.post_image_uri,
    postDescription: row.post_description,
    postUsername: row.post_username,
    createdAt: row.created_at,
  };
}

export async function getOrCreateConversation(db, userIdA, userIdB) {
  const [one, two] = sortParticipants(userIdA, userIdB);
  const existing = await db.getFirstAsync(
    'SELECT * FROM conversations WHERE participant_one_id = ? AND participant_two_id = ?',
    [one, two]
  );

  if (existing) return existing.id;

  const id = `conv-${Date.now()}`;
  await db.runAsync(
    'INSERT INTO conversations (id, participant_one_id, participant_two_id, updated_at) VALUES (?, ?, ?, ?)',
    [id, one, two, new Date().toISOString()]
  );

  return id;
}

export async function getConversationsForUser(db, currentUserId) {
  const rows = await db.getAllAsync(
    `SELECT c.*,
      CASE WHEN c.participant_one_id = ? THEN c.participant_two_id ELSE c.participant_one_id END as other_user_id
     FROM conversations c
     WHERE c.participant_one_id = ? OR c.participant_two_id = ?
     ORDER BY datetime(c.updated_at) DESC`,
    [currentUserId, currentUserId, currentUserId]
  );

  const conversations = [];

  for (const row of rows) {
    const otherUser = await db.getFirstAsync(
      'SELECT id, display_name, avatar_uri FROM users WHERE id = ?',
      [row.other_user_id]
    );

    const lastMessage = await db.getFirstAsync(
      `SELECT * FROM messages WHERE conversation_id = ? ORDER BY datetime(created_at) DESC LIMIT 1`,
      [row.id]
    );

    conversations.push({
      id: row.id,
      otherUser: otherUser
        ? {
            id: otherUser.id,
            displayName: otherUser.display_name,
            avatarUri: otherUser.avatar_uri || null,
          }
        : { id: row.other_user_id, displayName: 'Usuário', avatarUri: null },
      lastMessage: lastMessage ? mapMessage(lastMessage) : null,
      updatedAt: row.updated_at,
    });
  }

  return conversations;
}

export async function getMessages(db, conversationId) {
  const rows = await db.getAllAsync(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY datetime(created_at) ASC',
    [conversationId]
  );

  return rows.map(mapMessage);
}

export async function sendTextMessage(db, conversationId, senderId, text) {
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO messages (id, conversation_id, sender_id, message_type, text, created_at)
     VALUES (?, ?, ?, 'text', ?, ?)`,
    [id, conversationId, senderId, text.trim(), createdAt]
  );

  await db.runAsync(
    'UPDATE conversations SET updated_at = ? WHERE id = ?',
    [createdAt, conversationId]
  );

  return mapMessage({
    id,
    conversation_id: conversationId,
    sender_id: senderId,
    message_type: 'text',
    text: text.trim(),
    post_id: null,
    post_image_uri: null,
    post_description: null,
    post_username: null,
    created_at: createdAt,
  });
}

export async function sendPostShare(db, conversationId, senderId, post) {
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();
  const previewText = `Compartilhou um post de ${post.username}`;

  await db.runAsync(
    `INSERT INTO messages
      (id, conversation_id, sender_id, message_type, text, post_id, post_image_uri, post_description, post_username, created_at)
     VALUES (?, ?, ?, 'post_share', ?, ?, ?, ?, ?, ?)`,
    [
      id,
      conversationId,
      senderId,
      previewText,
      post.id,
      post.imageUri || post.uri,
      post.description || '',
      post.username,
      createdAt,
    ]
  );

  await db.runAsync(
    'UPDATE conversations SET updated_at = ? WHERE id = ?',
    [createdAt, conversationId]
  );

  return mapMessage({
    id,
    conversation_id: conversationId,
    sender_id: senderId,
    message_type: 'post_share',
    text: previewText,
    post_id: post.id,
    post_image_uri: post.imageUri || post.uri,
    post_description: post.description,
    post_username: post.username,
    created_at: createdAt,
  });
}

export async function getConversationById(db, conversationId, currentUserId) {
  const row = await db.getFirstAsync(
    'SELECT * FROM conversations WHERE id = ?',
    [conversationId]
  );

  if (!row) return null;

  const otherUserId =
    row.participant_one_id === currentUserId
      ? row.participant_two_id
      : row.participant_one_id;

  const otherUser = await db.getFirstAsync(
    'SELECT id, display_name, avatar_uri FROM users WHERE id = ?',
    [otherUserId]
  );

  return {
    id: row.id,
    otherUser: otherUser
      ? {
          id: otherUser.id,
          displayName: otherUser.display_name,
          avatarUri: otherUser.avatar_uri || null,
        }
      : { id: otherUserId, displayName: 'Usuário', avatarUri: null },
  };
}
