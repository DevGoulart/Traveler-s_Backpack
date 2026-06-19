export function buildPostFromShareMessage(message, posts = []) {
  if (message.postId) {
    const existing = posts.find((p) => p.id === message.postId);
    if (existing) return existing;
  }

  return {
    id: message.postId || `share-${message.id}`,
    userId: null,
    username: message.postUsername || 'Usuário',
    imageUri: message.postImageUri,
    uri: message.postImageUri,
    description: message.postDescription || '',
    location: null,
    likes: 0,
    liked: false,
    saved: false,
    comments: [],
    createdAt: message.createdAt,
  };
}
