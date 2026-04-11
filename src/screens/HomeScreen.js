import { View, Text, FlatList, Image, StyleSheet } from 'react-native';

const posts = [
  {
    id: '1',
    user: 'João',
    image: require('../../assets/maranhenses.jpg'),
    description: 'Curtindo o dia 😎'
  },
  {
    id: '2',
    user: 'Maria',
    image: require('../../assets/rio.jpg'),
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
          <Image source={item.image} style={styles.image} />
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
