import { useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { SocialProvider, useSocial } from './src/context/SocialContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import CameraScreen from './src/screens/CameraScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import BiometriaScreen from './src/screens/BiometriaScreen';
import JurosScreen from './src/screens/JurosScreen';
import MapScreen from './src/screens/MapScreen';
import TodoScreen from './src/screens/TodoScreen';
import DMScreen from './src/screens/DMScreen';
import ChatScreen from './src/screens/ChatScreen';
import ActivitiesScreen from './src/screens/ActivitiesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StoryViewerScreen from './src/screens/StoryViewerScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  const { colors } = useTheme();

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
          } else if (route.name === 'ExploreTab') {
            iconName = focused ? 'compass' : 'compass-outline';
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
      <Tab.Screen name="ExploreTab" component={ExploreScreen} />
      <Tab.Screen name="CameraTab" component={CameraScreen} />
      <Tab.Screen name="PerfilTab" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, authReady } = useSocial();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!authReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Home" component={Tabs} />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="StoryViewer"
              component={StoryViewerScreen}
              options={{ animation: 'fade', presentation: 'fullScreenModal' }}
            />
            <Stack.Screen name="Activities" component={ActivitiesScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="DM" component={DMScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Biometria" component={BiometriaScreen} />
            <Stack.Screen name="Juros" component={JurosScreen} />
            <Stack.Screen name="Mapa" component={MapScreen} />
            <Stack.Screen name="Todo" component={TodoScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </>
  );
}

function ThemedNavigation() {
  const { colors, isDark } = useTheme();

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [colors, isDark]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SocialProvider>
          <ThemedNavigation />
        </SocialProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
  });
}
