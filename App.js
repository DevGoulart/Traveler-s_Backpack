import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SocialProvider } from './src/context/SocialContext';
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import LoginScreen from './src/screens/LoginScreen';
import BiometriaScreen from './src/screens/BiometriaScreen';
import JurosScreen from './src/screens/JurosScreen';
import MapScreen from './src/screens/MapScreen';
import TodoScreen from './src/screens/TodoScreen';
import StoryViewerScreen from './src/screens/StoryViewerScreen';
import colors from './src/theme/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 56,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CameraTab') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'PerfilTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="CameraTab" component={CameraScreen} />
      <Tab.Screen name="PerfilTab" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SocialProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Home" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="StoryViewer"
              component={StoryViewerScreen}
              options={{ headerShown: false, animation: 'fade', presentation: 'fullScreenModal' }}
            />
            <Stack.Screen name="Biometria" component={BiometriaScreen} />
            <Stack.Screen name="Juros" component={JurosScreen} />
            <Stack.Screen name="Mapa" component={MapScreen} />
            <Stack.Screen name="Todo" component={TodoScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SocialProvider>
    </SafeAreaProvider>
  );
}
