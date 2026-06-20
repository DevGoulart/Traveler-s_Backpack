import * as Location from 'expo-location';
import { getGoogleMapsApiKey, isGoogleMapsConfigured } from '../config/googleMaps';

function mapGooglePlace(prediction, details = null) {
  const name = details?.name || prediction.structured_formatting?.main_text || prediction.description;
  const address = details?.formatted_address || prediction.structured_formatting?.secondary_text || prediction.description;
  const lat = details?.geometry?.location?.lat;
  const lng = details?.geometry?.location?.lng;

  return {
    id: prediction.place_id,
    name,
    address,
    latitude: typeof lat === 'number' ? lat : null,
    longitude: typeof lng === 'number' ? lng : null,
    displayName: name,
  };
}

async function fetchPlaceDetails(placeId) {
  const apiKey = getGoogleMapsApiKey();
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,formatted_address,geometry&language=pt-BR&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error(data.status || 'PLACE_DETAILS_FAILED');
  }

  return data.result;
}

export async function searchPlaces(query, { latitude, longitude } = {}) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  if (isGoogleMapsConfigured()) {
    const apiKey = getGoogleMapsApiKey();
    const locationBias = latitude && longitude
      ? `&location=${latitude},${longitude}&radius=50000`
      : '';

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(trimmed)}&language=pt-BR&types=establishment|geocode${locationBias}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && Array.isArray(data.predictions)) {
      return data.predictions.slice(0, 8).map((prediction) => mapGooglePlace(prediction));
    }

    if (data.status === 'ZERO_RESULTS') {
      return [];
    }
  }

  return searchPlacesFallback(trimmed);
}

export async function resolvePlace(place) {
  if (place.latitude != null && place.longitude != null) {
    return place;
  }

  if (isGoogleMapsConfigured() && place.id) {
    const details = await fetchPlaceDetails(place.id);
    return mapGooglePlace({ place_id: place.id, description: place.name }, details);
  }

  return place;
}

async function searchPlacesFallback(query) {
  try {
    const results = await Location.geocodeAsync(query);
    if (!results.length) return [];

    return results.slice(0, 5).map((result, index) => {
      const city = result.city || result.subregion || result.region || '';
      const street = [result.street, result.streetNumber].filter(Boolean).join(', ');
      const name = street || city || query;
      const address = [street, city, result.region, result.country].filter(Boolean).join(', ');

      return {
        id: `fallback-${index}-${name}`,
        name,
        address,
        latitude: result.latitude,
        longitude: result.longitude,
        displayName: address || name,
      };
    });
  } catch {
    return [];
  }
}

export async function getCurrentPlace() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const position = await Location.getCurrentPositionAsync({});
  const { latitude, longitude } = position.coords;

  if (isGoogleMapsConfigured()) {
    const apiKey = getGoogleMapsApiKey();
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=pt-BR&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    const result = data.results?.[0];

    if (result) {
      return {
        id: result.place_id || `current-${latitude}-${longitude}`,
        name: result.address_components?.[0]?.long_name || 'Local atual',
        address: result.formatted_address,
        latitude,
        longitude,
        displayName: result.formatted_address?.split(',')[0] || 'Local atual',
      };
    }
  }

  const places = await Location.reverseGeocodeAsync({ latitude, longitude });
  const place = places[0];
  if (!place) return null;

  const city = place.city || place.subregion || place.region || '';
  const street = [place.street, place.streetNumber].filter(Boolean).join(', ');
  const displayName = city || street || 'Local atual';

  return {
    id: `current-${latitude}-${longitude}`,
    name: displayName,
    address: [street, city, place.region].filter(Boolean).join(', '),
    latitude,
    longitude,
    displayName,
  };
}
