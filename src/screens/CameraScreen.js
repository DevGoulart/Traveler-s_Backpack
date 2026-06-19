import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSocial } from '../context/SocialContext';
import { loadCameraHistory, saveCameraPhoto, clearCameraHistory as clearCameraHistoryDb } from '../storage/socialStorage';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

const MAX_HISTORY_ITEMS = 10;

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [history, setHistory] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [publishMode, setPublishMode] = useState('post');
  const [caption, setCaption] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [showPublishPanel, setShowPublishPanel] = useState(false);

  const { currentUser, addPost, addStory } = useSocial();

  const normalizeHistory = (items) => {
    if (!Array.isArray(items)) return [];

    return items
      .map((entry, index) => {
        if (typeof entry === 'string') {
          return {
            id: `legacy-${index}-${entry}`,
            uri: entry,
            description: 'Localização indisponível (foto antiga).',
            createdAt: null,
          };
        }

        if (entry?.uri) {
          return {
            id: entry.id || `${Date.now()}-${index}`,
            uri: entry.uri,
            description: entry.description || 'Localização indisponível.',
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
        return { full: 'Localização não autorizada pelo usuário.', short: null };
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
          return { full: `Local: ${address} (${latitude}, ${longitude})`, short: address };
        }
      }

      return { full: `Local: coordenadas ${latitude}, ${longitude}`, short: `${latitude}, ${longitude}` };
    } catch {
      return { full: 'Localização indisponível no momento da captura.', short: null };
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await loadCameraHistory();
        const normalized = normalizeHistory(stored);
        setHistory(normalized);
        if (normalized.length > 0) {
          setSelectedPhoto(normalized[0]);
        }
      } catch {
        setHistory([]);
      }
    };

    loadHistory();
  }, []);

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      const uri = photo?.uri;
      if (!uri) {
        Alert.alert('Erro', 'Não foi possível capturar a foto. Tente novamente.');
        return;
      }

      const location = await buildLocationDescription();
      const newItem = {
        id: Date.now().toString(),
        uri,
        description: location.full,
        locationShort: location.short,
        createdAt: new Date().toISOString(),
      };

      const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
      setSelectedPhoto(newItem);
      setHistory(updatedHistory);
      setShowPublishPanel(true);
      setCaption('');
      await saveCameraPhoto(newItem);
    } catch {
      Alert.alert('Erro', 'Falha ao tirar a foto. Verifique as permissões da câmera.');
    }
  };

  const publishPhoto = async () => {
    if (!selectedPhoto || publishing) return;

    const username = currentUser || 'Viajante';
    setPublishing(true);

    try {
      if (publishMode === 'story') {
        await addStory({
          userId: username.toLowerCase(),
          username,
          uri: selectedPhoto.uri,
        });
      } else {
        await addPost({
          userId: username.toLowerCase(),
          username,
          imageUri: selectedPhoto.uri,
          uri: selectedPhoto.uri,
          description: caption.trim() || 'Nova aventura! 🌍',
          location: selectedPhoto.locationShort,
        });
      }

      setShowPublishPanel(false);
      setCaption('');
      Alert.alert('Publicado!', publishMode === 'story' ? 'Seu story foi adicionado.' : 'Seu post foi compartilhado.');
    } catch {
      Alert.alert('Erro', 'Não foi possível publicar. Tente novamente.');
    } finally {
      setPublishing(false);
    }
  };

  const clearHistory = async () => {
    setHistory([]);
    setSelectedPhoto(null);
    setShowPublishPanel(false);
    await clearCameraHistoryDb();
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={colors.primary} />
        <Text style={styles.permissionTitle}>Acesso à câmera</Text>
        <Text style={styles.permissionText}>
          Permita o acesso para capturar fotos e compartilhar suas aventuras.
        </Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Permitir câmera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.topSection}>
        <Text style={styles.screenTitle}>Câmera</Text>

        <View style={styles.modeSelector}>
          <Pressable
            style={[styles.modeButton, publishMode === 'post' && styles.modeButtonActive]}
            onPress={() => setPublishMode('post')}
          >
            <Ionicons
              name="grid-outline"
              size={18}
              color={publishMode === 'post' ? '#fff' : colors.textSecondary}
            />
            <Text style={[styles.modeText, publishMode === 'post' && styles.modeTextActive]}>Post</Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, publishMode === 'story' && styles.modeButtonActive]}
            onPress={() => setPublishMode('story')}
          >
            <Ionicons
              name="ellipse-outline"
              size={18}
              color={publishMode === 'story' ? '#fff' : colors.textSecondary}
            />
            <Text style={[styles.modeText, publishMode === 'story' && styles.modeTextActive]}>Story</Text>
          </Pressable>
        </View>

        <View style={styles.cameraWrapper}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          <Pressable style={styles.captureButton} onPress={takePhoto}>
            <View style={styles.captureInner} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.bottomScroll}
        contentContainerStyle={styles.bottomContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {showPublishPanel && selectedPhoto ? (
          <View style={styles.publishPanel}>
            <Image source={{ uri: selectedPhoto.uri }} style={styles.publishPreview} />
            <View style={styles.publishContent}>
              <Text style={styles.publishTitle}>
                Publicar como {publishMode === 'story' ? 'Story' : 'Post'}
              </Text>
              {publishMode === 'post' && (
                <TextInput
                  style={styles.captionInput}
                  placeholder="Escreva uma legenda..."
                  placeholderTextColor={colors.textSecondary}
                  value={caption}
                  onChangeText={setCaption}
                  multiline
                />
              )}
              <View style={styles.publishActions}>
                <Pressable style={styles.cancelButton} onPress={() => setShowPublishPanel(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.publishButton} onPress={publishPhoto} disabled={publishing}>
                  {publishing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.publishButtonText}>Compartilhar</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Histórico recente</Text>
          {history.length > 0 && (
            <Pressable onPress={clearHistory}>
              <Text style={styles.clearText}>Limpar</Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.historyList}
        >
          {history.length === 0 ? (
            <Text style={styles.emptyHistory}>Nenhuma foto ainda</Text>
          ) : (
            history.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  setSelectedPhoto(item);
                  setShowPublishPanel(true);
                }}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={[
                    styles.previewImage,
                    selectedPhoto?.id === item.id && styles.previewImageSelected,
                  ]}
                />
              </Pressable>
            ))
          )}
        </ScrollView>

        {selectedPhoto && !showPublishPanel ? (
          <View style={styles.detailCard}>
            <Image source={{ uri: selectedPhoto.uri }} style={styles.detailImage} />
            <Text style={styles.detailTitle}>Localização</Text>
            <Text style={styles.detailDescription}>{selectedPhoto.description}</Text>
            {selectedPhoto.createdAt ? (
              <Text style={styles.detailDate}>
                Capturada em: {new Date(selectedPhoto.createdAt).toLocaleString()}
              </Text>
            ) : null}
            <Pressable
              style={styles.republishButton}
              onPress={() => setShowPublishPanel(true)}
            >
              <Text style={styles.republishText}>Publicar no feed</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topSection: {
    paddingHorizontal: spacing.lg,
  },
  bottomScroll: {
    flex: 1,
  },
  bottomContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeTextActive: {
    color: '#fff',
  },
  cameraWrapper: {
    height: 340,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  captureButton: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  publishPanel: {
    marginTop: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  publishPreview: {
    width: '100%',
    height: 200,
    backgroundColor: colors.borderLight,
  },
  publishContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  publishTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    color: colors.text,
    fontSize: 14,
  },
  publishActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  publishButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  publishButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  clearText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  historyList: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  emptyHistory: {
    color: colors.textSecondary,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: colors.borderLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  previewImageSelected: {
    borderColor: colors.primary,
  },
  detailCard: {
    marginTop: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  detailImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  detailDescription: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  detailDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  republishButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  republishText: {
    color: '#fff',
    fontWeight: '700',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  permissionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
