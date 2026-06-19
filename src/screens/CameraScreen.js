import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSocial } from '../context/SocialContext';
import { loadCameraHistory, saveCameraPhoto } from '../storage/socialStorage';
import { useTheme } from '../context/ThemeContext';
import { useAppInsets } from '../hooks/useAppInsets';
import spacing from '../theme/spacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_HISTORY_ITEMS = 10;
const MODES = [
  { id: 'story', label: 'STORY' },
  { id: 'post', label: 'POST' },
];

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const navigation = useNavigation();
  const { top, bottomPadding, tabBarBaseHeight } = useAppInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [permission, requestPermission] = useCameraPermissions();
  const [history, setHistory] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [publishMode, setPublishMode] = useState('post');
  const [caption, setCaption] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [capturing, setCapturing] = useState(false);

  const { currentUser, addPost, addStory } = useSocial();

  const bottomControlsPadding = bottomPadding + spacing.lg;

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (!parent) return undefined;

      parent.setOptions({ tabBarStyle: { display: 'none' } });

      return () => {
        parent.setOptions({
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: tabBarBaseHeight + bottomPadding,
            paddingBottom: bottomPadding,
            paddingTop: spacing.sm,
          },
        });
      };
    }, [navigation, colors, bottomPadding, tabBarBaseHeight])
  );

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
            locationShort: entry.locationShort || null,
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
        setHistory(normalizeHistory(stored));
      } catch {
        setHistory([]);
      }
    };

    loadHistory();
  }, []);

  const openPreview = (photo) => {
    setSelectedPhoto(photo);
    setCaption('');
    setPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setCaption('');
  };

  const takePhoto = async () => {
    if (!cameraRef.current || capturing) return;

    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
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
      setHistory(updatedHistory);
      await saveCameraPhoto(newItem);
      openPreview(newItem);
    } catch {
      Alert.alert('Erro', 'Falha ao tirar a foto. Verifique as permissões da câmera.');
    } finally {
      setCapturing(false);
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

      closePreview();
      Alert.alert('Publicado!', publishMode === 'story' ? 'Seu story foi adicionado.' : 'Seu post foi compartilhado.');
    } catch {
      Alert.alert('Erro', 'Não foi possível publicar. Tente novamente.');
    } finally {
      setPublishing(false);
    }
  };

  const cycleFlash = () => {
    setFlash((current) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const flashIcon = flash === 'on' ? 'flash' : flash === 'auto' ? 'flash-outline' : 'flash-off-outline';

  if (!permission) {
    return <View style={styles.blackScreen} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#fff" />
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

  if (previewVisible && selectedPhoto) {
    return (
      <View style={styles.blackScreen}>
        <Image source={{ uri: selectedPhoto.uri }} style={styles.previewImage} resizeMode="cover" />

        <View style={[styles.previewTopBar, { paddingTop: top + spacing.sm }]}>
          <Pressable onPress={closePreview} hitSlop={12} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </Pressable>
          <Text style={styles.previewTitle}>
            {publishMode === 'story' ? 'Novo story' : 'Nova publicação'}
          </Text>
          <View style={styles.iconButton} />
        </View>

        <View style={[styles.previewBottom, { paddingBottom: bottomControlsPadding }]}>
          {publishMode === 'post' && (
            <TextInput
              style={styles.captionInput}
              placeholder="Escreva uma legenda..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
            />
          )}

          {selectedPhoto.locationShort ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#fff" />
              <Text style={styles.locationText} numberOfLines={1}>
                {selectedPhoto.locationShort}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.shareButton, publishing && styles.shareButtonDisabled]}
            onPress={publishPhoto}
            disabled={publishing}
          >
            {publishing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.shareButtonText}>
                {publishMode === 'story' ? 'Compartilhar no story' : 'Compartilhar'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.blackScreen}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
      />

      <View style={[styles.topOverlay, { paddingTop: top + spacing.sm }]}>
        <View style={styles.topSpacer} />
        <View style={styles.topActions}>
          <Pressable onPress={cycleFlash} hitSlop={12} style={styles.iconButton}>
            <Ionicons name={flashIcon} size={26} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            hitSlop={12}
            style={styles.iconButton}
          >
            <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={[styles.bottomOverlay, { paddingBottom: bottomControlsPadding }]}>
        <View style={styles.modeRow}>
          {MODES.map((mode) => (
            <Pressable
              key={mode.id}
              onPress={() => setPublishMode(mode.id)}
              style={styles.modeItem}
            >
              <Text
                style={[
                  styles.modeLabel,
                  publishMode === mode.id && styles.modeLabelActive,
                ]}
              >
                {mode.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.controlsRow}>
          <Pressable
            style={styles.galleryButton}
            onPress={() => history[0] && openPreview(history[0])}
            disabled={history.length === 0}
          >
            {history[0] ? (
              <Image source={{ uri: history[0].uri }} style={styles.galleryThumb} />
            ) : (
              <View style={styles.galleryPlaceholder}>
                <Ionicons name="images-outline" size={22} color="rgba(255,255,255,0.5)" />
              </View>
            )}
          </Pressable>

          <Pressable
            style={styles.captureOuter}
            onPress={takePhoto}
            disabled={capturing}
          >
            <View style={[styles.captureInner, capturing && styles.captureInnerActive]} />
          </Pressable>

          <Pressable
            style={styles.flipButton}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            hitSlop={8}
          >
            <Ionicons name="sync-outline" size={28} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    blackScreen: {
      flex: 1,
      backgroundColor: '#000',
    },
    camera: {
      ...StyleSheet.absoluteFillObject,
    },
    topOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      zIndex: 10,
    },
    topSpacer: {
      width: 80,
    },
    topActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
    },
    iconButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottomOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    modeRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xl,
      marginBottom: spacing.lg,
    },
    modeItem: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    modeLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.45)',
      letterSpacing: 0.5,
    },
    modeLabelActive: {
      color: '#fff',
      fontWeight: '800',
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xxl,
    },
    galleryButton: {
      width: 44,
      height: 44,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: '#fff',
    },
    galleryThumb: {
      width: '100%',
      height: '100%',
    },
    galleryPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    captureOuter: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 4,
      borderColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    captureInner: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#fff',
    },
    captureInnerActive: {
      opacity: 0.6,
      transform: [{ scale: 0.92 }],
    },
    flipButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewImage: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    },
    previewTopBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    previewTitle: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '700',
    },
    previewBottom: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      backgroundColor: 'rgba(0,0,0,0.55)',
      gap: spacing.md,
    },
    captionInput: {
      color: '#fff',
      fontSize: 16,
      minHeight: 44,
      maxHeight: 100,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255,255,255,0.3)',
      paddingVertical: spacing.sm,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    locationText: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: 13,
      flex: 1,
    },
    shareButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md + 2,
      borderRadius: 10,
      alignItems: 'center',
    },
    shareButtonDisabled: {
      opacity: 0.7,
    },
    shareButtonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
    permissionContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xxl,
      backgroundColor: '#000',
      gap: spacing.md,
    },
    permissionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#fff',
    },
    permissionText: {
      fontSize: 15,
      color: 'rgba(255,255,255,0.7)',
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
}
