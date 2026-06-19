export async function getAllTodos(db) {
  return db.getAllAsync(
    'SELECT id, text, completed, created_at as createdAt FROM todos ORDER BY datetime(created_at) DESC'
  );
}

export async function createTodo(db, text) {
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    'INSERT INTO todos (id, text, completed, created_at) VALUES (?, ?, 0, ?)',
    [id, text.trim(), createdAt]
  );

  return { id, text: text.trim(), completed: 0, createdAt };
}

export async function toggleTodo(db, id) {
  await db.runAsync(
    'UPDATE todos SET completed = CASE WHEN completed = 1 THEN 0 ELSE 1 END WHERE id = ?',
    [id]
  );
}

export async function deleteTodo(db, id) {
  await db.runAsync('DELETE FROM todos WHERE id = ?', [id]);
}
