import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export const getCurrentUserLocation = async (): Promise<UserLocation | null> => {
  try {
    // Check if location services are enabled
    const hasLocationServicesEnabled = await Location.hasServicesEnabledAsync();
    if (!hasLocationServicesEnabled) {
      Alert.alert(
        'Location Services Disabled',
        'Please enable location services in your device settings to use this feature.',
        [{ text: 'OK' }]
      );
      return null;
    }

    // Request foreground permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'This feature requires location permission to show your current location on the map.',
        [{ text: 'OK' }]
      );
      return null;
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,
      distanceInterval: 1,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting user location:', error);
    Alert.alert(
      'Location Error',
      'Failed to get your current location. Please try again.',
      [{ text: 'OK' }]
    );
    return null;
  }
};

export const animateToUserLocation = async (mapRef: any) => {
  const userLocation = await getCurrentUserLocation();
  if (userLocation && mapRef.current) {
    mapRef.current.animateToRegion({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  }
};
