import { CameraView, useCameraPermissions } from 'expo-camera';
import { View, Text, Button } from 'react-native';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View>
        <Text>Permissão necessária</Text>
        <Button title="Permitir" onPress={requestPermission} />
      </View>
    );
  }

  return <CameraView style={{ flex: 1 }} />;
}