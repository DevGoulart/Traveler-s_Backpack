import * as LocalAuthentication from 'expo-local-authentication';
import { View, Button, Alert } from 'react-native';

export default function BiometriaScreen() {
  const autenticar = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autentique-se',
    });

    if (result.success) {
      Alert.alert('Sucesso', 'Autenticado!');
    } else {
      Alert.alert('Erro', 'Falhou');
    }
  };

  return (
    <View style={{ marginTop: 50 }}>
      <Button title="Autenticar" onPress={autenticar} />
    </View>
  );
}