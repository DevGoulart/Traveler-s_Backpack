import { useState } from 'react';
import { View, TextInput, Button, FlatList, Text } from 'react-native';

export default function TodoScreen() {
  const [task, setTask] = useState('');
  const [list, setList] = useState([]);

  const addTask = () => {
    setList([...list, { id: Date.now().toString(), text: task }]);
    setTask('');
  };

  return (
    <View style={{ marginTop: 50 }}>
      <TextInput value={task} onChangeText={setTask} placeholder="Nova tarefa" />
      <Button title="Adicionar" onPress={addTask} />

      <FlatList
        data={list}
        renderItem={({ item }) => <Text>{item.text}</Text>}
      />
    </View>
  );
}