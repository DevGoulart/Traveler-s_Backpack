import { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';

export default function JurosScreen() {
  const [capital, setCapital] = useState('');
  const [taxa, setTaxa] = useState('');
  const [tempo, setTempo] = useState('');
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const res = capital * Math.pow(1 + taxa / 100, tempo);
    setResultado(res.toFixed(2));
  };

  return (
    <View style={{ marginTop: 50 }}>
      <TextInput placeholder="Capital" onChangeText={setCapital} />
      <TextInput placeholder="Taxa %" onChangeText={setTaxa} />
      <TextInput placeholder="Tempo" onChangeText={setTempo} />

      <Button title="Calcular" onPress={calcular} />

      {resultado && <Text>Resultado: {resultado}</Text>}
    </View>
  );
}