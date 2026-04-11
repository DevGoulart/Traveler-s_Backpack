import { useState } from 'react';
import { View, TextInput, Button, FlatList, Text, Pressable, StyleSheet } from 'react-native';

export default function TodoScreen() {
  const [task, setTask] = useState('');
  const [list, setList] = useState([]);

  const addTask = () => {
    const trimmedTask = task.trim();

    if (!trimmedTask) {
      return;
    }

    setList([...list, { id: Date.now().toString(), text: trimmedTask, completed: false }]);
    setTask('');
  };

  const toggleTask = (id) => {
    setList(
      list.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={task}
        onChangeText={setTask}
        placeholder="Nova tarefa"
        style={styles.input}
      />
      <Button title="Adicionar" onPress={addTask} />

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => toggleTask(item.id)}>
            <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
              {item.completed ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
            <Text style={[styles.itemText, item.completed && styles.itemTextCompleted]}>
              {item.text}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
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
});