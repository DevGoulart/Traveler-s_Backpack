import { View, Button } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={{ marginTop: 50 }}>
      <Button title="Biometria" onPress={() => navigation.navigate('Biometria')} />
      <Button title="Camera" onPress={() => navigation.navigate('Camera')} />
      <Button title="Mapa GPS" onPress={() => navigation.navigate('Mapa')} />
      <Button title="Juros" onPress={() => navigation.navigate('Juros')} />
      <Button title="ToDo" onPress={() => navigation.navigate('ToDo')} />
    </View>
  );
}