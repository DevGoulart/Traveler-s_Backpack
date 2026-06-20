import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAppInsets } from '../hooks/useAppInsets';
import { isGoogleMapsConfigured } from '../config/googleMaps';
import { getCurrentPlace, resolvePlace, searchPlaces } from '../services/googlePlaces';
import spacing from '../theme/spacing';

export default function LocationPickerModal({
  visible,
  onClose,
  onSelect,
  initialLocation = null,
}) {
  const { top, bottomPadding } = useAppInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(initialLocation);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setResults([]);
    setError(null);
    setSelected(initialLocation);
  }, [visible, initialLocation]);

  useEffect(() => {
    if (!visible) return undefined;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const bias = initialLocation?.latitude && initialLocation?.longitude
          ? { latitude: initialLocation.latitude, longitude: initialLocation.longitude }
          : selected?.latitude && selected?.longitude
            ? { latitude: selected.latitude, longitude: selected.longitude }
            : {};

        const places = await searchPlaces(trimmed, bias);
        setResults(places);
        setError(null);
      } catch {
        setError('Não foi possível buscar locais.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, visible, initialLocation, selected]);

  const handleUseCurrentLocation = useCallback(async () => {
    setLoading(true);
    try {
      const place = await getCurrentPlace();
      if (!place) {
        setError('Permita o acesso à localização para usar esta opção.');
        return;
      }
      setSelected(place);
      setQuery(place.displayName);
      setResults([]);
      setError(null);
    } catch {
      setError('Não foi possível obter sua localização.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectPlace = async (place) => {
    setLoading(true);
    try {
      const resolved = await resolvePlace(place);
      setSelected(resolved);
      onSelect(resolved);
      onClose();
    } catch {
      setError('Não foi possível selecionar este local.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    onSelect(null);
    onClose();
  };

  const mapRegion = selected?.latitude && selected?.longitude
    ? {
        latitude: selected.latitude,
        longitude: selected.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: top }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Adicionar local</Text>
          <Pressable onPress={handleClear} hitSlop={12}>
            <Text style={styles.clearText}>Remover</Text>
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar locais..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        <Pressable style={styles.currentLocationRow} onPress={handleUseCurrentLocation}>
          <Ionicons name="navigate-outline" size={22} color={colors.primary} />
          <Text style={styles.currentLocationText}>Usar localização atual</Text>
        </Pressable>

        {!isGoogleMapsConfigured() && (
          <Text style={styles.apiHint}>
            Configure EXPO_PUBLIC_GOOGLE_MAPS_API_KEY para busca completa do Google Maps.
          </Text>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {mapRegion && isGoogleMapsConfigured() ? (
          <View style={styles.mapPreview}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Marker coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }} />
            </MapView>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
            contentContainerStyle={{ paddingBottom: bottomPadding + spacing.lg }}
            ListEmptyComponent={
              query.trim().length >= 2 ? (
                <Text style={styles.emptyText}>Nenhum local encontrado.</Text>
              ) : (
                <Text style={styles.emptyText}>Digite para buscar locais, cidades ou estabelecimentos.</Text>
              )
            }
            renderItem={({ item }) => (
              <Pressable style={styles.resultRow} onPress={() => handleSelectPlace(item)}>
                <View style={styles.resultIcon}>
                  <Ionicons name="location-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.resultBody}>
                  <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.resultAddress} numberOfLines={2}>{item.address}</Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    clearText: {
      color: colors.primary,
      fontWeight: '600',
      fontSize: 14,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      margin: spacing.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      paddingVertical: spacing.sm,
    },
    currentLocationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderLight,
    },
    currentLocationText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    apiHint: {
      fontSize: 12,
      color: colors.textSecondary,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    errorText: {
      color: colors.danger,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    mapPreview: {
      height: 160,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    map: {
      flex: 1,
    },
    loadingRow: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      textAlign: 'center',
      color: colors.textSecondary,
      paddingHorizontal: spacing.xxl,
      paddingTop: spacing.xl,
      lineHeight: 20,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderLight,
    },
    resultIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultBody: {
      flex: 1,
    },
    resultName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    resultAddress: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
      lineHeight: 18,
    },
  });
}
