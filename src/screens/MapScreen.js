import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

export default function MapScreen() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  return (
    <View style={{ marginTop: 50 }}>
      <Text>
        {location
          ? `Lat: ${location.coords.latitude} / Lng: ${location.coords.longitude}`
          : 'Carregando...'}
      </Text>
    </View>
  );
}