import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSocial } from '../context/SocialContext';
import { useTheme } from '../context/ThemeContext';
import { useAppInsets } from '../hooks/useAppInsets';
import { isGoogleMapsConfigured } from '../config/googleMaps';
import LocationPickerModal from '../components/LocationPickerModal';
import spacing from '../theme/spacing';

const DEFAULT_REGION = {
  latitude: -15.793889,
  longitude: -47.882778,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

export default function MapScreen() {
  const { top, bottomPadding } = useAppInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { posts } = useSocial();

  const [userLocation, setUserLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  const mappedPosts = useMemo(
    () => posts.filter((post) => post.locationLat != null && post.locationLng != null),
    [posts]
  );

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const position = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const mapRegion = useMemo(() => {
    if (selectedPlace?.latitude && selectedPlace?.longitude) {
      return {
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }
    if (userLocation) {
      return {
        ...userLocation,
        latitudeDelta: 0.35,
        longitudeDelta: 0.35,
      };
    }
    if (mappedPosts[0]) {
      return {
        latitude: mappedPosts[0].locationLat,
        longitude: mappedPosts[0].locationLng,
        latitudeDelta: 2,
        longitudeDelta: 2,
      };
    }
    return DEFAULT_REGION;
  }, [selectedPlace, userLocation, mappedPosts]);

  useEffect(() => {
    if (selectedPlace?.latitude && selectedPlace?.longitude && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }, 500);
    }
  }, [selectedPlace]);

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mapa</Text>
        <Pressable style={styles.searchButton} onPress={() => setShowSearch(true)}>
          <Ionicons name="search" size={18} color={colors.text} />
          <Text style={styles.searchButtonText}>Buscar local</Text>
        </Pressable>
      </View>

      {!isGoogleMapsConfigured() && (
        <Text style={styles.apiHint}>
          Adicione EXPO_PUBLIC_GOOGLE_MAPS_API_KEY para carregar o Google Maps.
        </Text>
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={mapRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {mappedPosts.map((post) => (
            <Marker
              key={post.id}
              coordinate={{
                latitude: post.locationLat,
                longitude: post.locationLng,
              }}
              title={post.location || post.username}
              description={post.description}
            >
              <View style={styles.markerBubble}>
                <Ionicons name="airplane" size={14} color="#fff" />
              </View>
              <Callout>
                <View style={styles.callout}>
                  {post.imageUri ? (
                    <Image source={{ uri: post.imageUri }} style={styles.calloutImage} />
                  ) : null}
                  <Text style={styles.calloutTitle}>{post.location || 'Publicação'}</Text>
                  <Text style={styles.calloutUser}>@{post.username}</Text>
                </View>
              </Callout>
            </Marker>
          ))}

          {selectedPlace?.latitude && selectedPlace?.longitude ? (
            <Marker
              coordinate={{
                latitude: selectedPlace.latitude,
                longitude: selectedPlace.longitude,
              }}
              pinColor={colors.primary}
              title={selectedPlace.displayName}
              description={selectedPlace.address}
            />
          ) : null}
        </MapView>
      )}

      <View style={[styles.legend, { paddingBottom: bottomPadding + spacing.md }]}>
        <Ionicons name="location" size={16} color={colors.primary} />
        <Text style={styles.legendText}>
          {mappedPosts.length} publicação{mappedPosts.length === 1 ? '' : 'ões'} com local no mapa
        </Text>
      </View>

      <LocationPickerModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={setSelectedPlace}
        initialLocation={selectedPlace}
      />
    </View>
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
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
    },
    searchButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.borderLight,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
    },
    searchButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    apiHint: {
      fontSize: 12,
      color: colors.textSecondary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
    },
    map: {
      flex: 1,
    },
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    markerBubble: {
      backgroundColor: colors.primary,
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#fff',
    },
    callout: {
      width: 180,
    },
    calloutImage: {
      width: 180,
      height: 100,
      borderRadius: 8,
      marginBottom: spacing.xs,
      backgroundColor: colors.borderLight,
    },
    calloutTitle: {
      fontWeight: '700',
      fontSize: 13,
      color: colors.text,
    },
    calloutUser: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    legendText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
  });
}
