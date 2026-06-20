import Constants from 'expo-constants';

export function getGoogleMapsApiKey() {
  return Constants.expoConfig?.extra?.googleMapsApiKey
    || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
    || '';
}

export function isGoogleMapsConfigured() {
  return getGoogleMapsApiKey().length > 0;
}
