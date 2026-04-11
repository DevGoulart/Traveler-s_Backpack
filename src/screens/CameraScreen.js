import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { View, Text, Button, StyleSheet, Image, FlatList, Pressable, ScrollView } from 'react-native';

const STORAGE_KEY = '@traveler_backpack_camera_history';
const MAX_HISTORY_ITEMS = 10;

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [lastPhotoUri, setLastPhotoUri] = useState('');
  const [history, setHistory] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const normalizeHistory = (items) => {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map((entry, index) => {
        if (typeof entry === 'string') {
          return {
            id: `legacy-${index}-${entry}`,
            uri: entry,
            description: 'Localizacao indisponivel (foto antiga).',
            createdAt: null,
          };
        }

        if (entry && typeof entry === 'object' && entry.uri) {
          return {
            id: entry.id || `${Date.now()}-${index}`,
            uri: entry.uri,
            description: entry.description || 'Localizacao indisponivel.',
            createdAt: entry.createdAt || null,
          };
        }

        return null;
      })
      .filter(Boolean);
  };

  const buildLocationDescription = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return 'Localizacao nao autorizada pelo usuario.';
      }

      const current = await Location.getCurrentPositionAsync({});
      const latitude = current.coords.latitude.toFixed(5);
      const longitude = current.coords.longitude.toFixed(5);

      const places = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });

      const place = places[0];
      if (place) {
        const street = [place.street, place.streetNumber].filter(Boolean).join(', ');
        const cityState = [place.city || place.subregion, place.region].filter(Boolean).join(' - ');
        const address = [street, cityState].filter(Boolean).join(' | ');

        if (address) {
          return `Local: ${address} (${latitude}, ${longitude})`;
        }
      }

      return `Local: coordenadas ${latitude}, ${longitude}`;
    } catch {
      return 'Localizacao indisponivel no momento da captura.';
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          return;
        }

        const parsed = JSON.parse(stored);
        const normalized = normalizeHistory(parsed);

        setHistory(normalized);
        if (normalized.length > 0) {
          setLastPhotoUri(normalized[0].uri);
          setSelectedPhoto(normalized[0]);
        }
      } catch {
        setHistory([]);
        setSelectedPhoto(null);
      }
    };

    loadHistory();
  }, []);

  const takePhoto = async () => {
    if (!cameraRef.current) {
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      const uri = photo?.uri;

      if (!uri) {
        return;
      }

      const description = await buildLocationDescription();
      const createdAt = new Date().toISOString();
      const newItem = {
        id: Date.now().toString(),
        uri,
        description,
        createdAt,
      };

      const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);

      setLastPhotoUri(uri);
      setSelectedPhoto(newItem);
      setHistory(updatedHistory);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch {
      // Silently ignore capture errors to keep UI responsive.
    }
  };

  const clearHistory = async () => {
    setHistory([]);
    setLastPhotoUri('');
    setSelectedPhoto(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Permissão da câmera necessária</Text>
        <Button title="Permitir" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.cameraWrapper}>
          <CameraView ref={cameraRef} style={styles.camera} />
        </View>

        <View style={styles.actions}>
          <Button title="Tirar foto" onPress={takePhoto} />
          <Button title="Limpar histórico" color="#b91c1c" onPress={clearHistory} />
        </View>

        {lastPhotoUri ? (
          <Text style={styles.lastPhotoText} numberOfLines={1}>
            Ultima foto salva: {lastPhotoUri}
          </Text>
        ) : (
          <Text style={styles.lastPhotoText}>Nenhuma foto salva ainda</Text>
        )}

        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          horizontal
          contentContainerStyle={styles.historyList}
          ListEmptyComponent={<Text style={styles.emptyHistory}>Historico vazio</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => setSelectedPhoto(item)}>
              <Image
                source={{ uri: item.uri }}
                style={[
                  styles.previewImage,
                  selectedPhoto?.id === item.id && styles.previewImageSelected,
                ]}
              />
            </Pressable>
          )}
        />

        {selectedPhoto ? (
          <View style={styles.detailCard}>
            <Image source={{ uri: selectedPhoto.uri }} style={styles.detailImage} />
            <Text style={styles.detailTitle}>Descricao</Text>
            <Text style={styles.detailDescription}>{selectedPhoto.description}</Text>
            {selectedPhoto.createdAt ? (
              <Text style={styles.detailDate}>
                Capturada em: {new Date(selectedPhoto.createdAt).toLocaleString()}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  permissionText: {
    fontSize: 16,
    color: '#0f172a',
  },
  cameraWrapper: {
    height: 360,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lastPhotoText: {
    marginTop: 12,
    color: '#334155',
  },
  historyList: {
    marginTop: 12,
    gap: 10,
    paddingBottom: 8,
  },
  emptyHistory: {
    color: '#64748b',
  },
  previewImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  previewImageSelected: {
    borderColor: '#16a34a',
  },
  detailCard: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 8,
  },
  detailImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  detailDescription: {
    color: '#1e293b',
  },
  detailDate: {
    color: '#475569',
    fontSize: 12,
  },
});