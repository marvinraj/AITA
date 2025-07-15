// Utility functions for adding location data to itinerary items
import { supabase } from './supabase';

export interface LocationData {
  latitude: number;
  longitude: number;
  place_id?: string;
  formatted_address?: string;
}

// Function to add location data to an itinerary item
export const addLocationToItineraryItem = async (itemId: string, locationData: LocationData) => {
  try {
    const { data, error } = await supabase
      .from('itinerary_items')
      .update({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding location to itinerary item:', error);
    throw error;
  }
};

// Function to search for location using Google Places API (if available)
export const searchLocationByName = async (locationName: string): Promise<LocationData | null> => {
  try {
    const googlePlacesApiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!googlePlacesApiKey) {
      console.warn('Google Places API key not found');
      return null;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(locationName)}&key=${googlePlacesApiKey}`
    );

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const place = data.results[0];
      return {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        place_id: place.place_id,
        formatted_address: place.formatted_address,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error searching for location:', error);
    return null;
  }
};

// Function to bulk add location data to all items in a trip
export const addLocationDataToTripItems = async (tripId: string) => {
  try {
    // Get all items without location data
    const { data: items, error } = await supabase
      .from('itinerary_items')
      .select('*')
      .eq('trip_id', tripId)
      .is('latitude', null);

    if (error) throw error;
    if (!items || items.length === 0) return;

    console.log(`Found ${items.length} items without location data`);

    // Try to add location data to each item
    for (const item of items) {
      if (item.location) {
        console.log(`Searching location for: ${item.title} at ${item.location}`);
        const locationData = await searchLocationByName(item.location);
        
        if (locationData) {
          await addLocationToItineraryItem(item.id, locationData);
          console.log(`Added location data for: ${item.title}`);
        } else {
          console.log(`No location found for: ${item.title}`);
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.error('Error adding location data to trip items:', error);
    throw error;
  }
};

// Common destination coordinates for fallback
export const getDestinationCoordinates = (destination: string): { latitude: number; longitude: number } => {
  const commonDestinations: { [key: string]: { latitude: number; longitude: number } } = {
    'New York': { latitude: 40.7128, longitude: -74.0060 },
    'London': { latitude: 51.5074, longitude: -0.1278 },
    'Paris': { latitude: 48.8566, longitude: 2.3522 },
    'Tokyo': { latitude: 35.6762, longitude: 139.6503 },
    'Sydney': { latitude: -33.8688, longitude: 151.2093 },
    'Dubai': { latitude: 25.2048, longitude: 55.2708 },
    'Singapore': { latitude: 1.3521, longitude: 103.8198 },
    'Hong Kong': { latitude: 22.3193, longitude: 114.1694 },
    'Bangkok': { latitude: 13.7563, longitude: 100.5018 },
    'Los Angeles': { latitude: 34.0522, longitude: -118.2437 },
    'San Francisco': { latitude: 37.7749, longitude: -122.4194 },
    'Chicago': { latitude: 41.8781, longitude: -87.6298 },
    'Miami': { latitude: 25.7617, longitude: -80.1918 },
    'Toronto': { latitude: 43.6532, longitude: -79.3832 },
    'Vancouver': { latitude: 49.2827, longitude: -123.1207 },
    'Barcelona': { latitude: 41.3851, longitude: 2.1734 },
    'Rome': { latitude: 41.9028, longitude: 12.4964 },
    'Amsterdam': { latitude: 52.3676, longitude: 4.9041 },
    'Berlin': { latitude: 52.5200, longitude: 13.4050 },
    'Madrid': { latitude: 40.4168, longitude: -3.7038 },
    'Mumbai': { latitude: 19.0760, longitude: 72.8777 },
    'Delhi': { latitude: 28.7041, longitude: 77.1025 },
    'Bangalore': { latitude: 12.9716, longitude: 77.5946 },
    'Kuala Lumpur': { latitude: 3.1390, longitude: 101.6869 },
    'Jakarta': { latitude: -6.2088, longitude: 106.8456 },
    'Seoul': { latitude: 37.5665, longitude: 126.9780 },
    'Beijing': { latitude: 39.9042, longitude: 116.4074 },
    'Shanghai': { latitude: 31.2304, longitude: 121.4737 },
    'Melbourne': { latitude: -37.8136, longitude: 144.9631 },
    'Auckland': { latitude: -36.8485, longitude: 174.7633 },
  };

  // Try to find exact match first
  if (commonDestinations[destination]) {
    return commonDestinations[destination];
  }

  // Try to find partial match
  for (const [city, coords] of Object.entries(commonDestinations)) {
    if (destination.toLowerCase().includes(city.toLowerCase()) || 
        city.toLowerCase().includes(destination.toLowerCase())) {
      return coords;
    }
  }

  // Default to San Francisco if no match found
  return { latitude: 37.7749, longitude: -122.4194 };
};
