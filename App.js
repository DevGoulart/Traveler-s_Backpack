import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import BiometriaScreen from './src/screens/BiometriaScreen';
import CameraScreen from './src/screens/CameraScreen';
import MapScreen from './src/screens/MapScreen';
import JurosScreen from './src/screens/JurosScreen';
import TodoScreen from './src/screens/TodoScreen';
import LoginScreen from './src/screens/LoginScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
    
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Biometria" component={BiometriaScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Mapa" component={MapScreen} />
        <Stack.Screen name="Juros" component={JurosScreen} />
        <Stack.Screen name="ToDo" component={TodoScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
