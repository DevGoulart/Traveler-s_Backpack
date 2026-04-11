import { View, Text, FlatList, Image, StyleSheet } from 'react-native';

const posts = [
  {
    id: '1',
    user: 'João',
    image: 'https://picsum.photos/500/500',
    description: 'Curtindo o dia 😎'
  },
  {
    id: '2',
    user: 'Maria',
    image: 'https://picsum.photos/500/501',
    description: 'Olha essa paisagem!'
  },
];

export default function HomeScreen() {
  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.post}>
          <Text style={styles.user}>{item.user}</Text>
          <Image source={{ uri: item.image }} style={styles.image} />
          <Text style={styles.description}>{item.description}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  post: {
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  user: {
    fontWeight: 'bold',
    padding: 10,
  },
  image: {
    width: '100%',
    height: 300,
  },
  description: {
    padding: 10,
  },
});
