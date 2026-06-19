import { useEffect, useState, useMemo } from 'react';
import { View, TextInput, Button, FlatList, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadTodos, createTodo, toggleTodo, deleteTodo } from '../storage/socialStorage';
import { useTheme } from '../context/ThemeContext';

export default function TodoScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [task, setTask] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodos()
      .then((items) => {
        setList(items.map((item) => ({ ...item, completed: !!item.completed })));
      })
      .finally(() => setLoading(false));
  }, []);

  const addTask = async () => {
    const trimmedTask = task.trim();
    if (!trimmedTask) return;

    const newTodo = await createTodo(trimmedTask);
    setList((prev) => [{ ...newTodo, completed: false }, ...prev]);
    setTask('');
  };

  const toggleTask = async (id) => {
    await toggleTodo(id);
    setList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const deleteTaskItem = async (id) => {
    await deleteTodo(id);
    setList((prev) => prev.filter((item) => item.id !== id));
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        value={task}
        onChangeText={setTask}
        placeholder="Nova tarefa"
        style={styles.input}
      />
      <Button title="Adicionar" onPress={addTask} color={colors.primary} />

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Pressable style={styles.itemMain} onPress={() => toggleTask(item.id)}>
              <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
                {item.completed ? <Text style={styles.checkboxMark}>✓</Text> : null}
              </View>
              <Text style={[styles.itemText, item.completed && styles.itemTextCompleted]}>
                {item.text}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => deleteTaskItem(item.id)}
              style={styles.deleteButton}
              accessibilityRole="button"
              accessibilityLabel="Excluir tarefa"
            >
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    marginTop: 50,
    paddingHorizontal: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  list: {
    paddingTop: 16,
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  itemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  checkboxMark: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 16,
  },
  itemText: {
    fontSize: 16,
    color: '#0f172a',
  },
  itemTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  deleteButton: {
    marginLeft: 10,
    padding: 6,
    borderRadius: 8,
  },
  });
}
