// Definir variáveis globais necessárias para React Native
global.__DEV__ = true;

// Mock de react-native Dimensions e StyleSheet
jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn((dimension) => {
      if (dimension === 'window') {
        return { width: 375, height: 812 };
      }
      if (dimension === 'screen') {
        return { width: 375, height: 812 };
      }
      return { width: 0, height: 0 };
    }),
    addEventListener: jest.fn(() => jest.fn()),
    removeEventListener: jest.fn(() => jest.fn()),
  },
  StyleSheet: {
    create: jest.fn((styles) => styles),
    hairlineWidth: 1,
    absoluteFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    },
  },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  TouchableOpacity: 'TouchableOpacity',
  TouchableHighlight: 'TouchableHighlight',
  TextInput: 'TextInput',
  Button: 'Button',
  Image: 'Image',
  ActivityIndicator: 'ActivityIndicator',
  Alert: {
    alert: jest.fn(),
  },
  RefreshControl: 'RefreshControl',
  Pressable: 'Pressable',
}));

// Mock de react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
  SafeAreaProvider: ({ children }) => children,
}));

// Mock de @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

// Mock de expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  authenticateAsync: jest.fn(async () => ({ success: true })),
}));

// Mock de expo-crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(async () => 'mocked-hash'),
  randomUUID: jest.fn(() => 'mocked-uuid'),
}));

// Mock de expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => ({
    execAsync: jest.fn(async () => null),
    runAsync: jest.fn(async () => ({ lastInsertRowid: 1, changes: 1 })),
    allAsync: jest.fn(async () => []),
    getFirstAsync: jest.fn(async () => null),
  })),
}));

// Mock de @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock de @react-navigation/bottom-tabs
jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: () => null,
  }),
}));

// Mock de @react-navigation/native-stack
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: () => null,
  }),
}));

// Mock de SocialContext
jest.mock('../src/context/SocialContext', () => ({
  useSocial: () => ({
    login: jest.fn(),
    restoreBiometric: jest.fn(),
    user: null,
  }),
  SocialProvider: ({ children }) => children,
}), { virtual: true });

// Mock de ThemeContext
jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    colors: {},
  }),
  ThemeProvider: ({ children }) => children,
}), { virtual: true });

// Mock de expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {},
  },
}));

// Mock de expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: true })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: {
      latitude: 0,
      longitude: 0,
    },
  })),
  watchPositionAsync: jest.fn(async () => ({})),
}));

// Mock de expo-camera
jest.mock('expo-camera', () => ({
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
  CameraView: 'Camera',
}));

// Mock de expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => ({
    assets: [{ uri: 'file://image.jpg' }],
    cancelled: false,
  })),
  launchCameraAsync: jest.fn(async () => ({
    assets: [{ uri: 'file://image.jpg' }],
    cancelled: false,
  })),
}));

// Mock de AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => null),
  removeItem: jest.fn(async () => null),
  clear: jest.fn(async () => null),
}));

// Mock de react-native-maps
jest.mock('react-native-maps', () => ({
  MapView: 'MapView',
  Marker: 'Marker',
}));

// Mock de socialStorage (banco de dados local)
jest.mock('../src/storage/socialStorage', () => ({
  loadPosts: jest.fn(async () => []),
  loadStories: jest.fn(async () => []),
  loadTodos: jest.fn(async () => []),
  createPost: jest.fn(async () => null),
  createStory: jest.fn(async () => null),
  createTodo: jest.fn(async () => null),
  toggleTodo: jest.fn(async () => null),
  deleteTodo: jest.fn(async () => null),
}), { virtual: true });

// Mock de database/init
jest.mock('../src/database/init', () => ({
  initDatabase: jest.fn(async () => null),
}), { virtual: true });

// Suprimir avisos de console durante testes
global.console.warn = jest.fn();
global.console.error = jest.fn();
